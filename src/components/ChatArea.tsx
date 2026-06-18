import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import { SimpleVectorDB, VectorDocument } from '@/lib/vectorDb';
import { 
  Send, Sparkles, Smile, Bot, Brain, CornerDownLeft, Activity, 
  Cpu, Gauge, Eye, EyeOff, Settings, Trash2, Database, RefreshCw,
  Star, Flame, Pencil, MessageSquare, Atom, ArrowRight, Paperclip, Mic, Globe, Zap, Shrink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSynthSound } from '@/app/page';
import ReactMarkdown from 'react-markdown';
import Logo from './Logo';

interface Message {
  id: string;
  sender: 'user' | 'normal-ai' | 'cresent-ai';
  text: string;
  reasoning?: string;
  timestamp: Date;
  sources?: { title: string; url: string; snippet?: string }[];
}

const highlightText = (text: string) => {
  const rules = [
    { pattern: /\b(bro|machan|buddy|yaara|nanba)\b/gi, tag: 'Dialect Shift', description: 'Blends model voice with conversational local dial addressing' },
    { pattern: /\b(ml|ai|mern|next\.js|ssr|ssg|vercel|api|database|models)\b/gi, tag: 'Domain Calibration', description: 'Re-aligns technical jargon to matching professional terminology profiles' },
    { pattern: /([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}])/gu, tag: 'Emoji Injector', description: 'Adapts context glyph distribution rate to fit tone filters' },
    { pattern: /\b(waiter|chef|restaurant|lego|building block)\b/gi, tag: 'Metaphor Adapter', description: 'Substitutes complex details with simplified analogy nodes' },
  ];

  const words = text.split(/(\s+)/);
  return words.map((word, idx) => {
    const match = rules.find(r => word.match(r.pattern));
    if (match) {
      return (
        <span 
          key={idx} 
          className="underline decoration-neutral-400 dark:decoration-neutral-600 decoration-dotted decoration-2 cursor-help relative group inline-block font-semibold text-neutral-800 dark:text-neutral-200"
        >
          {word}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[9px] text-foreground rounded-lg shadow-sm font-sans leading-relaxed z-50 text-center select-none backdrop-blur-sm animate-fade">
            <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mb-1">
              {match.tag}
            </span>
            {match.description}
          </span>
        </span>
      );
    }
    return word;
  });
};

const HighlightedChildren = ({ children }: { children: React.ReactNode }) => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return highlightText(child);
    }
    return child;
  });
};

const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-4 mb-2 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-1"><HighlightedChildren>{children}</HighlightedChildren></h1>,
  h2: ({ children }: any) => <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-100 mt-3.5 mb-1.5"><HighlightedChildren>{children}</HighlightedChildren></h2>,
  h3: ({ children }: any) => <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5"><HighlightedChildren>{children}</HighlightedChildren></h3>,
  p: ({ children }: any) => <p className="mb-3 leading-relaxed text-[15px] text-neutral-800 dark:text-neutral-200"><HighlightedChildren>{children}</HighlightedChildren></p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 flex flex-col gap-1.5 text-[15px] text-neutral-800 dark:text-neutral-200">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 flex flex-col gap-1.5 text-[15px] text-neutral-800 dark:text-neutral-200">{children}</ol>,
  li: ({ children }: any) => <li className="text-[15px] leading-relaxed"><HighlightedChildren>{children}</HighlightedChildren></li>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground"><HighlightedChildren>{children}</HighlightedChildren></strong>,
  em: ({ children }: any) => <em className="italic text-foreground/90"><HighlightedChildren>{children}</HighlightedChildren></em>,
  blockquote: ({ children }: any) => (
    <blockquote className="pl-4 border-l-2 border-neutral-400 dark:border-neutral-700 text-neutral-500 italic my-3 text-[14px]">
      <HighlightedChildren>{children}</HighlightedChildren>
    </blockquote>
  ),
  img: ({ node, ...props }: any) => (
    <img 
      {...props} 
      referrerPolicy="no-referrer"
      className="max-w-full md:max-w-md h-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-md my-4 hover:scale-[1.02] transition-transform duration-300 object-cover" 
      loading="lazy" 
    />
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <pre className="p-4 bg-neutral-50 dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto text-[13px] font-mono my-3 text-foreground select-text">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded text-[12px] font-mono text-foreground font-semibold" {...props}>
        {children}
      </code>
    );
  },
};

const ReasoningBlock = ({ reasoning }: { reasoning?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!reasoning) return null;

  return (
    <div className="mb-3 border border-red-500/20 bg-red-500/5 rounded-lg p-3 text-left font-mono relative overflow-hidden select-text">
      <button 
        type="button" 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[var(--accent-primary)] tracking-wider focus:outline-none w-full text-left cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
        {expanded ? 'Hide Thinking Process ▲' : 'Show Thinking Process ▼'}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 0.8 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400 mt-2 border-t border-red-500/10 pt-2 whitespace-pre-wrap select-text selection:bg-[var(--accent-primary)]/10 font-sans italic"
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SourcesUsed = ({ sources }: { sources?: { title: string; url: string; snippet?: string }[] }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-[var(--border-color)]/30 flex flex-col gap-2.5 w-full select-text">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold text-neutral-400">
        <Globe className="w-3.5 h-3.5 text-red-500" />
        <span>Sources Used</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {sources.map((source, idx) => {
          let domain = source.url;
          try {
            domain = new URL(source.url).hostname;
          } catch(e) {}
          return (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:border-red-500/50 hover:bg-red-500/5 transition-all flex flex-col gap-1 shadow-sm text-left group min-w-0"
              title={source.snippet || source.title}
            >
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-red-500 transition-colors">
                {source.title}
              </span>
              <span className="text-[9px] font-mono text-neutral-500 truncate">
                {domain}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

interface ChatAreaProps {
  persona: UserPersona;
  setPersona?: React.Dispatch<React.SetStateAction<UserPersona>>;
  apiKey: string;
  openaiApiKey: string;
  hfToken: string;
  hfModel: string;
  groqApiKey: string;
  groqModel: string;
  engine: 'pollinations' | 'gemini' | 'openai' | 'huggingface' | 'groq' | 'nvidia' | 'gemma';
  isMuted?: boolean;
  newChatTrigger?: number;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  savedConversations: SavedConversation[];
  setSavedConversations: React.Dispatch<React.SetStateAction<SavedConversation[]>>;
  currentSessionId: string;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string>>;
  mode: ToneMode;
  setMode: React.Dispatch<React.SetStateAction<ToneMode>>;
  mood: MoodState;
  setMood: React.Dispatch<React.SetStateAction<MoodState>>;
  onOpenSettings?: () => void;
  onTriggerAgentMode?: () => void;
  webSearchModel: 'duckduckgo' | 'yahoo';
  aiJudgeEnabled: boolean;
  isDnaLocked: boolean;
  setIsDnaLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  cloneMode: boolean;
  cloneData: { name: string; age: string; interests: string; color: string; movie: string; actor: string; actress: string } | null;
}

interface SavedConversation {
  id: string;
  name: string;
  messages: Message[];
  persona: UserPersona;
  mode: ToneMode;
  mood: MoodState;
  timestamp: string;
}

// Returns time-based greeting string based on local hour
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

// Returns time period emoji
function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '🌅';
  if (hour >= 12 && hour < 17) return '☀️';
  if (hour >= 17 && hour < 21) return '🌆';
  return '🌙';
}

interface NewsItem {
  title: string;
  source: string;
  link: string;
}

const fetchNewsFeed = async (): Promise<NewsItem[]> => {
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

export default function ChatArea({ 
  persona, 
  setPersona,
  apiKey, 
  openaiApiKey, 
  hfToken, 
  hfModel, 
  groqApiKey, 
  groqModel, 
  engine,
  isMuted = false,
  newChatTrigger = 0,
  messages,
  setMessages,
  savedConversations,
  setSavedConversations,
  currentSessionId,
  setCurrentSessionId,
  mode,
  setMode,
  mood,
  setMood,
  onOpenSettings,
  onTriggerAgentMode,
  webSearchModel
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [lastUpdatedNews, setLastUpdatedNews] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);
  const [greeting, setGreeting] = useState(getTimeGreeting());
  const [greetingEmoji, setGreetingEmoji] = useState(getTimeEmoji());
  const [news, setNews] = useState<NewsItem[]>([]);
  
  // Layout views: separate response cards or focused view
  const [layoutMode, setLayoutMode] = useState<'comparison' | 'focus'>('focus');
  const [demoProfile, setDemoProfile] = useState<'casual' | 'expert'>('casual');
  const [showStandardPeek, setShowStandardPeek] = useState<Record<string, boolean>>({});
  const [isCollapsedBubble, setIsCollapsedBubble] = useState(false);

  // Vector DB simulation state
  const vectorDb = useMemo(() => new SimpleVectorDB(), []);
  const [vectorSearchMatches, setVectorSearchMatches] = useState<{ document: VectorDocument; score: number }[]>([]);
  const [showVectorIndicator, setShowVectorIndicator] = useState(false);

  // latencies telemetry
  const [normalLatency, setNormalLatency] = useState(0);
  const [cresentLatency, setCresentLatency] = useState(0);

  const cresentScrollRef = useRef<HTMLDivElement>(null);

  // Update greeting every minute in case hour changes
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getTimeGreeting());
      setGreetingEmoji(getTimeEmoji());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load news feed on mount and refresh every 10 minutes
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

  useEffect(() => {
    if (cresentScrollRef.current) {
      cresentScrollRef.current.scrollTo({
        top: cresentScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const streamMessageText = (msgId: string, fullText: string) => {
    const words = fullText.split(' ');
    if (words.length === 0) return;
    
    const totalTargetDuration = Math.min(2000, words.length * 25);
    const delayMs = Math.max(15, Math.round(totalTargetDuration / words.length));
    
    let currentWordIdx = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (currentWordIdx < words.length) {
        const wordsToAdd = delayMs <= 15 ? Math.max(1, Math.round(words.length / 80)) : 1;
        
        for (let i = 0; i < wordsToAdd && currentWordIdx < words.length; i++) {
          currentText += (currentText === '' ? '' : ' ') + words[currentWordIdx];
          currentWordIdx++;
        }

        setMessages(prev => 
          prev.map(m => m.id === msgId ? { ...m, text: currentText } : m)
        );
      } else {
        clearInterval(interval);
      }
    }, delayMs);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    playSynthSound('click', isMuted);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setShowVectorIndicator(true);

    const startTime = performance.now();

    try {
      // 1. Semantic search Vector DB for recursive pattern matching
      const dbMatches = vectorDb.search(textToSend, 2);
      setVectorSearchMatches(dbMatches);

      let memoryContext = messages
        .slice(-4)
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      if (dbMatches.length > 0) {
        memoryContext += "\n\nRETRIEVED VECTOR DB KNOWLEDGE/PATTERNS:\n" + 
          dbMatches.map(match => `[Similarity: ${(match.score * 100).toFixed(0)}%] User previously asked: "${match.document.query}"\nAssistant responded: "${match.document.response}"`).join('\n---\n');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          persona,
          mode,
          mood,
          memoryContext,
          apiKey,
          openaiApiKey,
          hfToken,
          hfModel,
          groqApiKey,
          groqModel,
          engine,
          webSearchEnabled,
          webSearchModel
        })
      });

      const data = await response.json();
      const endTime = performance.now();

      const rawLatency = Math.round(endTime - startTime);
      setNormalLatency(Math.max(120, Math.round(rawLatency * 0.82)));
      setCresentLatency(rawLatency);

      if (response.ok) {
        setIsSandbox(data.isSandbox);
        playSynthSound('success', isMuted);
        
        const normalMsgId = Math.random().toString();
        const cresentMsgId = Math.random().toString();

        const normalMsg: Message = {
          id: normalMsgId,
          sender: 'normal-ai',
          text: '',
          reasoning: data.normalReasoning,
          timestamp: new Date(),
          sources: data.sources
        };

        const cresentMsg: Message = {
          id: cresentMsgId,
          sender: 'cresent-ai',
          text: '',
          reasoning: data.personalizedReasoning,
          timestamp: new Date(),
          sources: data.sources
        };

        setMessages(prev => [...prev, normalMsg, cresentMsg]);

        streamMessageText(normalMsgId, data.normal);
        streamMessageText(cresentMsgId, data.personalized);

        // 2. Recursive learning: Insert prompt & response pattern in Vector DB
        vectorDb.insert(textToSend, data.personalized);
      } else {
        throw new Error(data.error || 'Failed to fetch reply');
      }
    } catch (err: any) {
      console.error(err);
      playSynthSound('delete', isMuted);
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'cresent-ai',
        text: `Error connecting to Cresent AI engine: ${err.message || 'Server offline'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowVectorIndicator(false), 2000);
    }
  };

  const quickPrompts = [
    'Explain quantum computing baselines',
    'Write a witty tagline for an image scanner app',
    'Roast my Next.js tech stack configuration',
    'Give me conversational Tamil expressions'
  ];

  const moodEmojis: Record<MoodState, string> = {
    Neutral: '😐',
    Stressed: '😫',
    Excited: '🤩',
    Curious: '🤔',
    Tired: '😴'
  };

  const userAndNormalMessages = messages.filter(m => m.sender === 'user' || m.sender === 'normal-ai');
  const userAndCresentMessages = messages.filter(m => m.sender === 'user' || m.sender === 'cresent-ai');

  const getStandardTextForCresent = (cresentIndex: number) => {
    const cresentMsgs = userAndCresentMessages.filter(m => m.sender === 'cresent-ai');
    const normalMsgs = userAndNormalMessages.filter(m => m.sender === 'normal-ai');
    const matchIndex = cresentMsgs.indexOf(userAndCresentMessages[cresentIndex]);
    if (matchIndex !== -1 && normalMsgs[matchIndex]) {
      return normalMsgs[matchIndex].text;
    }
    return null;
  };

  const togglePeek = (msgId: string) => {
    playSynthSound('click', isMuted);
    setShowStandardPeek(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };


  const getDNALabel = () => {
    const toneMap: Record<string, string> = {
      CASU: 'Casual', FORM: 'Formal', TECH: 'Technical', CRE: 'Creative'
    };
    const styleMap: Record<string, string> = {
      TH: 'Thoughtful', WIT: 'Witty', BLT: 'Blunt', EMP: 'Empathetic'
    };
    const depthMap: Record<string, string> = {
      MED: 'Medium depth', DEEP: 'Deep dive', SURF: 'Surface level'
    };
    const levelMap: Record<string, string> = {
      BEG: 'Beginner-friendly', INT: 'Intermediate', EXP: 'Expert'
    };

    const toneShort = (persona.tone === 'Casual' ? 'CASU' : persona.tone === 'Formal' ? 'FORM' : persona.tone === 'Neutral' ? 'TECH' : 'CRE');
    // Using simple deterministic mapping for persona sub-values:
    const styleShort = (persona.emojiUsage ? 'EMP' : 'TH');
    const depthShort = (persona.length === 'Short' ? 'SURF' : persona.length === 'Detailed' ? 'DEEP' : 'MED');
    const levelShort = (persona.level === 'Basic' ? 'BEG' : persona.level === 'Beginner' ? 'INT' : 'EXP');

    const mappedTone = toneMap[toneShort] || 'Casual';
    const mappedStyle = styleMap[styleShort] || 'Thoughtful';
    const mappedDepth = depthMap[depthShort] || 'Medium depth';
    const mappedLevel = levelMap[levelShort] || 'Beginner-friendly';

    return `Your Communication DNA: ${mappedTone} · ${mappedStyle} · ${mappedDepth} · ${mappedLevel}`;
  };

  const codecCode = getDNALabel();

  const renderMessageStream = () => {
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      
      if (m.sender === 'user') {
        elements.push(
          <div key={m.id} className="flex flex-col items-end gap-1 w-full self-end animate-fade-in my-2">
            <div className="max-w-[75%] text-left font-sans text-sm text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 p-3 px-4 rounded-2xl relative shadow-sm whitespace-pre-wrap select-text border border-slate-200/55 dark:border-slate-700/50">
              <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] block mb-1">YOU</span>
              {m.text}
            </div>
          </div>
        );
      } else if (m.sender === 'cresent-ai') {
        if (layoutMode === 'focus') {
          const normalText = getStandardTextForCresent(i);
          const normalReasoning = messages.find(msg => msg.sender === 'normal-ai' && Math.abs(messages.indexOf(msg) - i) <= 2)?.reasoning;
          
          elements.push(
          <div key={m.id} className="flex flex-col items-start gap-1 w-full self-start animate-fade-in my-2">
            <div className="flex items-start gap-3 w-full">
              {/* Logo Monogram */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 flex-shrink-0 relative overflow-hidden">
                <Logo className="w-5 h-5 relative z-10 filter invert brightness-200" />
              </div>
                
                <div className="flex-1 text-sm leading-relaxed text-left select-text pt-0.5 max-w-[85%]">
                  <ReasoningBlock reasoning={m.reasoning} />
                  <div className="markdown-container text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px] block mb-2">CRESENT ({codecCode})</span>
                    <ReactMarkdown components={markdownComponents}>
                      {m.text}
                    </ReactMarkdown>
                  </div>

                  {normalText && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                      <button
                        onClick={() => togglePeek(m.id)}
                        className="text-[10px] uppercase font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {showStandardPeek[m.id] ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Hide Standard Response
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Compare Standard Response
                          </>
                        )}
                      </button>

                      <AnimatePresence>
                        {showStandardPeek[m.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-[14px] text-slate-600 dark:text-slate-300 shadow-sm"
                          >
                            <div className="flex items-center gap-1.5 mb-2.5 text-[10px] uppercase font-bold text-slate-400">
                              <Bot className="w-3.5 h-3.5" /> Standard Assistant
                            </div>
                            <ReasoningBlock reasoning={normalReasoning} />
                            <ReactMarkdown components={markdownComponents}>
                              {normalText}
                            </ReactMarkdown>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {m.sources && <SourcesUsed sources={m.sources} />}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-1.5 pl-11 select-none">
                <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Cresent ({persona.language} · {mode})
                </span>
                
                {/* Tooltip trigger button */}
                <div className="relative group inline-block">
                  <button 
                    type="button"
                    className="text-[9px] text-slate-400 hover:text-blue-500 font-semibold flex items-center gap-0.5 cursor-help transition-colors"
                  >
                    • Calibration details
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 rounded-2xl shadow-lg leading-relaxed z-50 select-none pointer-events-none">
                    <div className="font-bold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 animate-pulse" /> DNA MIX CONFIG
                    </div>
                    <ul className="flex flex-col gap-1.5 font-sans">
                      <li>🎯 <strong>Tone ({persona.tone}):</strong> {persona.tone === 'Casual' ? 'Casual slang, informal greetings, developer friend vibe' : persona.tone === 'Formal' ? 'Polite, grammatically perfect professional structure' : persona.tone === 'Neutral' ? 'Objective, dry scientific fact-driven phrasing' : 'Highly enthusiastic motivational and energetic structure'}.</li>
                      <li>🎓 <strong>Level ({persona.level}):</strong> Calibration set to {persona.level === 'Basic' ? 'fundamental concepts explained with simple analogies' : persona.level === 'Beginner' ? 'intermediate details' : 'deep technical insights, skipping general basics'}.</li>
                      <li>🌐 <strong>Language ({persona.language}):</strong> Rendered using {persona.language} syntax.</li>
                      <li>🤖 <strong>Role ({persona.role}):</strong> Shaped answer styling for a {persona.role} profile.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      } else if (m.sender === 'normal-ai' && layoutMode === 'comparison') {
        const siblingCresent = messages.find(msg => msg.sender === 'cresent-ai' && Math.abs(messages.indexOf(msg) - i) <= 2);
        
        elements.push(
          <div key={m.id} className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-2.5 animate-fade-in mt-1">
            
            <div className="flex flex-col gap-2.5 border-3 border-black p-4.5 bg-white dark:bg-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-1.5 pb-2 border-b-2 border-black select-none font-mono text-[9px] uppercase font-bold text-neutral-500">
                <Bot className="w-3.5 h-3.5" /> Standard LLM response
              </div>
              <div className="text-[15px] leading-relaxed text-left select-text mt-1">
                <ReasoningBlock reasoning={m.reasoning} />
                <ReactMarkdown components={markdownComponents}>
                  {m.text}
                </ReactMarkdown>
                {m.sources && <SourcesUsed sources={m.sources} />}
              </div>
              <span className="text-[8px] text-neutral-400 uppercase font-bold font-mono mt-2 pl-0.5">Generic Assistant</span>
            </div>

            {siblingCresent && (
              <div className="flex flex-col gap-2.5 border-3 border-black p-4.5 bg-white dark:bg-black shadow-[3px_3px_0px_#ef4444]">
                <div className="flex items-center gap-1.5 pb-2 border-b-2 border-black select-none font-mono text-[9px] uppercase font-bold text-[var(--accent-primary)]">
                  <Sparkles className="w-3.5 h-3.5" /> Cresent AI personalized response
                </div>
                <div className="text-[15px] leading-relaxed text-left select-text mt-1">
                  <ReasoningBlock reasoning={siblingCresent.reasoning} />
                  <ReactMarkdown components={markdownComponents}>
                    {siblingCresent.text}
                  </ReactMarkdown>
                  {siblingCresent.sources && <SourcesUsed sources={siblingCresent.sources} />}
                </div>
                <span className="text-[8px] text-[var(--accent-primary)] uppercase font-bold font-mono mt-2 pl-0.5">
                  Cresent AI ({persona.language} · {mode})
                </span>
              </div>
            )}
            
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden relative">
      
      {/* Active Chat Control Header */}
      {messages.length > 0 && (
        <div className="pb-3 mb-2 border-b border-[var(--border-color)]/30 flex items-center justify-between w-full px-1 flex-shrink-0 select-none">
          <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Active Workspace Sync Matrix</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => { playSynthSound('click', isMuted); setLayoutMode('focus'); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all border font-mono ${
                layoutMode === 'focus' 
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm' 
                  : 'bg-[var(--card-bg)] border-[var(--border-color)] text-neutral-500 hover:border-neutral-400'
              }`}
            >
              [ Focus View ]
            </button>
            <button
              onClick={() => { playSynthSound('click', isMuted); setLayoutMode('comparison'); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all border font-mono ${
                layoutMode === 'comparison' 
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm' 
                  : 'bg-[var(--card-bg)] border-[var(--border-color)] text-neutral-500 hover:border-neutral-400'
              }`}
            >
              [ Side-by-Side Vibe ]
            </button>
          </div>
        </div>
      )}

      {/* Welcome Greeting Screen (Only if no messages) */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center py-6 w-full select-none overflow-y-auto pr-1 z-10 max-w-4xl mx-auto font-sans text-slate-800 dark:text-slate-100">
          
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Welcome to CresentX
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Your personalized AI companion optimized by Communication DNA settings.
          </p>

          <div className="text-left w-full max-w-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm my-4 text-xs leading-relaxed flex flex-col gap-2">
            <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Active DNA Calibration Profile</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 mt-1 font-medium">
              <div>Tone: <span className="text-blue-600 dark:text-blue-400">{persona.tone}</span></div>
              <div>Emoji usage: <span className="text-blue-600 dark:text-blue-400">{persona.emojiUsage ? 'Enabled' : 'Disabled'}</span></div>
              <div>Complexity: <span className="text-blue-600 dark:text-blue-400">{persona.level}</span></div>
              <div>Language: <span className="text-blue-600 dark:text-blue-400">{persona.language}</span></div>
            </div>
          </div>

          {/* Suggested Conversations section */}
          <div className="w-full flex flex-col gap-3 mt-6 select-none max-w-xl text-left">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggested Prompts</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                "Explain quantum computing baselines",
                "Roast my Next.js tech stack",
                "Write a tagline for an image scanner app",
                "Give me conversational Tamil expressions"
              ] as const).map((title, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(title)}
                  className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-medium cursor-pointer transition-all shadow-sm"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat messages stream feed */}
      {messages.length > 0 && (
        <div 
          ref={cresentScrollRef}
          className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-6 w-full pr-2"
        >
          {renderMessageStream()}

        </div>
      )}

      {/* Center Input Panel */}
      <div className="w-full pt-4 flex flex-col gap-2.5 relative z-10 flex-shrink-0 max-w-3xl mx-auto select-none">
        
        {/* Input box */}
        {isCollapsedBubble ? (
          <div className="fixed bottom-6 right-6 z-50 select-none">
            <button
              onClick={() => {
                playSynthSound('click', isMuted);
                setIsCollapsedBubble(false);
              }}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-lg"
              title="Expand Chat Input Box"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-md relative"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder={`Ask CresentX anything...`}
              disabled={isLoading}
              rows={2}
              className="w-full px-3 py-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 resize-none outline-none border-none placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed font-sans"
            />

            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    setWebSearchEnabled(prev => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    webSearchEnabled
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>

                {/* Agent Mode button with NEW badge */}
                <button
                  type="button"
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    if (onTriggerAgentMode) onTriggerAgentMode();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                  <span>Agent Mode</span>
                </button>

                {/* Shrink / Bubble toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    playSynthSound('click', isMuted);
                    setIsCollapsedBubble(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-all"
                  title="Shrink input area into bubble"
                >
                  <Shrink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Shrink</span>
                </button>
              </div>

              {/* Circular submit button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                  input.trim() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                }`}
              >
                <Send className="w-4 h-4 transform -rotate-45 translate-x-0.5 -translate-y-0.5" />
              </button>
            </div>
          </form>
        )}

        {!isCollapsedBubble && (
          <span className="text-[10px] text-slate-400 text-center select-none font-sans">Press Shift + Enter for new line</span>
        )}
      </div>

    </div>
  );
}
