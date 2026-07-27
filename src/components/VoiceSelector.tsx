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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#9aa2b1] font-bold">
          1. Select Voice Actor
        </h3>
        <span className="text-[11px] font-mono text-[#7c3aed]">
          {GEMINI_VOICES.length} multilingual timbres
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {GEMINI_VOICES.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPreviewing = previewingId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`group cursor-pointer p-4 rounded-2xl transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-violet-50/60 border-[#7c3aed]/40 ring-1 ring-[#7c3aed]/30 shadow-md shadow-violet-500/10'
                  : 'bg-white border-[#e7e9ef] hover:border-[#c9cfdb] hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-lg font-serif italic font-semibold text-[#111827] tracking-tight truncate">{voice.name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white flex-shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider border bg-[#f4f5f8] text-[#6b7382] border-[#e2e5ec] flex-shrink-0">
                    {voice.badge}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-wider mb-2 text-[#9aa2b1]">
                  <span>{voice.gender}</span>
                  <span>•</span>
                  <span>{voice.tone}</span>
                </div>

                <p className="text-[11px] leading-relaxed mb-4 text-[#6b7382]">
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
                className={`w-full mt-auto inline-flex items-center justify-center py-2 px-3 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white shadow-sm hover:opacity-95'
                    : 'bg-[#f4f5f8] hover:bg-[#eceef3] text-[#4b5262] border border-[#e2e5ec]'
                }`}
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Synthesizing…</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Preview</span>
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
