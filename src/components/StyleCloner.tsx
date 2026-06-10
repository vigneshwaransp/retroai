import React, { useState } from 'react';
import { UserPersona } from '@/lib/dnaEngine';
import { Upload, Check, AlertCircle, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSynthSound } from '@/app/page';

interface StyleClonerProps {
  persona: UserPersona;
  setPersona: React.Dispatch<React.SetStateAction<UserPersona>>;
  apiKey: string;
  isMuted?: boolean;
}

export default function StyleCloner({ persona, setPersona, apiKey, isMuted = false }: StyleClonerProps) {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const handlePasteSample = (text: string) => {
    playSynthSound('click', isMuted);
    setInputText(text);
  };

  const sampleTemplates = [
    {
      label: 'Casual Tech-slang',
      text: "Bro, this Next.js project is clean! Neumorphism renders so well in dark mode, machan. Let's build a MERN stack and connect to database asap. Ping me when free."
    },
    {
      label: 'Academic & Structured',
      text: "Consequently, the primary objective of this architecture is to optimize response rendering. By decoupling the presentation layer from the LLM prompt builder, we establish a robust pipeline. Furthermore, our empirical analysis shows a 15% latency drop."
    },
    {
      label: 'Corporate Professional',
      text: "Dear Team, Hope you are doing well. Please find attached the sprint retrospective summary. We need to align on action items for next week. Let's schedule a sync. Best regards."
    }
  ];

  const resetClone = () => {
    playSynthSound('delete', isMuted);
    setPersona(prev => ({
      ...prev,
      clonedStyle: undefined
    }));
    setAnalyzed(false);
    setInputText('');
    setScanLogs([]);
  };

  const analyzeStyleLocally = (text: string) => {
    if (text.trim().length < 20) {
      playSynthSound('delete', isMuted);
      setError('Please enter at least 20 characters to analyze your writing DNA.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setScanLogs([]);
    playSynthSound('scan', isMuted);

    const logSteps = [
      'Initializing parser middleware...',
      'Reading text buffer characters...',
      'Counting words and sentence limits...',
      'Extracting punctuation capitalization rates...',
      'Detecting vocabulary slang density...',
      'Evaluating emoji distribution patterns...',
      'Compiling system instructions prompt...',
      'Synthesizing cloned DNA profile successfully!'
    ];

    logSteps.forEach((step, idx) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, `[SYSTEM] ${step}`]);
        playSynthSound('click', isMuted);
      }, idx * 280);
    });

    setTimeout(() => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      const avgSentenceLen = Math.round(words.length / (sentences.length || 1));

      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;
      const emojisFound = text.match(emojiRegex) || [];
      const emojiFrequency = emojisFound.length / (sentences.length || 1);

      const capitalWords = words.filter(w => w[0] === w[0]?.toUpperCase() && w[0]?.toLowerCase() !== w[0]?.toUpperCase());
      const capitalizationRate = capitalWords.length / words.length;

      const textLower = text.toLowerCase();
      
      let description = 'Clean, direct style';
      let clonedRules = 'Maintain natural rhythm.';
      if (emojiFrequency > 0.5) {
        description = 'Expressive, emoji-rich style';
        clonedRules = 'Incorporate relevant emojis naturally at the end of key phrases.';
      } else if (capitalizationRate < 0.1) {
        description = 'Highly informal, lower-case writing style';
        clonedRules = 'Keep the grammar very casual. Do not capitalize the start of sentences.';
      } else if (avgSentenceLen > 18) {
        description = 'Analytical, compound structure';
        clonedRules = 'Use academic terminology, structured connectors, and compound sentences.';
      } else if (textLower.includes('bro') || textLower.includes('machan')) {
        description = 'Casual Tech-Slang Dialect';
        clonedRules = 'Blend casual tech speak with local slangs. Sprinkle "bro" and "machan" frequently.';
      }

      const phraseSamples = sentences
        .slice(0, 3)
        .map(s => s.trim())
        .filter(s => s.length > 5);

      setPersona(prev => ({
        ...prev,
        clonedStyle: {
          description,
          samplePhrases: phraseSamples,
          emojiFrequency: Number(emojiFrequency.toFixed(2)),
          avgSentenceLength: avgSentenceLen,
          clonedRules
        }
      }));

      setIsAnalyzing(false);
      setAnalyzed(true);
      playSynthSound('success', isMuted);

      // Elegant emerald green, mint, and white particles
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.75 },
        colors: ['#10B981', '#34D399', '#ffffff', '#a7f3d0']
      });

    }, 2600);
  };

  return (
    <div className="w-full p-6 brutal-card flex flex-col gap-6 relative bg-[var(--card-bg)]">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3.5 relative z-10 justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-foreground rounded-lg">
            <Upload className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-300" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider select-none text-[var(--foreground)]">
            📋 Style Scanner DNA Cloner
          </h2>
        </div>
        <Cpu className="w-4.5 h-4.5 text-[var(--accent-primary)] animate-[spin_6s_linear_infinite]" />
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed">
        Feed Retro your writing samples (emails, chats, articles). The AI engine will sequence your vocabulary patterns, syntax pacing, and sentence density to clone your voice.
      </p>

      <AnimatePresence mode="wait">
        {!persona.clonedStyle ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Template Buttons */}
            <div className="flex flex-wrap gap-2 select-none">
              {sampleTemplates.map((t, idx) => {
                return (
                  <button
                    key={idx}
                    onClick={() => handlePasteSample(t.text)}
                    className="px-3 py-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 border border-[var(--border-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-[var(--accent-primary)] transition-all cursor-pointer rounded-full bg-[var(--card-bg)]"
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Main Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your communication logs or sample text here (min 20 chars)..."
                rows={5}
                className="w-full p-4.5 brutal-input text-xs bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--border-color)] rounded-lg focus:border-[var(--accent-primary)] focus:outline-none"
                disabled={isAnalyzing}
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[var(--background)]/90 flex flex-col p-4 justify-between border border-[var(--border-color)] shadow-md rounded-xl z-30">
                  <motion.div 
                    className="w-[96%] h-[3px] bg-[var(--accent-primary)] shadow-[0_0_15px_var(--accent-primary)] absolute z-40"
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  />
                  
                  {/* CRT Screen style scanning console */}
                  <div className="w-full h-full p-3 rounded-lg terminal-output text-[9px] overflow-hidden leading-relaxed text-left flex flex-col">
                    <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-1.5 select-none">
                      <Terminal className="w-3.5 h-3.5 animate-pulse text-[var(--accent-primary)]" />
                      <span className="font-bold uppercase tracking-wider text-[8px] text-[var(--foreground)]">DNA Decoder Console</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden h-[90px]">
                      {scanLogs.map((log, i) => (
                        <div key={i} className="flex gap-1 animate-[pulse-light_1s_ease-in-out]">
                          <span className="text-neutral-400">{`>`}</span>
                          <span className="whitespace-nowrap overflow-hidden text-ellipsis text-[var(--foreground)]">{log}</span>
                        </div>
                      ))}
                      <div className="w-2 h-3.5 bg-neutral-400 dark:bg-white animate-pulse inline-block" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-650 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900/50 p-3 bg-red-50 dark:bg-red-950/20 select-none rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => analyzeStyleLocally(inputText)}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Sequence DNA
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex flex-col gap-4"
          >
            {/* Cloned Profile Card */}
            <div className="p-5 border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-sm flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 select-none">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <Check className="w-5 h-5 text-[var(--accent-primary)] rounded-full p-0.5" />
                  <span>DNA Linked!</span>
                </div>
                
                {/* Circular Gauge - Symmetrical border */}
                <div className="flex items-center gap-2 relative">
                  <span className="text-[10px] font-bold uppercase font-mono text-neutral-500">MIMICRY: 98%</span>
                  <div className="relative w-8 h-8 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-full">
                    <svg className="w-7 h-7" viewBox="0 0 36 36">
                      <path className="text-neutral-300 dark:text-neutral-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-[var(--accent-primary)]" strokeWidth="4" strokeDasharray="98, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Cloned Style Model:</span>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-foreground" />
                    <p className="text-xs font-bold text-[var(--accent-primary)] uppercase">
                      {persona.clonedStyle?.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  <div className="border border-[var(--border-color)] p-2.5 text-center bg-neutral-50/50 dark:bg-neutral-900/10 rounded-lg">
                    <span className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5 font-mono">Avg Sentence</span>
                    <span className="text-xs font-bold text-[var(--accent-primary)]">{persona.clonedStyle?.avgSentenceLength} words</span>
                  </div>
                  <div className="border border-[var(--border-color)] p-2.5 text-center bg-neutral-50/50 dark:bg-neutral-900/10 rounded-lg">
                    <span className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5 font-mono">Emoji Ratio</span>
                    <span className="text-xs font-bold text-[var(--accent-primary)]">{persona.clonedStyle?.emojiFrequency} / sentence</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Pacing & Syntax Rules:</span>
                  <p className="text-xs leading-relaxed font-semibold italic border border-[var(--border-color)] p-3 bg-[var(--card-bg)] rounded-lg">
                    "{persona.clonedStyle?.clonedRules}"
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1.5">DNA Sample Strands:</span>
                  <div className="flex flex-col gap-1.5">
                    {persona.clonedStyle?.samplePhrases.map((phrase, i) => (
                      <span key={i} className="text-[10px] px-3 py-2 border border-[var(--border-color)] font-mono font-medium bg-[var(--card-bg)] overflow-hidden text-ellipsis whitespace-nowrap rounded-lg">
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={resetClone}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer bg-[var(--card-bg)]"
            >
              Reset Cloned Style
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
