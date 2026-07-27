import React from 'react';
import { Mic, Users } from 'lucide-react';

interface ModeSelectorProps {
  mode: 'single' | 'multi';
  onSelectMode: (mode: 'single' | 'multi') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onSelectMode }) => {
  return (
    <div className="flex rounded-xl bg-[#eef0f4] p-1 border border-[#e2e5ec] w-full md:w-auto">
      <button
        type="button"
        onClick={() => onSelectMode('single')}
        className={`flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-[11px] sm:text-xs uppercase tracking-wide font-bold transition-all duration-200 cursor-pointer ${
          mode === 'single'
            ? 'bg-white text-[#111827] shadow-sm ring-1 ring-[#7c3aed]/20'
            : 'text-[#7a8296] hover:text-[#111827]'
        }`}
      >
        <Mic className={`w-4 h-4 mr-2 ${mode === 'single' ? 'text-[#7c3aed]' : 'text-[#9aa2b1]'}`} />
        <span>Single Voice</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectMode('multi')}
        className={`flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-[11px] sm:text-xs uppercase tracking-wide font-bold transition-all duration-200 cursor-pointer ${
          mode === 'multi'
            ? 'bg-white text-[#111827] shadow-sm ring-1 ring-[#db2777]/20'
            : 'text-[#7a8296] hover:text-[#111827]'
        }`}
      >
        <Users className={`w-4 h-4 mr-2 ${mode === 'multi' ? 'text-[#db2777]' : 'text-[#9aa2b1]'}`} />
        <span>Multi-Speaker</span>
      </button>
    </div>
  );
};
