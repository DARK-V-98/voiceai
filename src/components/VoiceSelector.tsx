import React from 'react';
import { VoiceModel, VoiceId } from '../types';
import { GEMINI_VOICES } from '../data';
import { Check, Loader2, Volume2 } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoiceId: VoiceId;
  onSelectVoice: (id: VoiceId) => void;
  onPreviewVoice: (voice: VoiceModel) => void;
  previewingId: VoiceId | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  previewingId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#444] font-bold">
          1. Select Voice Actor
        </h3>
        <span className="text-xs font-mono text-[#9966ff]">
          {GEMINI_VOICES.length} Prebuilt Multilingual Timbres
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {GEMINI_VOICES.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPreviewing = previewingId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`group cursor-pointer p-4 rounded-xl transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#111] border-[#333] ring-1 ring-[#9966ff]/50 shadow-lg shadow-[#9966ff]/5'
                  : 'bg-[#080808] border-[#1a1a1a] hover:bg-[#111] hover:border-[#222]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-serif italic text-white tracking-tight">{voice.name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-tr from-[#9966ff] to-[#ff6699] text-white text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
                      isSelected
                        ? 'bg-[#1a1a1a] text-white border-[#444]'
                        : voice.colorClass
                    }`}
                  >
                    {voice.badge}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-wider mb-2 text-[#666]">
                  <span>{voice.gender}</span>
                  <span>•</span>
                  <span>{voice.tone}</span>
                </div>

                <p className="text-[11px] leading-relaxed mb-4 text-[#888]">
                  {voice.description}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewVoice(voice);
                }}
                disabled={isPreviewing}
                className={`w-full mt-auto inline-flex items-center justify-center py-2 px-3 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white hover:bg-[#eee] text-black shadow-sm'
                    : 'bg-[#111] hover:bg-white hover:text-black text-white border border-[#222]'
                }`}
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Preview Voice</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
