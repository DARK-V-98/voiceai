import React from 'react';
import { Mic, Users } from 'lucide-react';

interface ModeSelectorProps {
  mode: 'single' | 'multi';
  onSelectMode: (mode: 'single' | 'multi') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onSelectMode }) => {
  return (
    <div className="flex rounded-xl bg-[#080808] p-1.5 border border-[#1a1a1a] w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onSelectMode('single')}
        className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
          mode === 'single'
            ? 'bg-[#111] text-white shadow-md border border-[#222] ring-1 ring-[#9966ff]/20'
            : 'text-[#666] hover:text-white hover:bg-[#111]/50 border border-transparent'
        }`}
      >
        <Mic className={`w-3.5 h-3.5 mr-2 ${mode === 'single' ? 'text-[#9966ff]' : 'text-[#666]'}`} />
        <span>Single Voice Studio</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectMode('multi')}
        className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
          mode === 'multi'
            ? 'bg-[#111] text-white shadow-md border border-[#222] ring-1 ring-[#9966ff]/20'
            : 'text-[#666] hover:text-white hover:bg-[#111]/50 border border-transparent'
        }`}
      >
        <Users className={`w-3.5 h-3.5 mr-2 ${mode === 'multi' ? 'text-[#ff6699]' : 'text-[#666]'}`} />
        <span>Multi-Speaker Dialogue</span>
      </button>
    </div>
  );
};
