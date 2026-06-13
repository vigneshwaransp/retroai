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
  Trash2, Lock, RefreshCw, FileText, ZoomIn,
  Home as HomeIcon, LayoutGrid, Puzzle, BookOpen, Heart, Target, ArrowRight
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
  const matrixCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // 1. Initial State for User DNA Persona
  const [persona, setPersona] = useState<UserPersona>({
    name: 'User',
    tone: 'Casual',
    length: 'Medium',
    level: 'Beginner',
    language: 'English',
    emojiUsage: true,
    role: 'Student',
  });

  // 2. States for active elements, APIs, and muted sound settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [accentColor, setAccentColor] = useState<'silver' | 'titanium' | 'obsidian' | 'platinum' | 'carbon'>('titanium');
  const [activeView, setActiveView] = useState<'chat' | 'rag'>('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [bgPatternActive, setBgPatternActive] = useState(true);
  const [hfModel, setHfModel] = useState('Qwen/Qwen2.5-72B-Instruct');
  const [groqModel, setGroqModel] = useState('qwen/qwen3-32b');
  const [engine, setEngine] = useState<'pollinations' | 'gemini' | 'openai' | 'huggingface' | 'groq' | 'nvidia' | 'gemma'>('groq');
  const [isDnaLocked, setIsDnaLocked] = useState(false);
  const [bgIntensity, setBgIntensity] = useState<number>(0.25);
  const [voiceModel, setVoiceModel] = useState<'webspeech' | 'whisper'>('webspeech');
  const [webSearchModel, setWebSearchModel] = useState<'duckduckgo' | 'yahoo'>('duckduckgo');

  const [config, setConfig] = useState({
    hasGeminiKey: false,
    hasOpenaiKey: false,
    hasHfToken: false,
    hasGroqKey: false,
    hasNvidiaKey: true,
    hfModel: 'Qwen/Qwen2.5-72B-Instruct',
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
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
    const cleanColor = encodeURIComponent(color);
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <style>
    .word {
      fill: ${cleanColor};
      opacity: ${bgIntensity};
      font-family: system-ui, sans-serif;
      font-weight: 500;
    }
    .word-serif {
      font-family: Georgia, serif;
    }
    .word-mono {
      font-family: monospace;
    }
  </style>
  
  <text x="50" y="80" font-size="28" class="word word-serif">Hello</text>
  <text x="80" y="140" font-size="18" class="word">Bonjour</text>
  <text x="40" y="210" font-size="32" class="word">Hola</text>
  <text x="120" y="270" font-size="22" class="word word-mono">Ciao</text>
  <text x="60" y="340" font-size="26" class="word word-serif">வணக்கம்</text>
  <text x="90" y="410" font-size="16" class="word">Sveiki</text>
  <text x="30" y="480" font-size="36" class="word word-serif">हैலோ</text>
  <text x="110" y="540" font-size="20" class="word">Merhaba</text>
  <text x="50" y="610" font-size="24" class="word">Hej</text>
  <text x="140" y="670" font-size="18" class="word word-mono">Alo</text>
  <text x="70" y="740" font-size="30" class="word word-serif">こんにちは</text>
  <text x="30" y="810" font-size="22" class="word">Guten Tag</text>
  <text x="120" y="870" font-size="28" class="word word-serif">你好</text>
  <text x="60" y="930" font-size="16" class="word">Zdravstvuyte</text>
  
  <text x="320" y="60" font-size="16" class="word">Slam</text>
  <text x="250" y="120" font-size="28" class="word word-serif">வணக்கம்</text>
  <text x="360" y="190" font-size="20" class="word">Olá</text>
  <text x="280" y="250" font-size="24" class="word word-mono">G'day</text>
  <text x="330" y="320" font-size="18" class="word">Salut</text>
  <text x="260" y="390" font-size="32" class="word word-serif">你好</text>
  <text x="380" y="450" font-size="16" class="word">Ahoj</text>
  <text x="290" y="520" font-size="26" class="word">Bonjour</text>
  <text x="350" y="580" font-size="22" class="word word-mono">Hej</text>
  <text x="270" y="650" font-size="30" class="word word-serif">हैலோ</text>
  <text x="360" y="710" font-size="16" class="word">Sveiki</text>
  <text x="300" y="780" font-size="28" class="word">안녕하세요</text>
  <text x="260" y="850" font-size="20" class="word word-mono">Ciao</text>
  <text x="340" y="910" font-size="24" class="word word-serif">Hola</text>
  <text x="290" y="970" font-size="18" class="word">Merhaba</text>
  
  <text x="580" y="90" font-size="32" class="word word-serif">Guten Tag</text>
  <text x="650" y="150" font-size="16" class="word">Zdravstvuyte</text>
  <text x="560" y="220" font-size="24" class="word">Merhaba</text>
  <text x="620" y="280" font-size="20" class="word word-mono">Olá</text>
  <text x="590" y="350" font-size="28" class="word word-serif">안녕하세요</text>
  <text x="670" y="420" font-size="18" class="word">Salut</text>
  <text x="550" y="490" font-size="30" class="word">Hello</text>
  <text x="630" y="550" font-size="16" class="word word-mono">Ahoj</text>
  <text x="580" y="620" font-size="22" class="word word-serif">こんにちは</text>
  <text x="660" y="680" font-size="26" class="word">Ciao</text>
  <text x="560" y="750" font-size="18" class="word">G'day</text>
  <text x="620" y="810" font-size="34" class="word word-serif">வணக்கம்</text>
  <text x="570" y="880" font-size="20" class="word">Hej</text>
  <text x="640" y="940" font-size="24" class="word word-mono">Slam</text>
  
  <text x="210" y="170" font-size="22" class="word" transform="rotate(15, 210, 170)">Hello</text>
  <text x="490" y="110" font-size="18" class="word" transform="rotate(-10, 490, 110)">Bonjour</text>
  <text x="180" y="450" font-size="24" class="word" transform="rotate(-15, 180, 450)">Hola</text>
  <text x="480" y="380" font-size="26" class="word" transform="rotate(12, 480, 380)">Ciao</text>
  <text x="200" y="720" font-size="18" class="word" transform="rotate(8, 200, 720)">Olá</text>
  <text x="500" y="790" font-size="28" class="word" transform="rotate(-12, 500, 790)">வணக்கம்</text>
  <text x="190" y="920" font-size="20" class="word" transform="rotate(-8, 190, 920)">Merhaba</text>
  <text x="470" y="660" font-size="22" class="word" transform="rotate(15, 470, 660)">हैலோ</text>
</svg>`;
    if (typeof window !== 'undefined') {
      try {
        const bytes = new TextEncoder().encode(svgStr);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
        return `data:image/svg+xml;base64,${window.btoa(binString)}`;
      } catch (e) {
        console.error("Failed to encode background SVG to base64", e);
      }
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
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

      localStorage.setItem('cresent_saved_conversations', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId, persona, mode, mood]);

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

  const activeColorHex = engine === 'gemma' ? '#ec4899' : (theme === 'light' ? accentPalettes[accentColor].light : accentPalettes[accentColor].dark);
  const bgImageValue = isMounted && bgPatternActive ? `url("${getDynamicBgSvg(activeColorHex)}")` : 'none';

  // Matrix digital rain background animation loop
  useEffect(() => {
    if (!isMounted || !bgPatternActive) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const matrixChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz日ハミヒーウシナモニアテトヤユヨラリルレロワヰヱヲン";
    const charArray = matrixChars.split("");
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);

    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(252, 252, 252, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = activeColorHex;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMounted, bgPatternActive, theme, activeColorHex, engine]);

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
    >
      {/* Matrix digital rain background */}
      {isMounted && bgPatternActive && (
        <canvas
          ref={matrixCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-[-1]"
          style={{ opacity: bgIntensity }}
        />
      )}
      
      {/* Background vector DNA watermarks */}
      {isMounted && (
        <>
          <DNAHelixBg className="left-4 bottom-10 w-48 h-[600px] rotate-12" />
          <DNAHelixBg className="right-4 top-20 w-48 h-[600px] -rotate-12" />
          <DNAHelixBg className="right-12 bottom-10 w-48 h-[500px] rotate-45" />
        </>
      )}
      
      {/* 1. LEFT COLLAPSIBLE SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col z-30 select-none relative overflow-hidden flex-shrink-0`}
      >
        {/* Brand Header / Top Sidebar spacing */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] h-16 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-neutral-500 uppercase font-mono">Navigation Hub</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Tabs List */}
        <div className="flex-1 py-4 flex flex-col gap-1 px-3 select-none">
          {([
            { id: 'home', label: 'Home', icon: HomeIcon, active: activeView === 'chat' && drawerOpen === null, onClick: () => { setActiveView('chat'); setDrawerOpen(null); } },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare, active: drawerOpen === 'history', onClick: () => { setActiveView('chat'); setDrawerOpen(prev => prev === 'history' ? null : 'history'); } },
            { id: 'memory', label: 'Memory', icon: Brain, active: drawerOpen === 'dna', onClick: () => { setDrawerOpen(prev => prev === 'dna' ? null : 'dna'); } },
            { id: 'tools', label: 'Tools', icon: LayoutGrid, active: activeView === 'rag', onClick: () => { setActiveView(prev => prev === 'rag' ? 'chat' : 'rag'); setDrawerOpen(null); } },
            { id: 'integrations', label: 'Integrations', icon: Puzzle, active: drawerOpen === 'cloner', onClick: () => { setDrawerOpen(prev => prev === 'cloner' ? null : 'cloner'); } },
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
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3.5 cursor-pointer relative ${
                  tab.active 
                    ? 'text-amber-500 bg-amber-500/10 font-bold border-l-4 border-amber-500 rounded-l-none' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${tab.active ? 'text-amber-500' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clock & System Online widgets in sidebar */}
        <div className="flex flex-col gap-3.5 border-t border-[var(--border-color)] pt-4 bg-[var(--background)] flex-shrink-0 pb-4">
          {/* Digital Clock Widget */}
          <div className="mx-3.5 p-4 border border-amber-500/10 bg-neutral-950/40 rounded-2xl flex flex-col gap-0.5 select-none font-mono">
            <span className="text-2xl font-bold text-amber-500 tracking-tight">{clockTime || '06:53 AM'}</span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{clockDate || 'Sat, 13 Jun, 2026'}</span>
          </div>

          {/* System Online Widget */}
          <div className="mx-3.5 p-4 border border-amber-500/10 bg-neutral-950/40 rounded-2xl flex items-start gap-3 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-neutral-200 leading-none">System Online</span>
              <span className="text-[10px] text-neutral-400">All systems operational</span>
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
        <header className="w-full h-16 border-b border-[var(--border-color)] px-6 flex items-center justify-between flex-shrink-0 relative bg-[var(--background)] z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle menu button */}
            <button
              onClick={() => {
                playSynthSound('click', isMuted);
                setSidebarOpen(prev => !prev);
              }}
              className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-400 hover:text-amber-500 hover:border-amber-500/50 cursor-pointer transition-all"
              title="Toggle Sidebar"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Logo and branding */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-9 h-9 rounded-full border border-amber-500/20 flex items-center justify-center bg-neutral-950/40 relative overflow-hidden">
                <Logo className="w-6 h-6 relative z-10" />
              </div>
              <span className="text-sm font-cyberpunk uppercase tracking-widest flex select-none font-bold">
                <span className="text-amber-500 font-sans font-black scale-110">C</span>
                <span className="text-white font-sans">RESCENT</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* GenAI Mode Toggle Switch */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm text-xs font-semibold select-none h-[34px]">
              <span className="font-mono text-[9px] uppercase font-bold text-neutral-500">GenAI Mode</span>
              <button
                type="button"
                onClick={() => {
                  playSynthSound('click', isMuted);
                  setEngine(prev => prev === 'gemma' ? 'nvidia' : 'gemma');
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer relative ${
                  engine === 'gemma' ? 'bg-pink-500' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                title={engine === 'gemma' ? "Disable GenAI Mode" : "Enable GenAI Mode (Llama 3.3)"}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 absolute top-0.5 ${
                    engine === 'gemma' ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* DNA outline button */}
            <button
              onClick={() => toggleDrawer('dna')}
              className={`py-1.5 px-3 rounded-lg border shadow-sm hover:border-amber-500 hover:text-amber-500 cursor-pointer flex items-center gap-1.5 transition-all text-xs font-semibold ${
                drawerOpen === 'dna' 
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                  : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
              }`}
              title="DNA Preferences Calibrator"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              <span>DNA</span>
            </button>

            {/* Docs Button */}
            <button
              onClick={() => toggleDrawer('docs')}
              className={`py-1.5 px-3 rounded-lg border shadow-sm hover:border-amber-500 hover:text-amber-500 cursor-pointer flex items-center gap-1.5 transition-all text-xs font-semibold ${
                drawerOpen === 'docs' 
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                  : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
              }`}
              title="Documentation & Guide"
            >
              <FileText className="w-4 h-4" />
              <span>Docs</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="py-1.5 px-3 rounded-lg border border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-amber-500 hover:text-amber-500 flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
              <span>{isFullscreen ? "Exit Full" : "Fullscreen"}</span>
            </button>

            {/* Background Toggle Button */}
            <button
              onClick={toggleBgPattern}
              className={`py-1.5 px-3 rounded-lg border shadow-sm hover:border-amber-500 hover:text-amber-500 cursor-pointer flex items-center gap-1.5 transition-all text-xs font-semibold ${
                bgPatternActive 
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                  : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
              }`}
              title="Toggle Matrix Background Animation"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{bgPatternActive ? "BG Off" : "BG On"}</span>
            </button>

            {/* Zoom Button */}
            <button
              onClick={() => {
                playSynthSound('click', isMuted);
                setZoomLevel(prev => prev === 100 ? 115 : prev === 115 ? 130 : 100);
              }}
              className="py-1.5 px-3 rounded-lg border border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-amber-500 hover:text-amber-500 flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
              title="Adjust Workspace Zoom Scale"
            >
              <ZoomIn className="w-4 h-4" />
              <span>Zoom {zoomLevel}%</span>
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => toggleDrawer('dna')}
              className="w-9 h-9 rounded-full border border-neutral-800 hover:border-amber-500 hover:text-amber-500 bg-neutral-950/40 flex items-center justify-center text-xs font-bold text-neutral-300 font-mono transition-all cursor-pointer"
              title="User Persona Profile"
            >
              VK
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
                    <span className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500/40" />
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
              <div 
                className={`flex-1 overflow-hidden flex flex-col justify-between py-6 px-4 md:px-8 transition-all duration-300 ${
                  layoutWidth === 'standard' ? 'max-w-4xl mx-auto' : 'max-w-none'
                }`}
                style={{ zoom: zoomLevel / 100 } as React.CSSProperties}
              >
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
                    onOpenSettings={() => toggleDrawer('settings')}
                    onTriggerAgentMode={() => setActiveView('rag')}
                    webSearchModel={webSearchModel}
                  />
                </div>

                {/* Minimal info footer in center workspace */}
                <div className="w-full flex flex-col items-center gap-1.5 pt-4 border-t border-neutral-800/60 mt-3 select-none text-center">
                  <span className="text-[11px] text-neutral-500 italic">“ Built with empathy. Engineered with intelligence. ”</span>
                  <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">SENTRY CORE ENGINE PIPELINE • CALIBRATED PERSONALIZATION LAYER</span>
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
              className="w-full sm:w-[360px] md:w-[390px] h-screen bg-[var(--card-bg)] border-l border-[var(--border-color)] fixed right-0 top-0 z-40 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--card-bg)] z-10 h-16">
                <h2 className="text-xs font-bold tracking-tight uppercase font-mono flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                  {drawerOpen === 'dna' && '🧬 DNA Calibrator'}
                  {drawerOpen === 'cloner' && '📋 Style Scanner'}
                  {drawerOpen === 'settings' && '⚡ Core Engines'}
                  {drawerOpen === 'rag' && '🗄️ RAG Agent'}
                  {drawerOpen === 'docs' && '📖 Guide & Features'}
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
                      isLocked={isDnaLocked}
                      setIsLocked={(locked) => {
                        setIsDnaLocked(locked);
                        localStorage.setItem('cresent_dna_locked', String(locked));
                      }}
                    />
                    
                    <div className="border-t border-[var(--border-color)] pt-5 flex flex-col gap-3.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">🧬 DNA Sequence Helix Matrix</h3>
                      <DNAProfileView persona={persona} />
                    </div>

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
                            <span className="font-mono text-[8px] uppercase font-bold text-[var(--accent-primary)] block mb-0.5">Sentry Adaptive Response</span>
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
                        Cresent AI runs a modular system engine. Tweak your configuration core node below to query different LLMs in real-time.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Select Core Completion Model:</span>
                      
                      <div className="flex flex-col gap-2">
                        {([
                          { id: 'nvidia', label: '🟢 NVIDIA Kimi-k2.6 (Reasoning)' },
                          { id: 'gemma', label: '🔥 Google Gemma (GenAI Mode)' },
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
                          if (item.id === 'gemma') isConfigured = config.hasNvidiaKey;
                          
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
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">NVIDIA Kimi Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">Running moonshotai/kimi-k2.6 over NVIDIA AI integrations. Securely configured via client authorization token.</span>
                          <span className="text-[9px] text-[#00E65A] font-bold mt-1 font-mono">ACTIVE (PROD ENGINE)</span>
                        </div>

                        {/* Google Gemma */}
                        <div className="p-3 border border-[var(--border-color)] bg-[var(--background)] rounded-xl flex flex-col gap-1">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Google Gemma Core</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">diffusiongemma-26b-a4b-it running in GenAI Mode. Securely configured via client authorization token.</span>
                          <span className={`text-[9px] font-bold mt-1 font-mono ${config.hasNvidiaKey ? 'text-[#00E65A]' : 'text-neutral-400'}`}>
                            {config.hasNvidiaKey ? 'ACTIVE (PROD ENGINE)' : 'OFFLINE'}
                          </span>
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
                              Cresent AI is a highly adaptive, modular AI assistant that analyzes and aligns its communication voice to match the user's specific writing DNA profile.
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
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif border-b border-[var(--border-color)]/30 pb-0.5">Steps to use Cresent AI</h3>
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
                                  ? 'border-amber-500/50 bg-amber-500/5 text-amber-500 font-bold'
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

    </main>
  );
}
