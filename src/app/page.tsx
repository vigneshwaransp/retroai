'use client';

import React, { useState, useEffect } from 'react';
import { UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import DNASettings from '@/components/DNASettings';
import DNAProfileView from '@/components/DNAProfileView';
import StyleCloner from '@/components/StyleCloner';
import ChatArea from '@/components/ChatArea';
import RagAgent from '@/components/RagAgent';
import Logo from '@/components/Logo';
import { 
  Brain, Cpu, Network, ShieldCheck, Sun, Moon, 
  Volume2, VolumeX, Maximize, Minimize, AlignCenter, AlignLeft, 
  Expand, Shrink, Sliders, ChevronLeft, Menu, X, Plus, 
  MessageSquare, Settings, Upload, Check, Activity, Database,
  Trash2, Lock, RefreshCw, FileText,
  Home as HomeIcon, LayoutGrid, Puzzle, BookOpen, Heart, Target, ArrowRight, Users, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Chat Memory and History
export interface Message {
  id: string;
  sender: 'user' | 'normal-ai' | 'cresent-ai';
  text: string;
  reasoning?: string;
  timestamp: Date;
  sources?: { title: string; url: string; snippet?: string }[];
  judgeReport?: any;
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'success') {
      // Pleasant 3-note chime: C5 → E5 → G5 (major chord arpeggio)
      const osc2 = audioCtx.createOscillator();
      const osc3 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      const gain3 = audioCtx.createGain();
      osc2.connect(gain2); gain2.connect(audioCtx.destination);
      osc3.connect(gain3); gain3.connect(audioCtx.destination);
      osc.type = 'sine'; osc2.type = 'sine'; osc3.type = 'sine';
      // Note 1: C5 at t=0
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
      // Note 2: E5 at t=0.1s
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.016, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.start(now); osc2.stop(now + 0.5);
      // Note 3: G5 at t=0.2s
      osc3.frequency.setValueAtTime(783.99, now + 0.2);
      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.setValueAtTime(0.014, now + 0.2);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc3.start(now); osc3.stop(now + 0.6);
      return; // early return — osc already started above
    } else if (type === 'delete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.014, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    console.warn('AudioContext failed to play sound', e);
  }
}

const DNAHelixBg = ({ className = '' }: { className?: string }) => {
  return (
    <svg className={`pointer-events-none select-none absolute opacity-[0.08] ${className}`} viewBox="0 0 200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,0 C120,50 120,100 50,150 C-20,200 -20,250 50,300 C120,350 120,400 50,450 C-20,500 -20,550 50,600" stroke="#FBBF24" strokeWidth="2" strokeDasharray="3,3" />
      <path d="M150,0 C80,50 80,100 150,150 C220,200 220,250 150,300 C80,350 80,400 150,450 C220,500 220,550 150,600" stroke="#FBBF24" strokeWidth="2" />
      {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550].map((y, idx) => {
        const phase = (y / 150) * Math.PI;
        const x1 = 100 - Math.sin(phase) * 50;
        const x2 = 100 + Math.sin(phase) * 50;
        return (
          <g key={idx}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#FBBF24" strokeWidth="1" opacity="0.4" />
            <circle cx={x1} cy={y} r="2.5" fill="#FBBF24" />
            <circle cx={x2} cy={y} r="2.5" fill="#F59E0B" />
          </g>
        );
      })}
    </svg>
  );
};

export default function Home() {

  // 1. Initial State for User DNA Persona
  const [persona, setPersona] = useState<UserPersona>({
    name: 'User',
    tone: 'Casual',
    length: 'Medium',
    level: 'Beginner',
    language: 'English',
    emojiUsage: false,
    role: 'Student',
  });

  // 2. States for active elements, APIs, and muted sound settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [accentColor, setAccentColor] = useState<'silver' | 'titanium' | 'obsidian' | 'platinum' | 'carbon'>('titanium');
  const [activeView, setActiveView] = useState<'chat' | 'rag'>('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [bgPatternActive, setBgPatternActive] = useState(true);
  const [hfModel, setHfModel] = useState('ibm-granite/granite-3.0-8b-instruct');
  const [hfToken, setHfToken] = useState('');
  const [groqModel, setGroqModel] = useState('qwen/qwen3-32b');
  const [engine, setEngine] = useState<'pollinations' | 'gemini' | 'openai' | 'huggingface' | 'groq' | 'nvidia' | 'gemma'>('nvidia');
  const [isDnaLocked, setIsDnaLocked] = useState(false);
  const [aiJudgeEnabled, setAiJudgeEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [bgIntensity, setBgIntensity] = useState<number>(0.65);
  const [voiceModel, setVoiceModel] = useState<'webspeech' | 'whisper'>('webspeech');
  const [webSearchModel, setWebSearchModel] = useState<'duckduckgo' | 'yahoo'>('duckduckgo');

  // Clone Human mirror states
  const [cloneMode, setCloneMode] = useState<boolean>(false);
  const [cloneData, setCloneData] = useState<{
    name: string;
    age: string;
    interests: string;
    color: string;
    movie: string;
    actor: string;
    actress: string;
  } | null>(null);
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);

  const [config, setConfig] = useState({
    hasGeminiKey: false,
    hasOpenaiKey: false,
    hasHfToken: false,
    hasGroqKey: false,
    hasNvidiaKey: true,
    hfModel: 'ibm-granite/granite-3.0-8b-instruct',
    groqModel: 'llama-3.3-70b-versatile',
  });

  // Daily News states
  interface NewsItem {
    title: string;
    source: string;
    link: string;
  }
  const [news, setNews] = useState<NewsItem[]>([]);
  const [lastUpdatedNews, setLastUpdatedNews] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Live clock state
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');

  // Alignment & Fullscreen states
  const [layoutWidth, setLayoutWidth] = useState<'standard' | 'full'>('standard');
  const [isCentered, setIsCentered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Left Collapsible Sidebar and Right Sliding Drawer states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<'dna' | 'cloner' | 'settings' | 'rag' | 'docs' | 'history' | null>(null);
  const [docLang, setDocLang] = useState<'en' | 'ta'>('en');
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [newsOpen, setNewsOpen] = useState(true);

  // Lifted Chat & Conversation States
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [mode, setMode] = useState<ToneMode>('Casual');
  const [mood, setMood] = useState<MoodState>('Neutral');

  const accentPalettes = {
    silver: { light: '#000000', lightHover: '#212529', dark: '#E5E5E5', darkHover: '#FFFFFF' },
    titanium: { light: '#D97706', lightHover: '#B45309', dark: '#FBBF24', darkHover: '#F59E0B' }, // Amber Gold Cyberpunk Theme
    obsidian: { light: '#1A1A1A', lightHover: '#000000', dark: '#F5F5F5', darkHover: '#FFFFFF' },
    platinum: { light: '#4F4F4F', lightHover: '#6C757D', dark: '#E1E1E1', darkHover: '#F5F5F5' },
    carbon: { light: '#222222', lightHover: '#333333', dark: '#A3A3A3', darkHover: '#CCCCCC' },
  };

  const getDynamicBgSvg = (color: string) => {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.04" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
</svg>`;
    if (typeof window !== 'undefined') {
      try {
        const bytes = new TextEncoder().encode(svgStr);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
        return `data:image/svg+xml;charset=utf-8;base64,${window.btoa(binString)}`;
      } catch (e) {
        console.error("Failed to encode background SVG to base64", e);
      }
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setClockDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateClock();
    const ticker = setInterval(updateClock, 1000);
    return () => clearInterval(ticker);
  }, []);

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
    localStorage.setItem('cresent_bg_active', String(nextVal));
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

  // Set CSS variables for accent color theme
  useEffect(() => {
    const root = document.documentElement;
    const colors = accentPalettes[accentColor];
    if (theme === 'light') {
      root.style.setProperty('--accent-primary', colors.light);
      root.style.setProperty('--accent-primary-hover', colors.lightHover);
    } else {
      root.style.setProperty('--accent-primary', colors.dark);
      root.style.setProperty('--accent-primary-hover', colors.darkHover);
    }
  }, [accentColor, theme]);

  // Load news feed on mount and refresh every 10 minutes
  const fetchNewsFeed = async () => {
    try {
      const res = await fetch('https://ok.surf/api/v1/cors/news-feed');
      if (!res.ok) throw new Error("News fetch error");
      const data = await res.json();
      const techNews = data.Technology || data.Business || [];
      if (techNews.length > 0) {
        return techNews.slice(0, 3).map((n: any) => ({
          title: n.title,
          source: n.source,
          link: n.link
        }));
      }
    } catch (e) {
      console.error("Error fetching news from API", e);
    }
    return [
      { title: "NVIDIA Kimi-k2.6 breaks new ground in long-context AI reasoning architectures.", source: "AI Tech Wire", link: "https://nvidia.com" },
      { title: "Next.js 16 updates SSR rendering pipelines for 40% faster paint times.", source: "Vercel News", link: "https://vercel.com" },
      { title: "Tailwind CSS v4 introduces zero-runtime CSS variables optimization engines.", source: "Tailwind Blog", link: "https://tailwindcss.com" }
    ];
  };

  useEffect(() => {
    const loadNews = async () => {
      const feed = await fetchNewsFeed();
      setNews(feed);
      setLastUpdatedNews(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    loadNews();
    const timer = setInterval(loadNews, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Load configuration, theme, audio preferences, accent colors, and saved sessions on mount
  useEffect(() => {
    setIsMounted(true);
    // 1. Theme configuration
    const savedTheme = localStorage.getItem('cresent_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }

    // Accent Color configuration
    const savedAccent = localStorage.getItem('cresent_accent') as any;
    if (savedAccent && ['silver', 'titanium', 'obsidian', 'platinum', 'carbon'].includes(savedAccent)) {
      setAccentColor(savedAccent);
    }

    // 2. Mute status configuration
    const savedMute = localStorage.getItem('cresent_mute') === 'true';
    setIsMuted(savedMute);

    // 2.5. Background pattern configuration
    const savedBgActive = localStorage.getItem('cresent_bg_active') !== 'false';
    setBgPatternActive(savedBgActive);

    const savedLock = localStorage.getItem('cresent_dna_locked') === 'true';
    setIsDnaLocked(savedLock);

    const savedIntensity = localStorage.getItem('cresent_bg_intensity');
    if (savedIntensity) {
      setBgIntensity(parseFloat(savedIntensity));
    }

    const savedVoiceModel = localStorage.getItem('cresent_voice_model') as 'webspeech' | 'whisper' | null;
    if (savedVoiceModel) setVoiceModel(savedVoiceModel);

    const savedWebSearchModel = localStorage.getItem('cresent_web_search_model') as 'duckduckgo' | 'yahoo' | null;
    if (savedWebSearchModel) setWebSearchModel(savedWebSearchModel);

    const savedCloneMode = localStorage.getItem('cresent_clone_mode') === 'true';
    setCloneMode(savedCloneMode);

    const savedHfToken = localStorage.getItem('cresent_hf_token') || '';
    setHfToken(savedHfToken);

    const savedHfModel = localStorage.getItem('cresent_hf_model') || '';
    if (savedHfModel) setHfModel(savedHfModel);

    const savedCloneData = localStorage.getItem('cresent_clone_data');
    if (savedCloneData) {
      try {
        setCloneData(JSON.parse(savedCloneData));
      } catch (e) {}
    }

    // Load saved persona configuration
    const savedPersona = localStorage.getItem('cresent_persona');
    if (savedPersona) {
      try {
        setPersona(JSON.parse(savedPersona));
      } catch (e) {
        console.error('Failed to parse saved persona', e);
      }
    }

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
    const stored = localStorage.getItem('cresent_saved_conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedConversation[];
        setSavedConversations(parsed);
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
    setCurrentSessionId(Date.now().toString());

    // 5. Interest selection pop-up setup
    const interestShown = localStorage.getItem('cresent_interest_shown') === 'true';
    if (!interestShown) {
      setShowInterestModal(true);
    }
  }, []);

  // Save persona to local storage on changes
  useEffect(() => {
    localStorage.setItem('cresent_persona', JSON.stringify(persona));
  }, [persona]);

  // Clone Mode syncer to persona
  useEffect(() => {
    localStorage.setItem('cresent_clone_mode', String(cloneMode));
    if (cloneData) {
      localStorage.setItem('cresent_clone_data', JSON.stringify(cloneData));
    }
    setPersona(prev => ({
      ...prev,
      cloneMode,
      cloneData
    }));
  }, [cloneMode, cloneData]);

  // Auto-save session to history when messages change
  useEffect(() => {
    if (isLoading) return; // Skip saving to localStorage while message is streaming!
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

      localStorage.setItem('cresent_saved_conversations', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId, persona, mode, mood, isLoading]);

  const loadConversation = (conv: SavedConversation) => {
    playSynthSound('success', isMuted);
    setCurrentSessionId(conv.id);
    setMessages(conv.messages);
    setMode(conv.mode);
    setMood(conv.mood);
    setActiveView('chat'); // Reset back to chat view on loading discussion
    if (conv.persona) {
      setPersona(conv.persona);
    }
  };

  const deleteConversation = (id: string) => {
    playSynthSound('delete', isMuted);
    setSavedConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('cresent_saved_conversations', JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) {
      setMessages([]);
      setCurrentSessionId(Date.now().toString());
    }
  };

  const clearAllConversations = () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
      playSynthSound('delete', isMuted);
      setSavedConversations([]);
      localStorage.removeItem('cresent_saved_conversations');
      setMessages([]);
      setCurrentSessionId(Date.now().toString());
    }
  };

  const startNewSession = () => {
    playSynthSound('delete', isMuted);
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
    setActiveView('chat'); // Reset back to chat view on starting new chat
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
    localStorage.setItem('cresent_theme', theme);
  }, [theme]);

  // Save accent changes to storage
  useEffect(() => {
    localStorage.setItem('cresent_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('cresent_dna_locked', String(isDnaLocked));
  }, [isDnaLocked]);

  const activeColorHex = engine === 'gemma' ? '#ec4899' : (theme === 'light' ? accentPalettes[accentColor].light : accentPalettes[accentColor].dark);
  const bgImageValue = isMounted && bgPatternActive ? `url("${getDynamicBgSvg(activeColorHex)}")` : 'none';



  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    playSynthSound('click', isMuted);
    setTheme(nextTheme);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    localStorage.setItem('cresent_mute', String(nextMute));
    setIsMuted(nextMute);
    if (!nextMute) {
      setTimeout(() => playSynthSound('click', false), 50);
    }
  };

  const toggleDrawer = (panel: 'dna' | 'cloner' | 'settings' | 'rag' | 'docs') => {
    playSynthSound('click', isMuted);
    setDrawerOpen(prev => prev === panel ? null : panel);
  };


  return (
    <main 
      className={`min-h-screen w-full flex bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans relative z-0 ${engine === 'gemma' ? 'genai-mode' : ''}`}
      style={{ backgroundImage: bgImageValue, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      
      {/* Flat grid background is handled by CSS body class */}
      
      {/* 1. LEFT COLLAPSIBLE SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col z-30 select-none relative overflow-hidden flex-shrink-0`}
      >
        {/* Brand Header / Top Sidebar spacing */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] h-16 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Navigation Deck</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Tabs List */}
        <div className="flex-1 py-4 flex flex-col gap-2 px-3 select-none">
          {([
            { id: 'home', label: 'Home Feed', icon: HomeIcon, active: activeView === 'chat' && drawerOpen === null, onClick: () => { setActiveView('chat'); setDrawerOpen(null); } },
            { id: 'clone', label: cloneMode ? 'Human Clone (Active)' : 'Mirror Persona', icon: Users, active: cloneMode, onClick: () => { setShowCloneModal(true); } },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare, active: drawerOpen === 'history', onClick: () => { setActiveView('chat'); setDrawerOpen(prev => prev === 'history' ? null : 'history'); } },
            { id: 'memory', label: 'DNA Customizer', icon: Brain, active: drawerOpen === 'dna', onClick: () => { setDrawerOpen(prev => prev === 'dna' ? null : 'dna'); } },
            { id: 'tools', label: 'RAG Knowledge', icon: LayoutGrid, active: activeView === 'rag', onClick: () => { setActiveView(prev => prev === 'rag' ? 'chat' : 'rag'); setDrawerOpen(null); } },
            { id: 'integrations', label: 'Style Cloner', icon: Puzzle, active: drawerOpen === 'cloner', onClick: () => { setDrawerOpen(prev => prev === 'cloner' ? null : 'cloner'); } },
            { id: 'settings', label: 'Settings', icon: Settings, active: drawerOpen === 'settings', onClick: () => { setDrawerOpen(prev => prev === 'settings' ? null : 'settings'); } },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSynthSound('click', isMuted);
                  tab.onClick();
                }}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 cursor-pointer relative ${
                  tab.active 
                    ? 'text-white bg-blue-600' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clock & System Online widgets in sidebar */}
        <div className="flex flex-col gap-3.5 border-t border-[var(--border-color)] pt-4 bg-[var(--background)] flex-shrink-0 pb-4">


          {/* System Online Widget */}
          <div className="mx-3.5 select-none">
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 animate-pulse flex-shrink-0" />
              <div className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-500">
                <span className="leading-none text-slate-800 dark:text-slate-200">System Connected</span>
                <span>Active workspace secure</span>
              </div>
            </div>
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
        <header className="w-full h-16 border-b border-[var(--border-color)] px-6 flex items-center justify-between flex-shrink-0 relative bg-[var(--sidebar-bg)] z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle menu button */}
            <button
              onClick={() => {
                playSynthSound('click', isMuted);
                setSidebarOpen(prev => !prev);
              }}
              className="p-2 border border-[var(--border-color)] bg-[var(--card-bg)] text-slate-600 dark:text-slate-200 hover:text-blue-600 rounded-lg cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Logo and branding */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white relative overflow-hidden">
                <Logo className="w-5.5 h-5.5 relative z-10 filter invert brightness-200" />
              </div>
              <span className="text-sm font-bold tracking-tight select-none text-slate-800 dark:text-slate-100 px-1 py-0.5">
                CresentX
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* DNA outline button */}
            <button
              onClick={() => toggleDrawer('dna')}
              className={`py-1.5 px-3 border rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
                drawerOpen === 'dna' 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-[var(--border-color)] bg-[var(--card-bg)] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="DNA Preferences"
            >
              <Activity className="w-4 h-4" />
              <span>DNA</span>
            </button>

            {/* Docs Button */}
            <button
              onClick={() => toggleDrawer('docs')}
              className={`py-1.5 px-3 border rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
                drawerOpen === 'docs' 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-[var(--border-color)] bg-[var(--card-bg)] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Documentation & Guide"
            >
              <FileText className="w-4 h-4" />
              <span>Docs</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="py-1.5 px-3 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
            </button>


          </div>
        </header>

        {/* Scrollable Center Chat Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'rag' ? (
            <div className="flex-1 overflow-hidden flex flex-col p-6 w-full animate-[fadeIn_0.3s_ease]">
              <div className="flex-1 flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md overflow-hidden relative">
                {/* Browser Control Bar */}
                <div className="h-11 px-4 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)] flex items-center justify-between select-none">
                  {/* Traffic Light Dots */}
                  <div className="flex items-center gap-1.5 w-24">
                    <span className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/40" />
                    <span className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/40" />
                    <span className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/40" />
                  </div>

                  {/* URL Address Bar */}
                  <div className="flex-1 max-w-lg mx-auto h-7 px-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--background)] flex items-center gap-2 text-[11px] text-neutral-500 font-mono shadow-inner select-all justify-center">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">https://ragify-eight.vercel.app</span>
                  </div>

                  {/* Close button */}
                  <div className="flex items-center gap-2 justify-end w-24">
                    <button 
                      onClick={() => {
                        playSynthSound('click', isMuted);
                        setActiveView('chat');
                      }}
                      className="text-[10px] uppercase font-bold text-neutral-400 hover:text-[var(--accent-primary)] font-mono transition-colors cursor-pointer"
                      title="Back to Chat Area"
                    >
                      Close View
                    </button>
                  </div>
                </div>

                {/* Webpage iframe wrapper */}
                <div className="flex-1 w-full bg-white relative">
                  <iframe 
                    src="https://ragify-eight.vercel.app" 
                    className="w-full h-full border-none"
                    title="Ragify RAG Agent Interface"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden w-full relative z-10">
              {/* Center Chat Viewport */}
              <div className={`flex-1 overflow-hidden flex flex-col justify-between py-6 px-4 md:px-8 transition-all duration-300 ${
                layoutWidth === 'standard' ? 'max-w-4xl mx-auto' : 'max-w-none'
              }`}>
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <ChatArea 
                    persona={persona} 
                    setPersona={setPersona}
                    apiKey="" 
                    openaiApiKey="" 
                    hfToken={hfToken} 
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
                    onOpenSettings={() => toggleDrawer('settings')}
                    onTriggerAgentMode={() => setActiveView('rag')}
                    webSearchModel={webSearchModel}
                    aiJudgeEnabled={aiJudgeEnabled}
                    isDnaLocked={isDnaLocked}
                    setIsDnaLocked={setIsDnaLocked}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    cloneMode={cloneMode}
                    cloneData={cloneData}
                  />
                </div>

              </div>
            </div>
          )}
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
              className="w-full sm:w-[360px] md:w-[390px] h-screen bg-black border-l border-[#00ff00] fixed right-0 top-0 z-40 shadow-[0_0_15px_rgba(0,255,0,0.15)] flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#00ff00] flex items-center justify-between sticky top-0 bg-black z-10 h-16">
                <h2 className="text-xs font-black tracking-tight uppercase font-mono flex items-center gap-2 text-[#00ff00]">
                  {drawerOpen === 'dna' && '🧬 [ DNA_CALIBRATION ]'}
                  {drawerOpen === 'cloner' && '📋 [ STYLE_SCANNER ]'}
                  {drawerOpen === 'settings' && '⚡ [ CORE_ENGINES ]'}
                  {drawerOpen === 'rag' && '🗄️ [ RAG_AGENT ]'}
                  {drawerOpen === 'docs' && '📖 [ GUIDE_FILES ]'}
                </h2>
                <button 
                  onClick={() => setDrawerOpen(null)}
                  className="p-1 border border-[#00ff00] bg-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black cursor-pointer font-mono font-bold"
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
                      isLocked={isDnaLocked}
                      setIsLocked={(locked) => {
                        setIsDnaLocked(locked);
                        localStorage.setItem('cresent_dna_locked', String(locked));
                      }}
                    />

                    {/* Side Interactive Vibe Comparison Widget */}
                    <div className="border-t border-[var(--border-color)] pt-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Interactive Vibe Comparison</span>
                        <span className="text-[8px] font-mono font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-1.5 py-0.5 rounded animate-pulse">LIVE Matrix</span>
                      </div>
                      <div className="p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-left flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">Question: "What is Next.js?"</span>
                        <div className="grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed">
                          <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900/50 border border-[var(--border-color)] rounded-lg">
                            <span className="font-mono text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">Standard AI Response</span>
                            <p className="text-neutral-500">Next.js is a React framework created by Vercel. It enables features like Server-Side Rendering (SSR)...</p>
                          </div>
                          <div className="p-2.5 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-lg">
                            <span className="font-mono text-[8px] uppercase font-bold text-[var(--accent-primary)] block mb-0.5">CresentX Adaptive Response</span>
                            <p className="text-neutral-700 dark:text-neutral-300 font-semibold">
                              {persona.tone === 'Casual' 
                                ? "Next.js is like a supercharged React toolbox, bro! SSR pre-builds pages on the server, making your web pages load at lightspeed! 🚀🔥"
                                : persona.tone === 'Formal'
                                ? "Next.js is an advanced React framework by Vercel. It optimizes applications by rendering components on the server for enhanced performance and SEO."
                                : persona.tone === 'Hype'
                                ? "NEXT.JS IS AN ABSOLUTE GAME-CHANGER! Server-Side rendering is super fast and will push your web applications to the absolute limit! ⚡🔥"
                                : "Next.js is a React framework. It implements pre-render optimization protocols (SSR/SSG) for modular, high-performance static rendering."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3b. Style Scanner Panel */}
                {drawerOpen === 'cloner' && (
                  <StyleCloner 
                    persona={persona} 
                    setPersona={setPersona} 
                    apiKey={process.env.NVIDIA_API_KEY || ''} 
                    isMuted={isMuted} 
                    isLocked={isDnaLocked}
                  />
                )}

                {/* 3c. Core Engines Configuration */}
                {drawerOpen === 'settings' && (
                  <div className="flex flex-col gap-6 font-sans">
                    <div className="pb-1">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                        CresentX runs a modular system engine. Tweak your configuration core node below to query different LLMs in real-time.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-[var(--border-color)] pb-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Comparative Analytics:</span>
                      <div className="flex items-center justify-between p-3.5 border border-[var(--border-color)] bg-[var(--background)] rounded-xl">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">🟢 AI Judge (Grade Responses)</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Evaluate DNA alignment using active Groq/NVIDIA models</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playSynthSound('click', isMuted);
                            setAiJudgeEnabled(!aiJudgeEnabled);
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer relative ${
                            aiJudgeEnabled ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 absolute top-0.5 ${
                              aiJudgeEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Select Core Completion Model:</span>
                      
                      <div className="flex flex-col gap-2">
                        {([
                          { id: 'nvidia', label: '🟢 NVIDIA Kimi-k2.6' },
                          { id: 'pollinations', label: '🚀 Pollinations Core' },
                          { id: 'openai', label: '🧠 OpenAI GPT' },
                          { id: 'gemini', label: '✨ Google Gemini' },
                          { id: 'huggingface', label: '🤗 Hugging Face' },
                          { id: 'groq', label: '⚡ Groq LPU' }
                        ] as const).map(item => {
                          const isSelected = engine === item.id;
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
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-350'}`} />
                            </button>
                          );
                        })}
                      </div>

                      {engine === 'huggingface' && (
                        <div className="mt-3 flex flex-col gap-3 p-3.5 border border-red-500/10 bg-neutral-950/40 rounded-xl animate-[fadeIn_0.2s_ease]">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Hugging Face Model ID</label>
                            <input
                              type="text"
                              value={hfModel}
                              onChange={(e) => {
                                setHfModel(e.target.value);
                                localStorage.setItem('cresent_hf_model', e.target.value);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold brutal-input rounded-lg border border-neutral-800 bg-neutral-950 text-white focus:border-red-500 focus:outline-none"
                              placeholder="e.g. ibm-granite/granite-3.0-8b-instruct"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono">HF API Token (Optional)</label>
                            <input
                              type="password"
                              value={hfToken}
                              onChange={(e) => {
                                setHfToken(e.target.value);
                                localStorage.setItem('cresent_hf_token', e.target.value);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold brutal-input rounded-lg border border-neutral-800 bg-neutral-950 text-white focus:border-red-500 focus:outline-none"
                              placeholder="Starts with hf_... (falls back to server token)"
                            />
                          </div>
                        </div>
                      )}
                    </div>



                    <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Select Web Search Model / Engine:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'duckduckgo', label: '🦆 DuckDuckGo (Fast)' },
                          { id: 'yahoo', label: '🟪 Yahoo Search (Scraper)' }
                        ] as const).map(item => {
                          const isSelected = webSearchModel === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                playSynthSound('click', isMuted);
                                setWebSearchModel(item.id);
                                localStorage.setItem('cresent_web_search_model', item.id);
                              }}
                              className={`py-2 px-3 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-[var(--accent-primary)] bg-[var(--background)] text-[var(--accent-primary)] shadow-sm font-bold' 
                                  : 'border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-600 hover:border-neutral-400'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Engine Node Security:</span>
                      
                      <div className="flex flex-col gap-3 text-xs">
                        {/* NVIDIA Core */}
                        <div className="p-3 border-3 border-black bg-[var(--background)] shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">NVIDIA Kimi Core</span>
                          <span className="text-[10px] text-neutral-500 leading-normal">Running moonshotai/kimi-k2.6 over NVIDIA AI integrations. Securely configured via client authorization token.</span>
                          <span className="text-[9px] text-[#00E65A] font-bold mt-1 font-mono">ACTIVE (PROD ENGINE)</span>
                        </div>

                        {/* Pollinations */}
                        <div className="p-3 border-3 border-black bg-[var(--background)] shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">Pollinations Core</span>
                          <span className="text-[10px] text-neutral-500 leading-normal">Keyless completion server. Runs GPT-4o-mini logic.</span>
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 font-mono">ACTIVE (FREE)</span>
                        </div>

                        {/* Groq */}
                        <div className="p-3 border-3 border-black bg-[var(--background)] shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">Groq Core</span>
                          <span className="text-[10px] text-neutral-500 leading-normal">Optimized low-latency reasoning node for CresentX DNA engine processing.</span>
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 font-mono">ACTIVE (SECURE)</span>
                        </div>

                        {/* Gemini */}
                        <div className="p-3 border-3 border-black bg-[var(--background)] shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">Gemini Core</span>
                          <span className="text-[10px] text-neutral-500 leading-normal">Multimodal reasoning core supporting Tamil dialects and RAG memory layers.</span>
                          <span className="text-[9px] text-emerald-500 font-bold mt-1 font-mono">ACTIVE (SECURE)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3d. Documentation & Guide Panel */}
                {drawerOpen === 'docs' && (
                  <div className="flex flex-col gap-5 font-sans text-neutral-800 dark:text-neutral-200 animate-[fadeIn_0.25s_ease]">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                        Language Selector
                      </span>
                      <button
                        onClick={() => {
                          playSynthSound('click', isMuted);
                          setDocLang(prev => prev === 'en' ? 'ta' : 'en');
                        }}
                        className="px-2.5 py-1 rounded border border-[var(--accent-primary)] text-[10px] font-bold tracking-wide text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 cursor-pointer transition-all uppercase"
                      >
                        {docLang === 'en' ? 'தமிழ் வடிவம்' : 'English Version'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 text-xs leading-relaxed">
                      {docLang === 'en' ? (
                        <>
                          <div>
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif mb-1">Overview</h3>
                            <p className="text-neutral-500 leading-relaxed">
                              CresentX is a highly adaptive, modular AI assistant that analyzes and aligns its communication voice to match the user's specific writing DNA profile.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">Key Features</h3>
                            <ul className="list-disc pl-4 flex flex-col gap-1.5 text-neutral-500 leading-relaxed">
                              <li><strong>🧬 Persona DNA Calibrator:</strong> Customize tone parameters (Casual, Formal, Technical, Creative), length depth, and mixed dialects like Thanglish/Hinglish.</li>
                              <li><strong>📋 Style Scanner:</strong> Upload/paste sample writings to inspect syntax frequencies, typical sentence lengths, and cloning rules.</li>
                              <li><strong>🗄️ Vector DB Memory Layer:</strong> Utilizes a client-side vector search database (TF-IDF Cosine Similarity) to recall query patterns and apply recursive learning.</li>
                              <li><strong>🌐 Embedded RAG Agent:</strong> Directly runs the complete CRUD interfaces of RAGify within the center canvas viewport.</li>
                            </ul>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">Technologies Used</h3>
                            <ul className="list-disc pl-4 flex flex-col gap-1 text-neutral-500 leading-relaxed">
                              <li><strong>Core:</strong> React 19 & Next.js 16 (app routing)</li>
                              <li><strong>Styling:</strong> Tailwind CSS & CSS variables</li>
                              <li><strong>Animations:</strong> Framer Motion physics</li>
                              <li><strong>Database:</strong> Custom Client-side TF-IDF Vector Index</li>
                              <li><strong>AI APIs:</strong> NVIDIA Kimi, Pollinations, OpenAI, Groq, Gemini</li>
                            </ul>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">Steps to use CresentX</h3>
                            <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-neutral-500 leading-relaxed">
                              <li>Calibrate your preferred communication parameters using the **Persona DNA** panel.</li>
                              <li>Use the **Style Scanner** to analyze and clone your custom writing style.</li>
                              <li>Choose your model engine (e.g. NVIDIA Kimi-k2.6) in the **Core Engines** config.</li>
                              <li>Engage in chat. The system automatically searches the local **Vector DB** for similar historical questions and displays similarity scores.</li>
                              <li>Click the **RAG Agent** button in the sidebar to index and pull dynamic knowledge files.</li>
                            </ol>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif mb-1">விளக்கம்</h3>
                            <p className="text-neutral-500 leading-relaxed">
                              கிரசென்ட் AI என்பது பயனரின் தனிப்பட்ட எழுத்து நடையையும் (DNA) குணங்களையும் ஆராய்ந்து அதற்கேற்பத் தானாகவே உரையாடும் ஒரு தனித்துவமான செயற்கை நுண்ணறிவு உதவியாளராகும்.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">முக்கிய அம்சங்கள்</h3>
                            <ul className="list-disc pl-4 flex flex-col gap-1.5 text-neutral-500 leading-relaxed">
                              <li><strong>🧬 பெர்சனா DNA:</strong> குரல் தொனி (முறைசார்ந்த, இயல்பான, படைப்புத்திறன்), பதில்களின் நீளம் மற்றும் தமிழ்/தங்கிலீஷ் கலப்பு மொழிகளைத் தீர்மானிக்கிறது.</li>
                              <li><strong>📋 ஸ்டைல் ஸ்கேனர்:</strong> உங்கள் சொந்த எழுத்துக்களைத் தட்டச்சு செய்து அதை அப்படியே நகலெடுத்துப் பின்பற்ற AI-ஐ பழக்கலாம்.</li>
                              <li><strong>🗄️ வெக்டர் டேட்டாபேஸ்:</strong> நீங்கள் கேட்கும் முந்தைய கேள்விகளை நினைவகத்தில் சேமித்து வைத்து, புதிய கேள்வியோடு ஒப்புமை மதிப்பைத் தானாகவே கணக்கிடும்.</li>
                              <li><strong>🌐 RAG ஏஜென்ட்:</strong> `ragify-eight.vercel.app` இணையதளத்தை நேரடியாக முகப்புப் பக்கத்தில் திறந்து இயக்குகிறது.</li>
                            </ul>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">பயன்படுத்தப்பட்ட தொழில்நுட்பங்கள்</h3>
                            <ul className="list-disc pl-4 flex flex-col gap-1 text-neutral-500 leading-relaxed">
                              <li><strong>அமைப்பு:</strong> React 19 & Next.js 16 (App Router)</li>
                              <li><strong>வடிவமைப்பு:</strong> Tailwind CSS & CSS variables</li>
                              <li><strong>இயக்கம்:</strong> Framer Motion</li>
                              <li><strong>தரவுத்தளம்:</strong> Client-side TF-IDF Vector Index</li>
                              <li><strong>AI இன்ஜின்கள்:</strong> NVIDIA Kimi, Pollinations, OpenAI, Groq, Gemini</li>
                            </ul>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">உபயோகிக்கும் முறைகள்</h3>
                            <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-neutral-500 leading-relaxed">
                              <li>பக்கவாட்டுப் பலகையில் **Persona DNA** சென்று உரையாடல் முறைமைகளைத் தேர்ந்தெடுங்கள்.</li>
                              <li>**Style Scanner** வழியாக உங்களது சொந்த எழுத்து நடையை ஆராய்ந்து சேமிக்கவும்.</li>
                              <li>**Core Engines** வழியாக தேவையான AI இன்ஜினைத் (எ.கா. NVIDIA) தேர்ந்தெடுக்கவும்.</li>
                              <li>உரையாடலைத் துவங்குங்கள். வெக்டர் டேட்டாபேஸ் ஒப்புமை சதவீதத்தை திரையில் காட்டும்.</li>
                              <li>**RAG Agent** பொத்தானை அழுத்தி, கோப்புகளை எளிதாகச் சேமித்து இயக்கலாம்.</li>
                            </ol>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 3e. History Panel */}
                {drawerOpen === 'history' && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Recent Conversations</span>
                      {savedConversations.length > 0 && (
                        <button 
                          onClick={clearAllConversations}
                          className="text-[10px] uppercase font-bold text-red-500 hover:opacity-85 transition-opacity font-mono cursor-pointer"
                          title="Clear All History"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2.5">
                      {savedConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-500 gap-2">
                          <MessageSquare className="w-8 h-8 opacity-40" />
                          <span className="text-xs italic">No conversation history yet</span>
                        </div>
                      ) : (
                        savedConversations.map((conv) => {
                          const isCurrent = conv.id === currentSessionId;
                          return (
                            <div
                              key={conv.id}
                              className={`w-full rounded-xl border p-3.5 transition-all flex items-center justify-between group cursor-pointer ${
                                isCurrent
                                  ? 'border-red-500/50 bg-red-500/5 text-red-500 font-bold'
                                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700'
                              }`}
                            >
                              <button
                                onClick={() => { loadConversation(conv); setDrawerOpen(null); }}
                                className="flex-1 text-left flex items-start gap-2.5 min-w-0 cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4 flex-shrink-0 text-neutral-400 mt-0.5" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="truncate text-xs font-semibold leading-normal">{conv.name}</span>
                                  <span className="text-[9px] text-neutral-500 leading-none">{conv.timestamp}</span>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-800/50 transition-all cursor-pointer"
                                title="Delete Conversation"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}



              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {/* Interest Selector Modal Overlay */}
      <AnimatePresence>
        {showInterestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-[#0e0e0e]/95 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden flex flex-col gap-6"
            >
              {/* Soft amber top glow bar */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
              
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                  }}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800/50 p-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center gap-2 text-red-500">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono">Calibrate Core Node</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-100 font-serif">Configure Your Experience Vibe</h2>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                  CresentX automatically shifts its tone, language, depth, and personality to align with you. Pick one of the calibrated interest profiles below to set up your profile instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile 1: Technical Deep Dives */}
                <button
                  onClick={() => {
                    setPersona({
                      name: 'User',
                      tone: 'Neutral',
                      length: 'Detailed',
                      level: 'Expert',
                      language: 'English',
                      emojiUsage: false,
                      role: 'Tech Expert'
                    });
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                    playSynthSound('success', isMuted);
                  }}
                  className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/[0.02] rounded-xl text-left transition-all group cursor-pointer flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-105 transition-transform">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Technical Deep Dives</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed flex-1">
                    Exhaustive details, deep architectural concepts, and optimized code snippets. Zero filler, no emojis.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-neutral-800/40">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Technical</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Expert</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">No Emojis</span>
                  </div>
                </button>

                {/* Profile 2: Casual Dev Friend */}
                <button
                  onClick={() => {
                    setPersona({
                      name: 'User',
                      tone: 'Casual',
                      length: 'Medium',
                      level: 'Beginner',
                      language: 'English',
                      emojiUsage: true,
                      role: 'Student'
                    });
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                    playSynthSound('success', isMuted);
                  }}
                  className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/[0.02] rounded-xl text-left transition-all group cursor-pointer flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-105 transition-transform">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Casual Dev Friend</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed flex-1">
                    An informal, friendly conversation vibe that explains complex software terms like a supportive coding peer.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-neutral-800/40">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Casual</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Beginner</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Emojis</span>
                  </div>
                </button>

                {/* Profile 3: Hype Coding Buddy */}
                <button
                  onClick={() => {
                    setPersona({
                      name: 'User',
                      tone: 'Hype',
                      length: 'Medium',
                      level: 'Beginner',
                      language: 'English',
                      emojiUsage: true,
                      role: 'Tech Expert'
                    });
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                    playSynthSound('success', isMuted);
                  }}
                  className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/[0.02] rounded-xl text-left transition-all group cursor-pointer flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-105 transition-transform">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Hype Coding Buddy</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed flex-1">
                    Super high-energy motivational feedback and energetic validation to keep you pumped up while engineering.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-neutral-800/40">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Hype</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Active Vibe</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Creative</span>
                  </div>
                </button>

                {/* Profile 4: Tamil Bilingual Learning */}
                <button
                  onClick={() => {
                    setPersona({
                      name: 'User',
                      tone: 'Casual',
                      length: 'Medium',
                      level: 'Beginner',
                      language: 'Tamil',
                      emojiUsage: false,
                      role: 'Student'
                    });
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                    playSynthSound('success', isMuted);
                  }}
                  className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/[0.02] rounded-xl text-left transition-all group cursor-pointer flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Tamil Bilingual Vibe</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed flex-1">
                    Get computer science concepts explained in clean, friendly Tamil / Thanglish dialect with local expressions.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-neutral-800/40">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Tamil</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Bilingual</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Friendly</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4 mt-2">
                <button
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    setShowInterestModal(false);
                    localStorage.setItem('cresent_interest_shown', 'true');
                    toggleDrawer('dna');
                  }}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer transition-colors"
                >
                  Skip and configure manually
                </button>
                <div className="text-[9px] font-mono text-neutral-500">
                  Powered by moonshotai/kimi-k2.6 Reasoning Node
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clone Human Modal */}
      <AnimatePresence>
        {showCloneModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-[#0e0e0e]/95 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden flex flex-col gap-5"
            >
              {/* Soft amber top glow bar */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
              
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    setShowCloneModal(false);
                  }}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800/50 p-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-2 text-red-500">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono">Cloner Interface</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-100 font-serif">🧬 Clone Human (Virtual Mirror)</h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Synthesize an exact virtual reflection of yourself. The chatbot will shift into a mirror counterpart to talk back as you.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const name = (target.elements.namedItem('cloneName') as HTMLInputElement).value;
                  const age = (target.elements.namedItem('cloneAge') as HTMLInputElement).value;
                  const interests = (target.elements.namedItem('cloneInterests') as HTMLTextAreaElement).value;
                  const color = (target.elements.namedItem('cloneColor') as HTMLInputElement).value;
                  const movie = (target.elements.namedItem('cloneMovie') as HTMLInputElement).value;
                  const actor = (target.elements.namedItem('cloneActor') as HTMLInputElement).value;
                  const actress = (target.elements.namedItem('cloneActress') as HTMLInputElement).value;
                  
                  setCloneData({ name, age, interests, color, movie, actor, actress });
                  setCloneMode(true);
                  localStorage.setItem('cresent_clone_data', JSON.stringify({ name, age, interests, color, movie, actor, actress }));
                  localStorage.setItem('cresent_clone_mode', 'true');
                  
                  playSynthSound('success', isMuted);
                  setShowCloneModal(false);
                  
                  // Insert a system notification message into conversation
                  setMessages(prev => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      sender: 'cresent-ai',
                      text: `🧬 **[Virtual Clone Synced Successfully]**
Physical **${name}** is now connected to Virtual **${name}**. Let's talk!`,
                      timestamp: new Date()
                    }
                  ]);
                }}
                className="flex flex-col gap-4 text-left text-xs text-neutral-300 overflow-y-auto max-h-[60vh] pr-1"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Full Name</label>
                    <input name="cloneName" required defaultValue={cloneData?.name || persona.name || 'Vicky'} className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Age</label>
                    <input name="cloneAge" required defaultValue={cloneData?.age || '21'} type="number" className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Personal Interests</label>
                  <textarea name="cloneInterests" required defaultValue={cloneData?.interests || 'Software engineering, AI modeling, dynamic interfaces'} rows={2} className="brutal-input text-white text-xs bg-neutral-950 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Favorite Color</label>
                    <input name="cloneColor" required defaultValue={cloneData?.color || 'Amber Gold'} className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Favorite Movie</label>
                    <input name="cloneMovie" required defaultValue={cloneData?.movie || 'Interstellar'} className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Favorite Actor</label>
                    <input name="cloneActor" required defaultValue={cloneData?.actor || 'Robert Downey Jr'} className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase font-bold text-neutral-400">Favorite Actress</label>
                    <input name="cloneActress" required defaultValue={cloneData?.actress || 'Anne Hathaway'} className="brutal-input text-white text-xs bg-neutral-950" />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-neutral-800/40 justify-end">
                  {cloneMode && (
                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound('delete', isMuted);
                        setCloneMode(false);
                        localStorage.setItem('cresent_clone_mode', 'false');
                        setShowCloneModal(false);
                        setMessages(prev => [
                          ...prev,
                          {
                            id: Math.random().toString(),
                            sender: 'cresent-ai',
                            text: `🔄 **[Clone Mode Deactivated]**
Switched back to standard CresentX core node.`,
                            timestamp: new Date()
                          }
                        ]);
                      }}
                      className="px-4 py-2 text-xs text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg font-bold font-mono transition-all cursor-pointer uppercase"
                    >
                      Deactivate Clone
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-red-500 hover:bg-red-400 text-neutral-950 font-bold rounded-lg font-mono transition-all cursor-pointer uppercase shadow-md"
                  >
                    🧬 Synthesize Clone
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
