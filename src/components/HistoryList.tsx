import React from 'react';
import { GeneratedAudioItem } from '../types';
import { Volume2, Play, Download, Trash2, Clock, Check, Users, Mic } from 'lucide-react';

interface HistoryListProps {
  items: GeneratedAudioItem[];
  selectedItem: GeneratedAudioItem | null;
  onSelectItem: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onDeleteItem,
  onClearAll,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-[#080808] rounded-2xl p-8 border border-[#1a1a1a] text-center shadow-xl">
        <Clock className="w-8 h-8 text-[#444] mx-auto mb-2" />
        <h4 className="text-lg font-serif italic text-white">No History Yet</h4>
        <p className="text-xs text-[#666] mt-1">
          Generated voiceovers will appear here for easy comparison and instant downloading.
        </p>
      </div>
    );
  }

  const handleDownload = (e: React.MouseEvent, item: GeneratedAudioItem) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.audioData;
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.download = `${cleanTitle || 'ai_voice'}_24khz.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#080808] rounded-2xl p-6 border border-[#1a1a1a] space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3.5">
        <div className="flex items-center space-x-2.5">
          <h3 className="text-lg font-serif italic text-white tracking-tight">
            3. Session Audio Library
          </h3>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#111] border border-[#222] text-[#9966ff]">
            {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-mono uppercase tracking-wider text-[#666] hover:text-rose-400 transition-colors cursor-pointer"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#111] text-white border-[#333] shadow-lg'
                  : 'bg-[#0a0a0a] hover:bg-[#111] text-white border-[#1a1a1a] hover:border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#9966ff] to-[#ff6699] text-white shadow-sm'
                      : item.mode === 'single'
                      ? 'bg-[#111] border border-[#222] text-[#9966ff]'
                      : 'bg-[#111] border border-[#222] text-[#ff6699]'
                  }`}
                >
                  {item.mode === 'single' ? <Mic className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <h4 className="text-xs font-mono font-bold truncate">{item.title}</h4>
                    {isSelected && (
                      <span className="inline-flex items-center text-[10px] font-mono uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#9966ff] text-white">
                        Playing
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] font-sans truncate mt-0.5 ${
                      isSelected ? 'text-[#aaa]' : 'text-[#666]'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, item)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#222] hover:bg-white hover:text-black text-white'
                      : 'text-[#666] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                  title="Download WAV file"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'text-rose-400 hover:bg-rose-500/20'
                      : 'text-[#666] hover:text-rose-400 hover:bg-[#1a1a1a]'
                  }`}
                  title="Delete recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
