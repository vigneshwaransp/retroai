import React, { useState, useEffect, useRef } from 'react';
import { UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import { Send, Sparkles, Smile, Bot, Brain, CornerDownLeft, Activity, Cpu, Gauge, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSynthSound } from '@/app/page';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: 'user' | 'normal-ai' | 'retero-ai';
  text: string;
  reasoning?: string;
  timestamp: Date;
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
    <div className="mb-3 border border-amber-500/20 bg-amber-500/5 rounded-lg p-3 text-left font-mono relative overflow-hidden select-text">
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
            className="text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400 mt-2 border-t border-amber-500/10 pt-2 whitespace-pre-wrap select-text selection:bg-[var(--accent-primary)]/10 font-sans italic"
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
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
  engine: 'pollinations' | 'gemini' | 'openai' | 'huggingface' | 'groq' | 'nvidia';
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
  setMood
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);
  
  // Layout views: separate response cards or focused view
  const [layoutMode, setLayoutMode] = useState<'comparison' | 'focus'>('focus');
  const [showStandardPeek, setShowStandardPeek] = useState<Record<string, boolean>>({});

  // latencies telemetry
  const [normalLatency, setNormalLatency] = useState(0);
  const [reteroLatency, setReteroLatency] = useState(0);

  // Column refs for scroll locks
  const reteroScrollRef = useRef<HTMLDivElement>(null);

  // Lock scrolling within scroll containers only to prevent page jumping
  useEffect(() => {
    if (reteroScrollRef.current) {
      reteroScrollRef.current.scrollTo({
        top: reteroScrollRef.current.scrollHeight,
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

    const startTime = performance.now();

    try {
      const memoryContext = messages
        .slice(-4)
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

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
          engine
        })
      });

      const data = await response.json();
      const endTime = performance.now();

      const rawLatency = Math.round(endTime - startTime);
      setNormalLatency(Math.max(120, Math.round(rawLatency * 0.82)));
      setReteroLatency(rawLatency);

      if (response.ok) {
        setIsSandbox(data.isSandbox);
        playSynthSound('success', isMuted);
        
        const normalMsgId = Math.random().toString();
        const reteroMsgId = Math.random().toString();

        const normalMsg: Message = {
          id: normalMsgId,
          sender: 'normal-ai',
          text: '',
          reasoning: data.normalReasoning,
          timestamp: new Date()
        };

        const reteroMsg: Message = {
          id: reteroMsgId,
          sender: 'retero-ai',
          text: '',
          reasoning: data.personalizedReasoning,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, normalMsg, reteroMsg]);

        streamMessageText(normalMsgId, data.normal);
        streamMessageText(reteroMsgId, data.personalized);
      } else {
        throw new Error(data.error || 'Failed to fetch reply');
      }
    } catch (err: any) {
      console.error(err);
      playSynthSound('delete', isMuted);
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'retero-ai',
        text: `Error connecting to Retro engine: ${err.message || 'Server offline'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
  const userAndReteroMessages = messages.filter(m => m.sender === 'user' || m.sender === 'retero-ai');

  const getStandardTextForRetero = (reteroIndex: number) => {
    const reteroMsgs = userAndReteroMessages.filter(m => m.sender === 'retero-ai');
    const normalMsgs = userAndNormalMessages.filter(m => m.sender === 'normal-ai');
    const matchIndex = reteroMsgs.indexOf(userAndReteroMessages[reteroIndex]);
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

  const codecCode = `DNA-${persona.tone.substring(0, 4).toUpperCase()}-${persona.language.substring(0, 2).toUpperCase()}-${persona.length.substring(0, 3).toUpperCase()}-${persona.level.substring(0, 3).toUpperCase()}`;

  // Helper to render Claude-style paired and grouped messages
  const renderMessageStream = () => {
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      
      if (m.sender === 'user') {
        elements.push(
          <div key={m.id} className="flex flex-col items-end gap-1 w-full self-end max-w-[85%] animate-fade-in">
            <div className="bg-neutral-200/50 dark:bg-neutral-800/40 text-foreground px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap select-text">
              {m.text}
            </div>
            <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider px-2.5 font-mono select-none">
              You
            </span>
          </div>
        );
      } else if (m.sender === 'retero-ai') {
        // In focus mode, render Retro response with avatar node and inline standard comparison peeker
        if (layoutMode === 'focus') {
          const normalText = getStandardTextForRetero(i);
          const normalReasoning = messages.find(msg => msg.sender === 'normal-ai' && Math.abs(messages.indexOf(msg) - i) <= 2)?.reasoning;
          
          elements.push(
            <div key={m.id} className="flex flex-col items-start gap-1 w-full self-start animate-fade-in mt-1.5">
              <div className="flex items-start gap-4.5 w-full">
                {/* Logo Avatar Node */}
                <img src="/logo.png" alt="Retro AI" className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)] flex-shrink-0 shadow-sm" />
                
                {/* Text Content Pod */}
                <div className="flex-1 text-[15px] leading-relaxed text-left select-text pt-0.5">
                  <ReasoningBlock reasoning={m.reasoning} />
                  <div className="markdown-container font-sans text-neutral-800 dark:text-neutral-200">
                    <ReactMarkdown components={markdownComponents}>
                      {m.text}
                    </ReactMarkdown>
                  </div>

                  {/* Standard Peek expander */}
                  {normalText && (
                    <div className="mt-3.5 pt-3.5 border-t border-[var(--border-color)]/30 flex flex-col gap-2.5">
                      <button
                        onClick={() => togglePeek(m.id)}
                        className="text-[10px] uppercase font-bold text-neutral-400 hover:text-[var(--accent-primary)] flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
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
                            className="overflow-hidden bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-xl p-4 text-[14px] text-neutral-600 dark:text-neutral-350 shadow-sm font-sans"
                          >
                            <div className="flex items-center gap-1.5 mb-2.5 font-mono text-[9px] uppercase font-bold text-neutral-400">
                              <Bot className="w-3.5 h-3.5" /> Standard Assistant response
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
                </div>
              </div>
              
              <span className="text-[8px] text-neutral-400 mt-1.5 uppercase font-bold tracking-wider pl-14.5 font-mono flex items-center gap-1 select-none">
                <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Retro AI ({persona.language} · {mode})</span>
              </span>
            </div>
          );
        }
      } else if (m.sender === 'normal-ai' && layoutMode === 'comparison') {
        // In comparison mode, find the sibling retero-ai response and render standard and Retro side-by-side inside this turn
        const siblingRetero = messages.find(msg => msg.sender === 'retero-ai' && Math.abs(messages.indexOf(msg) - i) <= 2);
        
        elements.push(
          <div key={m.id} className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-2.5 animate-fade-in mt-1">
            
            {/* Left Column: Standard assistant */}
            <div className="flex flex-col gap-2.5 border border-[var(--border-color)] p-4.5 rounded-xl bg-neutral-200/5 dark:bg-neutral-800/5 shadow-sm">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--border-color)]/30 select-none font-mono text-[9px] uppercase font-bold text-neutral-400">
                <Bot className="w-3.5 h-3.5" /> Standard LLM response
              </div>
              <div className="text-[15px] leading-relaxed text-left select-text mt-1">
                <ReasoningBlock reasoning={m.reasoning} />
                <ReactMarkdown components={markdownComponents}>
                  {m.text}
                </ReactMarkdown>
              </div>
              <span className="text-[8px] text-neutral-400 uppercase font-bold font-mono mt-2 pl-0.5">Generic Assistant</span>
            </div>

            {/* Right Column: Retro assistant */}
            {siblingRetero && (
              <div className="flex flex-col gap-2.5 border border-[var(--accent-primary)]/20 p-4.5 rounded-xl bg-[var(--card-bg)] shadow-sm">
                <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--border-color)]/30 select-none font-mono text-[9px] uppercase font-bold text-[var(--accent-primary)]">
                  <Sparkles className="w-3.5 h-3.5" /> Retro AI personalized response
                </div>
                <div className="text-[15px] leading-relaxed text-left select-text mt-1">
                  <ReasoningBlock reasoning={siblingRetero.reasoning} />
                  <ReactMarkdown components={markdownComponents}>
                    {siblingRetero.text}
                  </ReactMarkdown>
                </div>
                <span className="text-[8px] text-[var(--accent-primary)] uppercase font-bold font-mono mt-2 pl-0.5">
                  Retro AI ({persona.language} · {mode})
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
      
      {/* Welcome Greeting Screen (Only if no messages) */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center py-10 max-w-2xl mx-auto w-full select-none font-sans overflow-y-auto">
          <img src="/logo.png" alt="Retro AI Logo" className="w-28 h-28 rounded-full object-cover border border-[var(--border-color)] shadow-md mb-5.5 animate-[pulse_3s_infinite]" />
          <h2 className="text-2.5xl font-serif font-bold text-neutral-800 dark:text-neutral-100 mb-2 leading-tight">
            Good afternoon.
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7.5 font-serif italic max-w-md">
            Assistant profile calibrated to <code className="font-mono text-[10px] bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded font-bold uppercase text-[var(--accent-primary)]">{codecCode}</code>. What would you like to discuss today?
          </p>

          {/* Quick templates suggestion pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="p-3 text-left rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-semibold hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat messages stream feed */}
      {messages.length > 0 && (
        <div 
          ref={reteroScrollRef}
          className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-6 w-full pr-2"
        >
          {renderMessageStream()}
          
          {isLoading && (
            <div className="self-start flex flex-col gap-1.5 animate-fade-in">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Thinking..." className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)] animate-[spin_4s_linear_infinite]" />
                <div className="bg-neutral-100 dark:bg-neutral-900 border border-[var(--border-color)] p-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              {engine === 'nvidia' && (
                <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-mono pl-13 select-none animate-pulse">
                  Thinking long for a better response...
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Center Capsule Input Card */}
      <div className="w-full pt-4 flex flex-col gap-2 relative z-10 flex-shrink-0 max-w-3xl mx-auto">
        
        {/* Capsule form input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="w-full border border-[var(--border-color)] rounded-2xl bg-[var(--card-bg)] shadow-sm focus-within:border-[var(--accent-primary)] focus-within:shadow-md transition-all p-2 flex flex-col gap-1.5"
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
            placeholder={`Ask Retro AI anything...`}
            disabled={isLoading}
            rows={2}
            className="w-full px-3 py-2 bg-transparent text-[15px] text-[var(--foreground)] resize-none outline-none border-none placeholder-neutral-400 dark:placeholder-neutral-500 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between border-t border-[var(--border-color)]/30 pt-2 px-2 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">Press Enter to Send</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-2 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                input.trim() 
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm hover:opacity-90' 
                  : 'bg-neutral-200 dark:bg-neutral-800/50 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
