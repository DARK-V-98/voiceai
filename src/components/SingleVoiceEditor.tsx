import React, { useState } from 'react';
import { VoiceId } from '../types';
import { STYLE_PRESETS, SAMPLE_TEXTS } from '../data';
import { Sparkles, Wand2, Volume2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface SingleVoiceEditorProps {
  text: string;
  onChangeText: (val: string) => void;
  selectedVoiceId: VoiceId;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
  apiKey: string;
}

export const SingleVoiceEditor: React.FC<SingleVoiceEditorProps> = ({
  text,
  onChangeText,
  selectedVoiceId,
  onGenerate,
  isGenerating,
  error,
  apiKey,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStyle, setEnhanceStyle] = useState('expressive and engaging');

  const handleApplyPreset = (prefix: string) => {
    if (!text.trim()) {
      onChangeText(`${prefix}Hello! Welcome to AI Voice Studio.`);
    } else {
      onChangeText(`${prefix}${text}`);
    }
  };

  const handleRandomSample = () => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    onChangeText(randomText);
  };

  const handleEnhanceScript = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({ text, style: enhanceStyle, mode: 'single' }),
      });
      const data = await response.json();
      if (data.enhancedText) {
        onChangeText(data.enhancedText);
      }
    } catch (err) {
      console.error('Failed to enhance script:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-5 sm:p-7 rounded-2xl border border-[#e7e9ef] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-serif italic font-semibold text-[#111827] tracking-tight">
            2. Composition &amp; Direction
          </h3>
          <p className="text-[11px] text-[#8a92a6] mt-1 leading-relaxed">
            Add cues like <span className="text-[#7c3aed] bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 font-mono">"Say cheerfully:"</span> or <span className="text-[#db2777] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 font-mono">"Whisper gently:"</span> to direct cadence.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomSample}
          className="inline-flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-[#4b5262] hover:text-[#111827] bg-[#f4f5f8] border border-[#e2e5ec] hover:border-[#c9cfdb] px-3.5 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#7c3aed]" />
          <span>Load Sample</span>
        </button>
      </div>

      {/* Style Presets */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-widest text-[#9aa2b1] font-bold">
          Quick Emotional Direction:
        </span>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.examplePrefix)}
              className="inline-flex items-center text-xs font-medium bg-[#f4f5f8] text-[#4b5262] border border-[#e2e5ec] hover:border-[#7c3aed]/40 hover:text-[#111827] hover:bg-violet-50/50 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 mr-1.5 text-[#db2777]" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          rows={5}
          placeholder="Enter your manuscript here… Example: Say cheerfully with a warm smile: Welcome to AI Voice Studio!"
          className="w-full rounded-2xl border border-[#e2e5ec] bg-[#f8f9fb] p-4 sm:p-5 text-base leading-relaxed text-[#1f2430] focus:bg-white focus:outline-none focus:border-[#7c3aed] transition-colors resize-y placeholder:text-[#aab0bd] font-sans"
        />
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          <span className="text-[10px] font-mono text-[#8a92a6] bg-white px-2.5 py-1 rounded-md border border-[#e2e5ec]">
            {text.length} chars
          </span>
        </div>
      </div>

      {/* Native Sinhala Pronunciation Indicator */}
      {(/[඀-෿]/.test(text) || /sinhala|සිංහල/i.test(text) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(selectedVoiceId)) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700 animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            <span className="font-mono font-bold uppercase tracking-wider text-[11px]">
              🇱🇰 Sri Lankan Sinhala Accent Engine Active
            </span>
          </div>
          <span className="text-[11px] text-teal-600 font-sans hidden sm:inline">
            Enforcing pure Sinhalese phonology
          </span>
        </div>
      )}

      {/* AI Script Director Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-xl">
        <div className="flex items-center space-x-2.5 text-xs text-[#5b6473]">
          <Wand2 className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
          <span><strong className="font-serif italic text-[#111827] text-sm">AI Vocal Director:</strong> Let Gemini rewrite plain text into expressive copy.</span>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <select
            value={enhanceStyle}
            onChange={(e) => setEnhanceStyle(e.target.value)}
            className="text-xs font-mono bg-white border border-[#e2e5ec] text-[#1f2430] rounded-lg px-3 py-2 focus:outline-none focus:border-[#7c3aed] flex-1 sm:flex-initial min-w-0 cursor-pointer"
          >
            <option value="expressive and engaging">Expressive &amp; Engaging</option>
            <option value="dramatic cinematic movie trailer">Dramatic Movie Trailer</option>
            <option value="warm friendly audio documentary">Friendly Documentary</option>
            <option value="energetic podcast host">Energetic Podcast Intro</option>
            <option value="calm meditation whisper">Calm Meditation Guide</option>
          </select>

          <button
            type="button"
            onClick={handleEnhanceScript}
            disabled={isEnhancing || !text.trim()}
            className="inline-flex items-center justify-center bg-[#111827] hover:bg-black disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                <span>Directing…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Enhance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Generation Failed</p>
            <p className="text-rose-500">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-1 flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !text.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-tr from-[#7c3aed] to-[#db2777] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-500/25 transition-all duration-200 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
              <span>Synthesizing ({selectedVoiceId})…</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2.5" />
              <span>Synthesize Audio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
