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
    // If text already has a prefix like "Say cheerfully:", replace or prepend
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
          'x-gemini-api-key': apiKey
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
    <div className="space-y-6 bg-[#080808] p-8 rounded-2xl border border-[#1a1a1a] shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif italic text-white tracking-tight">
            2. Composition Space & Direction
          </h3>
          <p className="text-[11px] text-[#666] uppercase font-mono tracking-wider mt-1">
            Add cues like <span className="text-[#9966ff] bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">"Say cheerfully:"</span> or <span className="text-[#ff6699] bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">"Whisper gently:"</span> to direct cadence.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomSample}
          className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold text-[#888] hover:text-white bg-[#111] border border-[#222] hover:border-[#333] px-3.5 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#9966ff]" />
          <span>Load Sample Prompt</span>
        </button>
      </div>

      {/* Style Presets */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-widest text-[#444] font-bold">
          Quick Emotional Direction Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.examplePrefix)}
              className="inline-flex items-center text-xs font-medium bg-[#111] text-[#888] border border-[#222] hover:border-[#444] hover:text-white hover:bg-[#161616] px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 mr-1.5 text-[#ff6699]" />
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
          placeholder="Enter your manuscript here to breathe life into the silence... Example: Say cheerfully with a warm smile: Welcome to AI VOICE STUDIO BY V!"
          className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 text-base leading-relaxed text-[#d1d1d1] focus:text-white focus:outline-none focus:border-[#333] transition-colors resize-y placeholder:text-[#333] font-sans"
        />

        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <span className="text-[10px] font-mono text-[#666] bg-[#111] px-2.5 py-1 rounded-md border border-[#222]">
            {text.length} chars
          </span>
        </div>
      </div>

      {/* Native Sinhala Pronunciation Indicator */}
      {(/[\u0D80-\u0DFF]/.test(text) || /sinhala|සිංහල/i.test(text) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(selectedVoiceId)) && (
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#00e6cc]/15 to-[#00e6cc]/5 border border-[#00e6cc]/40 rounded-xl text-xs text-[#00e6cc] shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#00e6cc] animate-ping" />
            <span className="font-mono font-bold uppercase tracking-wider text-[11px]">
              🇱🇰 Sri Lankan Sinhala Accent Engine Active
            </span>
          </div>
          <span className="text-[11px] text-[#bbb] font-sans hidden sm:inline">
            Auto-enforcing pure Sinhalese phonology & suppressing Tamil/foreign accents
          </span>
        </div>
      )}

      {/* AI Script Director Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl">
        <div className="flex items-center space-x-2.5 text-xs text-[#888]">
          <Wand2 className="w-4 h-4 text-[#9966ff] flex-shrink-0" />
          <span><strong className="font-serif italic text-white text-sm">AI Vocal Director:</strong> Let Gemini rewrite plain text into expressive acting copy.</span>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <select
            value={enhanceStyle}
            onChange={(e) => setEnhanceStyle(e.target.value)}
            className="text-xs font-mono bg-[#0a0a0a] border border-[#222] text-[#d1d1d1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#444] flex-1 sm:flex-initial"
          >
            <option value="expressive and engaging">Expressive & Engaging</option>
            <option value="dramatic cinematic movie trailer">Dramatic Movie Trailer</option>
            <option value="warm friendly audio documentary">Friendly Documentary</option>
            <option value="energetic podcast host">Energetic Podcast Intro</option>
            <option value="calm meditation whisper">Calm Meditation Guide</option>
          </select>

          <button
            type="button"
            onClick={handleEnhanceScript}
            disabled={isEnhancing || !text.trim()}
            className="inline-flex items-center justify-center bg-[#1a1a1a] hover:bg-white hover:text-black disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-[#333] transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                <span>Directing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Enhance Script</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Generation Failed</p>
            <p className="text-[#aaa]">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !text.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-[#eee] active:scale-95 disabled:opacity-50 text-black px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-white/5 transition-all duration-200 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
              <span>Synthesizing Audio ({selectedVoiceId})...</span>
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
