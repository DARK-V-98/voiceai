import React from 'react';
import { GeneratedAudioItem } from '../types';
import { Download, Trash2, Clock, Users, Mic } from 'lucide-react';

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
      <div className="bg-white rounded-2xl p-8 border border-dashed border-[#d5d9e0] text-center">
        <Clock className="w-8 h-8 text-[#c2c8d3] mx-auto mb-2" />
        <h4 className="text-lg font-serif italic font-semibold text-[#111827]">No History Yet</h4>
        <p className="text-xs text-[#8a92a6] mt-1 leading-relaxed">
          Generated voiceovers appear here for easy comparison and instant downloading.
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
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e7e9ef] space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eef0f4] pb-3.5">
        <div className="flex items-center space-x-2.5">
          <h3 className="text-base sm:text-lg font-serif italic font-semibold text-[#111827] tracking-tight">
            Session Library
          </h3>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-[#7c3aed]">
            {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-mono uppercase tracking-wider text-[#9aa2b1] hover:text-rose-500 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 -mr-1">
        {items.map((item) => {
          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-violet-50/60 border-[#7c3aed]/30 shadow-sm'
                  : 'bg-[#f8f9fb] hover:bg-white border-[#eef0f4] hover:border-[#d5d9e0]'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white shadow-sm'
                      : item.mode === 'single'
                      ? 'bg-white border border-[#e2e5ec] text-[#7c3aed]'
                      : 'bg-white border border-[#e2e5ec] text-[#db2777]'
                  }`}
                >
                  {item.mode === 'single' ? <Mic className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-mono font-bold text-[#1f2430] truncate">{item.title}</h4>
                    {isSelected && (
                      <span className="inline-flex items-center text-[9px] font-mono uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#7c3aed] text-white flex-shrink-0">
                        Playing
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-sans truncate mt-0.5 text-[#8a92a6]">
                    {item.text}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, item)}
                  className="p-2 rounded-lg transition-all cursor-pointer text-[#9aa2b1] hover:text-[#7c3aed] hover:bg-white"
                  title="Download WAV"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-2 rounded-lg transition-all cursor-pointer text-[#9aa2b1] hover:text-rose-500 hover:bg-rose-50"
                  title="Delete"
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
