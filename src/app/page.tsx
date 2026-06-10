'use client';

import React, { useState, useEffect } from 'react';
import { UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import DNASettings from '@/components/DNASettings';
import DNAProfileView from '@/components/DNAProfileView';
import StyleCloner from '@/components/StyleCloner';
import ChatArea from '@/components/ChatArea';
import { 
  Brain, Cpu, Network, ShieldCheck, Sun, Moon, 
  Volume2, VolumeX, Maximize, Minimize, AlignCenter, AlignLeft, 
  Expand, Shrink, Sliders, ChevronLeft, Menu, X, Plus, 
  MessageSquare, Settings, Upload, Check, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Chat Memory and History
export interface Message {
  id: string;
  sender: 'user' | 'normal-ai' | 'retero-ai';
  text: string;
  reasoning?: string;
  timestamp: Date;
}

export interface SavedConversation {
  id: string;
  name: string;
  messages: Message[];
  persona: UserPersona;
  mode: ToneMode;
  mood: MoodState;
  timestamp: string;
}

// Premium Soft Synthesizer Engine using Web Audio API (Sine wave chimes)
let audioCtx: AudioContext | null = null;
export function playSynthSound(type: 'click' | 'scan' | 'success' | 'delete', isMuted: boolean) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine'; // Premium soft clicking
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(650, now + 0.35);
      gain.gain.setValueAtTime(0.008, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      osc.type = 'sine'; // Elegant bell sweep
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'delete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.warn('AudioContext failed to play sound', e);
  }
}

export default function Home() {
  // 1. Initial State for User DNA Persona
  const [persona, setPersona] = useState<UserPersona>({
    name: 'User',
    tone: 'Casual',
    length: 'Medium',
    level: 'Beginner',
    language: 'Thanglish',
    emojiUsage: true,
    role: 'Student',
  });

  // 2. States for active elements, APIs, and muted sound settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMuted, setIsMuted] = useState(false);
  const [bgPatternActive, setBgPatternActive] = useState(true);
  const [hfModel, setHfModel] = useState('Qwen/Qwen2.5-72B-Instruct');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [engine, setEngine] = useState<'pollinations' | 'gemini' | 'openai' | 'huggingface' | 'groq' | 'nvidia'>('nvidia');

  const [config, setConfig] = useState({
    hasGeminiKey: false,
    hasOpenaiKey: false,
    hasHfToken: false,
    hasGroqKey: false,
    hasNvidiaKey: true,
    hfModel: 'Qwen/Qwen2.5-72B-Instruct',
    groqModel: 'llama-3.3-70b-versatile',
  });

  // Alignment & Fullscreen states
  const [layoutWidth, setLayoutWidth] = useState<'standard' | 'full'>('standard');
  const [isCentered, setIsCentered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Left Collapsible Sidebar and Right Sliding Drawer states (Claude AI UI)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState<'dna' | 'cloner' | 'settings' | null>(null);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  // Lifted Chat & Conversation States
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [mode, setMode] = useState<ToneMode>('Casual');
  const [mood, setMood] = useState<MoodState>('Neutral');

  const toggleFullscreen = () => {
    playSynthSound('click', isMuted);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const toggleBgPattern = () => {
    const nextVal = !bgPatternActive;
    localStorage.setItem('retero_bg_active', String(nextVal));
    setBgPatternActive(nextVal);
    playSynthSound('click', isMuted);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Load configuration, theme, audio preferences, and saved sessions on mount
  useEffect(() => {
    // 1. Theme configuration
    const savedTheme = localStorage.getItem('retero_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }

    // 2. Mute status configuration
    const savedMute = localStorage.getItem('retero_mute') === 'true';
    setIsMuted(savedMute);

    // 2.5. Background pattern configuration
    const savedBgActive = localStorage.getItem('retero_bg_active') !== 'false';
    setBgPatternActive(savedBgActive);

    // 3. Fetch server config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.hfModel) setHfModel(data.hfModel);
        if (data.groqModel) setGroqModel(data.groqModel);
      })
      .catch(err => console.error('Failed to load server configuration', err));

    // 4. Load saved sessions
    const stored = localStorage.getItem('retero_saved_conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedConversation[];
        setSavedConversations(parsed);
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
    setCurrentSessionId(Date.now().toString());
  }, []);

  // Auto-save session to history when messages change
  useEffect(() => {
    const hasUserMessages = messages.some(m => m.sender === 'user');
    if (!hasUserMessages || !currentSessionId) return;

    const firstUserMsg = messages.find(m => m.sender === 'user')?.text || 'Chat Session';
    const truncatedName = firstUserMsg.length > 20 ? firstUserMsg.slice(0, 18) + '...' : firstUserMsg;

    const updatedConv: SavedConversation = {
      id: currentSessionId,
      name: truncatedName,
      messages,
      persona,
      mode,
      mood,
      timestamp: new Date().toISOString()
    };

    setSavedConversations(prev => {
      const existingIdx = prev.findIndex(c => c.id === currentSessionId);
      let updated: SavedConversation[];

      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = updatedConv;
      } else {
        updated = [updatedConv, ...prev].slice(0, 5);
      }

      localStorage.setItem('retero_saved_conversations', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId, persona, mode, mood]);

  const loadConversation = (conv: SavedConversation) => {
    playSynthSound('success', isMuted);
    setCurrentSessionId(conv.id);
    setMessages(conv.messages);
    setMode(conv.mode);
    setMood(conv.mood);
    if (conv.persona) {
      setPersona(conv.persona);
    }
  };

  const startNewSession = () => {
    playSynthSound('delete', isMuted);
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
  };

  const triggerNewChat = () => {
    startNewSession();
  };

  // Monitor theme shifts and apply root document classes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('retero_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    playSynthSound('click', isMuted);
    setTheme(nextTheme);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    localStorage.setItem('retero_mute', String(nextMute));
    setIsMuted(nextMute);
    if (!nextMute) {
      setTimeout(() => playSynthSound('click', false), 50);
    }
  };



  const toggleDrawer = (panel: 'dna' | 'cloner' | 'settings') => {
    playSynthSound('click', isMuted);
    setDrawerOpen(prev => prev === panel ? null : panel);
  };

  return (
    <main 
      className="min-h-screen w-full flex bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans relative animate-fade"
      style={bgPatternActive ? { backgroundImage: "url('/bg-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '800px 1000px' } : {}}
    >
      
      {/* 1. LEFT COLLAPSIBLE SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col z-30 select-none relative overflow-hidden flex-shrink-0`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] h-16 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--card-bg)] shadow-sm overflow-hidden">
              <img src="/logo.png" alt="Retro AI Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-sm font-serif font-bold tracking-tight text-[var(--foreground)]">Retro AI</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Start New Chat Button */}
        <div className="p-3.5 flex-shrink-0">
          <button
            onClick={triggerNewChat}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-semibold hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start new chat</span>
          </button>
        </div>

        {/* History / Sessions Label */}
        <div className="px-4 py-1.5 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Control Modules</span>
        </div>

        {/* Global Navigation controls */}
        <div className="px-2.5 flex flex-col gap-1 select-none">
          <button
            onClick={() => toggleDrawer('dna')}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold text-left transition-all hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 flex items-center gap-2.5 cursor-pointer ${
              drawerOpen === 'dna' ? 'bg-neutral-200/60 dark:bg-neutral-800/60 text-[var(--accent-primary)]' : 'text-neutral-600 dark:text-neutral-350'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Persona DNA</span>
          </button>

          <button
            onClick={() => toggleDrawer('cloner')}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold text-left transition-all hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 flex items-center gap-2.5 cursor-pointer ${
              drawerOpen === 'cloner' ? 'bg-neutral-200/60 dark:bg-neutral-800/60 text-[var(--accent-primary)]' : 'text-neutral-600 dark:text-neutral-350'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Style Scanner</span>
          </button>

          <button
            onClick={() => toggleDrawer('settings')}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold text-left transition-all hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 flex items-center gap-2.5 cursor-pointer ${
              drawerOpen === 'settings' ? 'bg-neutral-200/60 dark:bg-neutral-800/60 text-[var(--accent-primary)]' : 'text-neutral-600 dark:text-neutral-350'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Core Engines</span>
          </button>
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1.5 border-t border-[var(--border-color)] mt-3">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono px-2 mb-1">Recent Conversations</span>
          <div className="flex flex-col gap-1 text-xs">
            {savedConversations.length === 0 ? (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic px-2">No history in memory yet</span>
            ) : (
              savedConversations.map((conv) => {
                const isCurrent = conv.id === currentSessionId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium text-left transition-all hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 flex items-center gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-neutral-200/60 dark:bg-neutral-800/60 text-[var(--accent-primary)] font-bold'
                        : 'text-neutral-600 dark:text-neutral-350'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                    <span className="truncate flex-1">{conv.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Profile preferences & switch dock */}
        <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--sidebar-bg)] flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">Audio Sync Node</span>

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-500 cursor-pointer"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200/50 dark:border-neutral-800/50 pt-2.5">
            <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">Layout Scaling</span>
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-500 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200/50 dark:border-neutral-800/50 pt-2.5">
            <span className="font-mono text-[9px] uppercase font-bold text-neutral-400">Watermark BG</span>
            {/* BG Pattern Toggle */}
            <button
              onClick={toggleBgPattern}
              className="px-2 py-0.5 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-500 cursor-pointer text-[9px] font-mono font-bold tracking-wider text-[var(--accent-primary)]"
              title={bgPatternActive ? 'Disable background pattern' : 'Enable background pattern'}
            >
              {bgPatternActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

      </motion.aside>

      {/* Sidebar Trigger button when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4 top-4 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-600 shadow-sm hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] z-20 cursor-pointer transition-all"
          title="Open Sidebar"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
      )}

      {/* 2. CENTERED MAIN CHAT CANVAS */}
      <section className="flex-1 h-screen flex flex-col relative overflow-hidden transition-all duration-300">
        
        {/* Top Header Deck (only holds page actions / workspace layout controls) */}
        <header className="w-full h-16 border-b border-[var(--border-color)] px-6 flex items-center justify-between flex-shrink-0 relative bg-[var(--background)]">
          <div className="flex items-center gap-3">
            {/* If sidebar is open, we display a spacer, if collapsed we show a label */}
            {sidebarOpen ? (
              <span className="text-xs font-semibold text-neutral-500 uppercase font-mono">Workspace Canvas</span>
            ) : (
              <div className="flex items-center gap-2.5 pl-10">
                <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--card-bg)] overflow-hidden">
                  <img src="/logo.png" alt="Retro AI Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-serif font-bold">Retro AI</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Standard vs Fluid alignment */}
            <button
              onClick={() => {
                playSynthSound('click', isMuted);
                setLayoutWidth(prev => prev === 'standard' ? 'full' : 'standard');
              }}
              className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-600 shadow-sm hover:border-[var(--accent-primary)] cursor-pointer"
              title={layoutWidth === 'standard' ? 'Switch to Fluid Full Width' : 'Switch to Standard Center Width'}
            >
              {layoutWidth === 'standard' ? <Expand className="w-4 h-4" /> : <Shrink className="w-4 h-4" />}
            </button>

            {/* Layout Drawer Toggles for quick access */}
            <button
              onClick={() => toggleDrawer('dna')}
              className={`p-1.5 rounded-lg border border-[var(--border-color)] text-neutral-600 shadow-sm hover:border-[var(--accent-primary)] cursor-pointer ${
                drawerOpen === 'dna' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-neutral-100 dark:bg-neutral-800' : 'bg-[var(--card-bg)]'
              }`}
              title="DNA Preferences Calibrator"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Center Chat Workspace */}
        <div className={`flex-1 overflow-hidden flex flex-col justify-between py-6 px-4 md:px-8 w-full transition-all duration-300 ${
          layoutWidth === 'standard' ? 'max-w-3xl mx-auto' : 'max-w-none px-6 md:px-12'
        }`}>
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <ChatArea 
              persona={persona} 
              setPersona={setPersona}
              apiKey="" 
              openaiApiKey="" 
              hfToken="" 
              hfModel={hfModel} 
              groqApiKey=""
              groqModel={groqModel}
              engine={engine} 
              isMuted={isMuted}
              newChatTrigger={newChatTrigger}
              messages={messages}
              setMessages={setMessages}
              savedConversations={savedConversations}
              setSavedConversations={setSavedConversations}
              currentSessionId={currentSessionId}
              setCurrentSessionId={setCurrentSessionId}
              mode={mode}
              setMode={setMode}
              mood={mood}
              setMood={setMood}
            />
          </div>

          {/* Minimal info footer in center workspace */}
          <footer className="w-full text-center text-[10px] text-neutral-400 dark:text-neutral-500 font-medium select-none pt-4 border-t border-[var(--border-color)]/30 font-mono uppercase">
            Retro AI Core Engine Pipeline • Calibrated Personalization Layer
          </footer>

        </div>

      </section>

      {/* 3. RIGHT HAND SLIDING DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Semi-transparent Overlay to block interactions on main chat if mobile */}
            <div 
              onClick={() => setDrawerOpen(null)}
              className="fixed inset-0 bg-black/5 dark:bg-black/20 z-30 md:hidden"
            />
            
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full sm:w-[360px] md:w-[390px] h-screen bg-[var(--card-bg)] border-l border-[var(--border-color)] fixed right-0 top-0 z-40 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--card-bg)] z-10 h-16">
                <h2 className="text-xs font-bold tracking-tight uppercase font-mono flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                  {drawerOpen === 'dna' && '🧬 DNA Calibrator'}
                  {drawerOpen === 'cloner' && '📋 Style Scanner'}
                  {drawerOpen === 'settings' && '⚡ Core Engines'}
                </h2>
                <button 
                  onClick={() => setDrawerOpen(null)}
                  className="p-1 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5">
                
                {/* 3a. DNA Prefs Panel */}
                {drawerOpen === 'dna' && (
                  <div className="flex flex-col gap-6">
                    <DNASettings 
                      persona={persona} 
                      setPersona={setPersona} 
                      isMuted={isMuted} 
                    />
                    
                    <div className="border-t border-[var(--border-color)] pt-5 flex flex-col gap-3.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">🧬 DNA Sequence Helix Matrix</h3>
                      <DNAProfileView persona={persona} />
                    </div>
                  </div>
                )}

                {/* 3b. Style Scanner Panel */}
                {drawerOpen === 'cloner' && (
                  <StyleCloner 
                    persona={persona} 
                    setPersona={setPersona} 
                    apiKey="" 
                    isMuted={isMuted} 
                  />
                )}

                {/* 3c. Core Engines Configuration */}
                {drawerOpen === 'settings' && (
                  <div className="flex flex-col gap-6 font-sans">
                    <div className="pb-1">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                        Retro AI runs a modular system engine. Tweak your configuration core node below to query different LLMs in real-time.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Select Core Completion Model:</span>
                      
                      <div className="flex flex-col gap-2">
                        {([
                          { id: 'nvidia', label: '🟢 NVIDIA Kimi-k2.6 (Reasoning)' },
                          { id: 'pollinations', label: '🚀 Pollinations Core (Free)' },
                          { id: 'openai', label: '🧠 OpenAI GPT Core' },
                          { id: 'gemini', label: '✨ Google Gemini Core' },
                          { id: 'huggingface', label: '🤗 Hugging Face Server' },
                          { id: 'groq', label: '⚡ Groq LPU Server' }
                        ] as const).map(item => {
                          const isSelected = engine === item.id;
                          let isConfigured = true;
                          if (item.id === 'openai') isConfigured = config.hasOpenaiKey;
                          if (item.id === 'gemini') isConfigured = config.hasGeminiKey;
                          if (item.id === 'huggingface') isConfigured = config.hasHfToken;
                          if (item.id === 'groq') isConfigured = config.hasGroqKey;
                          if (item.id === 'nvidia') isConfigured = config.hasNvidiaKey;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                playSynthSound('click', isMuted);
                                setEngine(item.id);
                              }}
                              className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'border-[var(--accent-primary)] bg-[var(--background)] text-[var(--accent-primary)] shadow-sm' 
                                  : 'border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-600 hover:border-neutral-400'
                              }`}
                            >
                              <span>{item.label}</span>
                              <span className={`w-2 h-2 rounded-full ${
                                item.id === 'pollinations' ? 'bg-emerald-500 animate-pulse' : isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
                              }`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Engine Node Security:</span>
                      
                      <div className="flex flex-col gap-3 text-xs">
                        {/* NVIDIA Core */}
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">NVIDIA Kimi Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Running moonshotai/kimi-k2.6 over NVIDIA AI integrations. Securely configured via client authorization token.</span>
                          <span className="text-[9px] text-[#00E65A] font-bold mt-1 font-mono">ACTIVE (PROD ENGINE)</span>
                        </div>

                        {/* Pollinations */}
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Pollinations Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Keyless completion server. Runs GPT-4o-mini logic.</span>
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 font-mono">ACTIVE (FREE)</span>
                        </div>

                        {/* Groq */}
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Groq Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Configured via GROQ_API_KEY in environment variables. Model: {groqModel}</span>
                          <span className={`text-[9px] font-bold mt-1 font-mono ${config.hasGroqKey ? 'text-emerald-500' : 'text-neutral-400'}`}>
                            {config.hasGroqKey ? 'ACTIVE (SECURE)' : 'OFFLINE'}
                          </span>
                        </div>

                        {/* Gemini */}
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Gemini Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Configured via GEMINI_API_KEY. Model: gemini-1.5-flash</span>
                          <span className={`text-[9px] font-bold mt-1 font-mono ${config.hasGeminiKey ? 'text-emerald-500' : 'text-neutral-400'}`}>
                            {config.hasGeminiKey ? 'ACTIVE (SECURE)' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
