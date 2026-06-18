import React, { useState, useRef, useEffect } from 'react';
import { UserPersona } from '@/lib/dnaEngine';
import { Smile, MessageSquare, Headphones, Globe, Sliders, Dna, ChevronDown, Lock, Unlock } from 'lucide-react';
import { playSynthSound } from '@/app/page';
import { motion, AnimatePresence } from 'framer-motion';

interface DNASettingsProps {
  persona: UserPersona;
  setPersona: React.Dispatch<React.SetStateAction<UserPersona>>;
  isMuted?: boolean;
  onMutate?: () => void;
  isLocked?: boolean;
  setIsLocked?: (locked: boolean) => void;
}

export default function DNASettings({ 
  persona, 
  setPersona, 
  isMuted = false,
  onMutate,
  isLocked = false,
  setIsLocked
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
    if (isLocked) return;
    playSynthSound('click', isMuted);
    setPersona((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const tones: UserPersona['tone'][] = ['Casual', 'Formal', 'Neutral', 'Hype'];
  const languages: UserPersona['language'][] = ['English', 'Tamil'];
  const verbosityValues: UserPersona['length'][] = ['Short', 'Medium', 'Detailed'];
  const depthValues: UserPersona['level'][] = ['Basic', 'Beginner', 'Expert'];

  const resetDefaults = () => {
    if (isLocked) return;
    playSynthSound('delete', isMuted);
    setPersona({
      name: 'Vicky',
      tone: 'Casual',
      length: 'Medium',
      level: 'Beginner',
      language: 'English',
      emojiUsage: true,
      role: 'Student',
    });
  };

  const mutateSync = () => {
    playSynthSound('success', isMuted);
    if (onMutate) onMutate();
  };

  // Generate the DNA Codec label
  const toneShort = persona.tone.substring(0, 4).toUpperCase();
  const langShort = persona.language.substring(0, 2).toUpperCase();
  const lenShort = persona.length.substring(0, 3).toUpperCase();
  const lvlShort = persona.level.substring(0, 3).toUpperCase();
  const codecCode = `DNA-${toneShort}-${langShort}-${lenShort}-${lvlShort}`;

  return (
    <div className="flex flex-col gap-4 w-full select-none text-slate-800 dark:text-slate-100 font-sans">
      
      {/* LOCK DNA CARD */}
      <div className="p-4 brutal-card flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          {isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
          <span className="text-xs font-semibold uppercase tracking-wider">DNA Security Lock</span>
        </div>
        <button
          onClick={() => {
            if (setIsLocked) {
              const nextVal = !isLocked;
              setIsLocked(nextVal);
            }
          }}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer border ${
            isLocked 
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
          }`}
        >
          {isLocked ? 'Locked' : 'Unlocked'}
        </button>
      </div>
      
      {/* 1. IDENTITY CARD */}
      <div className={`p-4 brutal-card flex flex-col gap-3.5 ${isLocked ? 'opacity-60' : ''}`}>
        <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-blue-500" /> Identity Profile
        </h3>

        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase">Target Persona Role</label>
          <button
            type="button"
            disabled={isLocked}
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className={`w-full px-3 py-2 brutal-input text-xs font-medium bg-transparent border flex items-center justify-between text-left ${
              isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span>{persona.role}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          <AnimatePresence>
            {roleDropdownOpen && !isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute top-[100%] left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1"
              >
                {(['Student', 'Tech Expert', 'Founder of Technology'] as const).map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => {
                      updateField('role', roleOption);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      persona.role === roleOption 
                        ? 'text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-400 font-medium' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
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
      <div className={`p-4 brutal-card flex flex-col gap-3 ${isLocked ? 'opacity-60' : ''}`}>
        <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
          <Headphones className="w-4 h-4 text-blue-500" /> Tone of Voice
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {tones.map((t) => {
            const isActive = persona.tone === t;
            return (
              <button
                key={t}
                disabled={isLocked}
                onClick={() => updateField('tone', t)}
                className={`py-1.5 px-3 text-xs font-medium border rounded-lg transition-all ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LANGUAGE CODEC CARD */}
      <div className={`p-4 brutal-card flex flex-col gap-3 ${isLocked ? 'opacity-60' : ''}`}>
        <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-blue-500" /> Language Output
        </h3>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => {
            const isActive = persona.language === l;
            return (
              <button
                key={l}
                disabled={isLocked}
                onClick={() => updateField('language', l)}
                className={`py-1 px-4 text-xs font-medium border rounded-lg transition-all ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. VERBOSITY & DEPTH CARD */}
      <div className={`p-4 brutal-card flex flex-col gap-3.5 ${isLocked ? 'opacity-60' : ''}`}>
        
        {/* Verbosity Slider */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-500" /> Response Length
          </h3>
          <div className="px-1 flex flex-col gap-1.5">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              disabled={isLocked}
              value={verbosityValues.indexOf(persona.length)}
              onChange={(e) => updateField('length', verbosityValues[parseInt(e.target.value)])}
              className={`brutal-slider w-full ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>Concise</span>
              <span className="text-xs font-semibold text-blue-500">{persona.length}</span>
              <span>Detailed</span>
            </div>
          </div>
        </div>

        {/* Depth Slider */}
        <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3.5">
          <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Dna className="w-4 h-4 text-blue-500" /> Explanation Depth
          </h3>
          <div className="px-1 flex flex-col gap-1.5">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              disabled={isLocked}
              value={depthValues.indexOf(persona.level)}
              onChange={(e) => updateField('level', depthValues[parseInt(e.target.value)])}
              className={`brutal-slider w-full ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>Basic</span>
              <span className="text-xs font-semibold text-blue-500">{persona.level}</span>
              <span>Expert</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. EMOJI ADAPTER CARD */}
      <div className={`p-4 brutal-card flex flex-col gap-3 ${isLocked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Emoji Usage</span>
          </div>
          <button
            disabled={isLocked}
            onClick={() => updateField('emojiUsage', !persona.emojiUsage)}
            className={`w-11 h-6 p-0.5 relative transition-colors duration-200 rounded-full border ${
              isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${
              persona.emojiUsage ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 dark:bg-slate-700 border-transparent'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full transition-transform duration-200 bg-white shadow-sm ${
                persona.emojiUsage 
                  ? 'translate-x-5' 
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Codec Display Badge */}
        <div className="border border-slate-100 dark:border-slate-800 p-2 flex flex-col items-center justify-center text-center mt-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{codecCode}</span>
          <span className="text-[10px] text-slate-400 uppercase mt-0.5 font-medium">
            {persona.tone} · {persona.language} · {persona.length} · {persona.level}
          </span>
        </div>
      </div>

      {/* 6. MUTATE CARD */}
      <div className="flex flex-col gap-2 bg-transparent border-none p-0!">
        <button
          onClick={mutateSync}
          className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
        >
          Calibrate Profile
        </button>
        <button
          disabled={isLocked}
          onClick={resetDefaults}
          className={`w-full py-2 text-xs font-semibold uppercase border rounded-lg transition-all bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 ${
            isLocked 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
          }`}
        >
          Reset to Defaults
        </button>
      </div>

    </div>
  );
}
