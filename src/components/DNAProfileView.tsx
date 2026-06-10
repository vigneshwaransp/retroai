import React, { useState, useEffect } from 'react';
import { UserPersona } from '@/lib/dnaEngine';
import { Activity, Dna, FileText } from 'lucide-react';

interface DNAProfileViewProps {
  persona: UserPersona;
}

export default function DNAProfileView({ persona }: DNAProfileViewProps) {
  const [basePairs, setBasePairs] = useState<string[]>([]);

  // Generate dynamic ATCG pairs
  useEffect(() => {
    const bases = ['A', 'T', 'C', 'G'];
    const generated: string[] = [];
    const count = 7;
    
    const seedStr = `${persona.name}-${persona.tone}-${persona.language}-${persona.length}-${persona.level}-${persona.emojiUsage}-${persona.role}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let i = 0; i < count; i++) {
      const idx = Math.abs((hash + i) % 4);
      const b1 = bases[idx];
      const b2 = b1 === 'A' ? 'T' : b1 === 'T' ? 'A' : b1 === 'C' ? 'G' : 'C';
      
      let label = 'GENETIC';
      if (i === 0) label = `TONE:${persona.tone.substring(0,3).toUpperCase()}`;
      if (i === 1) label = `LANG:${persona.language.substring(0,3).toUpperCase()}`;
      if (i === 2) label = `LEN:${persona.length.substring(0,3).toUpperCase()}`;
      if (i === 3) label = `LVL:${persona.level.substring(0,3).toUpperCase()}`;
      if (i === 4) label = `EMO:${persona.emojiUsage ? 'YES' : 'NO'}`;
      if (i === 5) label = `ROLE:${persona.role.substring(0,3).toUpperCase()}`;
      if (i === 6) label = `MUT:SYNC`;

      generated.push(`[${label}] ${b1}-${b2}`);
    }
    setBasePairs(generated);
  }, [persona]);

  const toneShort = persona.tone.substring(0, 4).toUpperCase();
  const langShort = persona.language.substring(0, 2).toUpperCase();
  const lenShort = persona.length.substring(0, 3).toUpperCase();
  const lvlShort = persona.level.substring(0, 3).toUpperCase();
  const codecCode = `DNA-${toneShort}-${langShort}-${lenShort}-${lvlShort}`;

  return (
    <div className="w-full p-6 mono-card flex flex-col gap-6 relative select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#262626] pb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-foreground rounded-lg">
            <Dna className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-300" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider">
            🧬 DNA Genetic Profile Visualizer
          </h2>
        </div>
        <Activity className="w-4 h-4 text-neutral-400 animate-pulse" />
      </div>

      {/* Double Helix DNA - Thin, elegant monochrome SVG */}
      <div className="w-full py-6 border border-[#e5e5e5] dark:border-neutral-800 bg-[#fdfdfd] dark:bg-[#0c0c0e] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[8px] uppercase tracking-wider text-neutral-400 font-bold absolute top-2.5 font-mono">
          Double-Helix Visualization
        </span>
        <svg className="w-[90%] h-14 mt-2 text-neutral-300 dark:text-neutral-700" viewBox="0 0 300 40">
          <defs>
            <linearGradient id="helix-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8e8e93" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="helix-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8e8e93" stopOpacity="0.3" />
              <stop offset="50%" stopColor="var(--foreground)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8e8e93" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path 
            d="M 10 20 Q 45 5, 80 20 T 150 20 T 220 20 T 290 20" 
            stroke="url(#helix-grad-1)" 
            strokeWidth="1.5" 
            fill="none" 
            className="animate-[pulse_2s_infinite]" 
          />
          <path 
            d="M 10 20 Q 45 35, 80 20 T 150 20 T 220 20 T 290 20" 
            stroke="url(#helix-grad-2)" 
            strokeWidth="1.5" 
            fill="none"
          />
          
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 20 + i * 24;
            const offset = Math.sin((x / 300) * Math.PI * 4.5) * 12;
            return (
              <g key={i}>
                <line 
                  x1={x} 
                  y1={20 - offset} 
                  x2={x} 
                  y2={20 + offset} 
                  stroke="currentColor" 
                  strokeWidth="0.8" 
                  opacity="0.25"
                />
                <circle 
                  cx={x} 
                  cy={20 - offset} 
                  r="2" 
                  fill="var(--foreground)" 
                  className="shadow-[0_0_8px_var(--foreground)]"
                />
                <circle 
                  cx={x} 
                  cy={20 + offset} 
                  r="2" 
                  fill="var(--foreground)" 
                  opacity="0.6"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Codec Badge & Details */}
      <div className="p-4 border-2 border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-[3px_3px_0px_var(--shadow-color)] flex items-center justify-center text-center">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-black text-neutral-500 font-mono">Profile Codec ID</span>
          <span className="text-sm font-black text-foreground font-mono">{codecCode}</span>
        </div>
      </div>

      {/* DNA Genetic Sequence Monitor - Silver blocks */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-[8px] font-black uppercase tracking-widest text-foreground flex items-center justify-between font-mono">
          <span>DNA Sequence Matrix</span>
          <span className="text-[7px] text-white bg-[var(--accent-pink)] border-2 border-[var(--border-color)] px-1.5 py-0.5 rounded font-black">MUTATE:SYNC</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {basePairs.map((pair, idx) => (
            <div 
              key={idx} 
              className="px-2.5 py-2 border-2 border-[var(--border-color)] rounded-lg text-[9px] text-center font-mono font-extrabold bg-[var(--card-bg)] text-foreground shadow-[3px_3px_0px_var(--shadow-color)] transition-all hover:bg-[var(--accent-yellow)] hover:text-black hover:translate-y-[-1px] cursor-default"
            >
              {pair}
            </div>
          ))}
        </div>
      </div>

      {/* Descriptive Analysis Summary */}
      <div className="p-4.5 border border-[#e5e5e5] dark:border-[#262626] rounded-xl flex flex-col gap-2.5 bg-neutral-50 dark:bg-[#0c0c0e]">
        <span className="text-[9px] uppercase font-bold text-neutral-400 flex items-center gap-1 font-mono">
          <FileText className="w-3.5 h-3.5" /> Codec Matrix Analysis
        </span>
        <p className="text-xs leading-relaxed font-semibold">
          Your assistant Retero AI is configured to write in a <strong className="text-foreground font-bold">{persona.tone}</strong> tone as a <strong className="text-foreground font-bold">{persona.role}</strong>. It outputs answers in <strong className="text-foreground font-bold">{persona.language}</strong>, targeting a verbosity level of <strong className="text-foreground font-bold">{persona.length}</strong> and a knowledge depth filter calibrated for <strong className="text-foreground font-bold">{persona.level}</strong> learners.
        </p>
      </div>

    </div>
  );
}
