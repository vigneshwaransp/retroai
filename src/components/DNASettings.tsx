import React, { useState, useRef, useEffect } from 'react';
import { UserPersona } from '@/lib/dnaEngine';
import { Smile, MessageSquare, Headphones, Globe, Sliders, Dna, ChevronDown } from 'lucide-react';
import { playSynthSound } from '@/app/page';
import { motion, AnimatePresence } from 'framer-motion';

interface DNASettingsProps {
  persona: UserPersona;
  setPersona: React.Dispatch<React.SetStateAction<UserPersona>>;
  isMuted?: boolean;
  onMutate?: () => void;
}

export default function DNASettings({ 
  persona, 
  setPersona, 
  isMuted = false,
  onMutate
}: DNASettingsProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const updateField = (key: keyof UserPersona, value: any) => {
    playSynthSound('click', isMuted);
    setPersona((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const tones: UserPersona['tone'][] = ['Casual', 'Formal', 'Neutral', 'Hype'];
  const languages: UserPersona['language'][] = ['English', 'Tamil', 'Thanglish', 'Hinglish'];
  const verbosityValues: UserPersona['length'][] = ['Short', 'Medium', 'Detailed'];
  const depthValues: UserPersona['level'][] = ['Basic', 'Beginner', 'Expert'];

  const resetDefaults = () => {
    playSynthSound('delete', isMuted);
    setPersona({
      name: 'Vicky',
      tone: 'Casual',
      length: 'Medium',
      level: 'Beginner',
      language: 'Thanglish',
      emojiUsage: true,
      role: 'Student',
    });
  };

  const mutateSync = () => {
    playSynthSound('success', isMuted);
    if (onMutate) onMutate();
  };

  // Generate the short DNA Codec code
  const toneShort = persona.tone.substring(0, 4).toUpperCase();
  const langShort = persona.language.substring(0, 2).toUpperCase();
  const lenShort = persona.length.substring(0, 3).toUpperCase();
  const lvlShort = persona.level.substring(0, 3).toUpperCase();
  const codecCode = `DNA-${toneShort}-${langShort}-${lenShort}-${lvlShort}`;

  return (
    <div className="flex flex-col gap-5 w-full select-none">
      
      {/* 1. IDENTITY CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-4">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
          <MessageSquare className="w-3.5 h-3.5" /> Identity
        </h3>

        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono">Target role</label>
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full px-3 py-2 brutal-input text-xs font-medium cursor-pointer bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--border-color)] rounded-lg focus:border-[var(--accent-primary)] focus:outline-none flex items-center justify-between text-left"
          >
            <span>{persona.role}</span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          
          <AnimatePresence>
            {roleDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-[100%] left-0 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 py-1 overflow-hidden"
              >
                {(['Student', 'Tech Expert', 'Founder of Technology'] as const).map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => {
                      updateField('role', roleOption);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-xs text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium cursor-pointer ${
                      persona.role === roleOption 
                        ? 'text-[var(--accent-primary)] font-bold bg-neutral-50 dark:bg-neutral-900/50' 
                        : 'text-[var(--foreground)]'
                    }`}
                  >
                    {roleOption}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. TONE FREQUENCY CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-3.5">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
          <Headphones className="w-3.5 h-3.5" /> Tone Frequency
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {tones.map((t) => {
            const isActive = persona.tone === t;
            return (
              <button
                key={t}
                onClick={() => updateField('tone', t)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                    : 'bg-[var(--card-bg)] text-neutral-700 dark:text-neutral-300 border-[var(--border-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LANGUAGE CODEC CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-3.5">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
          <Globe className="w-3.5 h-3.5" /> Language Codec
        </h3>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => {
            const isActive = persona.language === l;
            return (
              <button
                key={l}
                onClick={() => updateField('language', l)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                    : 'bg-[var(--card-bg)] text-neutral-700 dark:text-neutral-300 border-[var(--border-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. VERBOSITY & DEPTH CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-4">
        
        {/* Verbosity Slider */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5" /> Verbosity
          </h3>
          <div className="px-1 flex flex-col gap-1.5">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={verbosityValues.indexOf(persona.length)}
              onChange={(e) => updateField('length', verbosityValues[parseInt(e.target.value)])}
              className="brutal-slider cursor-pointer w-full accent-[var(--accent-primary)]"
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-500 font-bold uppercase">
              <span>Short</span>
              <span className="text-[10px] text-[var(--accent-primary)] font-extrabold">{persona.length}</span>
              <span>Detailed</span>
            </div>
          </div>
        </div>

        {/* Depth Slider */}
        <div className="flex flex-col gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3.5">
          <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
            <Dna className="w-3.5 h-3.5" /> Depth
          </h3>
          <div className="px-1 flex flex-col gap-1.5">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={depthValues.indexOf(persona.level)}
              onChange={(e) => updateField('level', depthValues[parseInt(e.target.value)])}
              className="brutal-slider cursor-pointer w-full accent-[var(--accent-primary)]"
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-500 font-bold uppercase">
              <span>Basic</span>
              <span className="text-[10px] text-[var(--accent-primary)] font-extrabold">{persona.level}</span>
              <span>Expert</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. EMOJI ADAPTER CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Emoji adapter</span>
          </div>
          <button
            onClick={() => updateField('emojiUsage', !persona.emojiUsage)}
            className={`w-10 h-6.5 rounded-full p-0.5 relative transition-colors duration-200 border cursor-pointer ${
              persona.emojiUsage ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'bg-neutral-200 dark:bg-neutral-800 border-[var(--border-color)]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform duration-200 bg-white shadow-sm ${
                persona.emojiUsage 
                  ? 'translate-x-4' 
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Codec Display Badge */}
        <div className="border border-dashed border-[var(--border-color)] p-2.5 rounded-lg flex flex-col items-center justify-center text-center mt-1.5 bg-neutral-50/50 dark:bg-neutral-900/10">
          <span className="text-[10px] font-extrabold font-mono text-[var(--accent-primary)] tracking-wide">{codecCode}</span>
          <span className="text-[8px] font-mono text-neutral-500 dark:text-neutral-400 uppercase mt-0.5 tracking-wider font-bold">
            {persona.tone} · {persona.language} · {persona.length} · {persona.level}
          </span>
        </div>
      </div>

      {/* 6. MUTATE CARD */}
      <div className="p-4.5 brutal-card flex flex-col gap-2.5 bg-transparent border-none shadow-none p-0!">
        <button
          onClick={mutateSync}
          className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer shadow-sm active:scale-98"
        >
          Mutate + Sync DNA
        </button>
        <button
          onClick={resetDefaults}
          className="w-full py-2.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-[var(--border-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer bg-[var(--card-bg)]"
        >
          Reset defaults
        </button>
      </div>

    </div>
  );
}
