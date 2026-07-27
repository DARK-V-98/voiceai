import React, { useState } from 'react';
import { DialogueTurn, VoiceId } from '../types';
import { GEMINI_VOICES } from '../data';
import { Plus, Trash2, Volume2, Sparkles, Wand2, AlertCircle, Loader2 } from 'lucide-react';

interface MultiSpeakerEditorProps {
  turns: DialogueTurn[];
  onChangeTurns: (turns: DialogueTurn[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
  apiKey: string;
}

export const MultiSpeakerEditor: React.FC<MultiSpeakerEditorProps> = ({
  turns,
  onChangeTurns,
  onGenerate,
  isGenerating,
  error,
  apiKey,
}) => {
  const [topic, setTopic] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const speaker1Voice = turns.find((t) => t.speaker === 'Speaker1')?.voiceName || 'Puck';
  const speaker2Voice = turns.find((t) => t.speaker === 'Speaker2')?.voiceName || 'Kore';

  const handleUpdateSpeakerVoice = (speaker: 'Speaker1' | 'Speaker2', newVoice: VoiceId) => {
    onChangeTurns(
      turns.map((turn) => (turn.speaker === speaker ? { ...turn, voiceName: newVoice } : turn))
    );
  };

  const handleAddTurn = () => {
    const lastSpeaker = turns[turns.length - 1]?.speaker || 'Speaker2';
    const nextSpeaker = lastSpeaker === 'Speaker1' ? 'Speaker2' : 'Speaker1';
    const nextVoice = nextSpeaker === 'Speaker1' ? speaker1Voice : speaker2Voice;

    const newTurn: DialogueTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      speaker: nextSpeaker,
      voiceName: nextVoice,
      text: '',
    };
    onChangeTurns([...turns, newTurn]);
  };

  const handleRemoveTurn = (id: string) => {
    if (turns.length <= 1) return;
    onChangeTurns(turns.filter((t) => t.id !== id));
  };

  const handleUpdateTurnText = (id: string, text: string) => {
    onChangeTurns(turns.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const handleUpdateTurnSpeaker = (id: string, speaker: 'Speaker1' | 'Speaker2') => {
    const voice = speaker === 'Speaker1' ? speaker1Voice : speaker2Voice;
    onChangeTurns(turns.map((t) => (t.id === id ? { ...t, speaker, voiceName: voice } : t)));
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/enhance-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({ text: topic, style: 'engaging podcast dialogue', mode: 'multi' }),
      });
      const data = await response.json();
      if (data.turns && Array.isArray(data.turns)) {
        const newTurns: DialogueTurn[] = data.turns.map((item: any, idx: number) => {
          const spk: 'Speaker1' | 'Speaker2' = item.speaker === 'Speaker2' ? 'Speaker2' : 'Speaker1';
          return {
            id: `turn-${Date.now()}-${idx}`,
            speaker: spk,
            voiceName: spk === 'Speaker1' ? speaker1Voice : speaker2Voice,
            text: item.text || '',
          };
        });
        onChangeTurns(newTurns);
      }
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-5 sm:p-7 rounded-2xl border border-[#e7e9ef] shadow-sm">
      <div>
        <h3 className="text-lg sm:text-xl font-serif italic font-semibold text-[#111827] tracking-tight">
          2. Multi-Speaker Dialogue Builder
        </h3>
        <p className="text-[11px] text-[#8a92a6] mt-1 leading-relaxed">
          Create multi-character conversations or podcasts. Gemini automatically switches timbres between turns.
        </p>
      </div>

      {/* Speaker Voice Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#f8f9fb] rounded-xl border border-[#e7e9ef]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              1
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#4b5262]">Speaker 1</span>
          </div>
          <select
            value={speaker1Voice}
            onChange={(e) => handleUpdateSpeakerVoice('Speaker1', e.target.value as VoiceId)}
            className="text-xs font-mono bg-white border border-[#e2e5ec] rounded-lg px-2.5 py-2 text-[#1f2430] focus:outline-none focus:border-[#7c3aed] cursor-pointer min-w-0 flex-1 sm:flex-initial max-w-[180px]"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.tone})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#db2777] to-[#7c3aed] text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
              2
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#4b5262]">Speaker 2</span>
          </div>
          <select
            value={speaker2Voice}
            onChange={(e) => handleUpdateSpeakerVoice('Speaker2', e.target.value as VoiceId)}
            className="text-xs font-mono bg-white border border-[#e2e5ec] rounded-lg px-2.5 py-2 text-[#1f2430] focus:outline-none focus:border-[#db2777] cursor-pointer min-w-0 flex-1 sm:flex-initial max-w-[180px]"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.tone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Dialogue Generator */}
      <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-xl">
        <div className="flex items-center space-x-2.5 text-xs text-[#5b6473]">
          <Wand2 className="w-4 h-4 text-[#db2777] flex-shrink-0" />
          <span><strong className="font-serif italic text-[#111827] text-sm">AI Dialogue Writer:</strong> Enter a topic to auto-generate a script.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. A debate about AI in sci-fi movies…"
            className="text-sm bg-white border border-[#e2e5ec] text-[#1f2430] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#7c3aed] flex-1 placeholder:text-[#aab0bd]"
          />
          <button
            type="button"
            onClick={handleGenerateScript}
            disabled={isGeneratingScript || !topic.trim()}
            className="inline-flex items-center justify-center bg-[#111827] hover:bg-black disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                <span>Writing…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Auto-Write</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Native Sinhala Pronunciation Indicator */}
      {(turns.some((t) => /[඀-෿]/.test(t.text) || /sinhala|සිංහල/i.test(t.text)) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(speaker1Voice) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(speaker2Voice)) && (
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

      {/* Dialogue Turns */}
      <div className="space-y-3">
        {turns.map((turn, index) => {
          const isSpk1 = turn.speaker === 'Speaker1';
          return (
            <div
              key={turn.id}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-[#e7e9ef] bg-[#f8f9fb] transition-all"
            >
              <div className="flex flex-col items-center space-y-1.5 pt-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateTurnSpeaker(turn.id, isSpk1 ? 'Speaker2' : 'Speaker1')}
                  className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center text-white transition-all shadow-sm cursor-pointer ${
                    isSpk1 ? 'bg-[#7c3aed] hover:bg-[#6d28d9]' : 'bg-[#db2777] hover:bg-[#be185d]'
                  }`}
                  title="Toggle speaker"
                >
                  {isSpk1 ? '1' : '2'}
                </button>
                <span className="text-[9px] font-mono text-[#9aa2b1] uppercase">
                  {turn.voiceName}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider truncate ${isSpk1 ? 'text-[#7c3aed]' : 'text-[#db2777]'}`}>
                    {isSpk1 ? `Speaker 1 (${speaker1Voice})` : `Speaker 2 (${speaker2Voice})`}
                  </span>
                  <span className="text-[10px] font-mono text-[#9aa2b1] flex-shrink-0">#{index + 1}</span>
                </div>
                <textarea
                  value={turn.text}
                  onChange={(e) => handleUpdateTurnText(turn.id, e.target.value)}
                  rows={2}
                  placeholder={`What does Speaker ${isSpk1 ? '1' : '2'} say?`}
                  className="w-full text-sm bg-white border border-[#e2e5ec] rounded-lg p-3 text-[#1f2430] focus:outline-none focus:border-[#7c3aed] resize-y font-sans placeholder:text-[#aab0bd]"
                />
              </div>

              {turns.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTurn(turn.id)}
                  className="p-2 text-[#9aa2b1] hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all self-center flex-shrink-0"
                  title="Remove turn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddTurn}
          className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold text-[#4b5262] hover:text-[#111827] bg-[#f4f5f8] hover:bg-[#eceef3] px-5 py-2.5 rounded-xl border border-[#e2e5ec] transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5 text-[#7c3aed]" />
          <span>Add Turn</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Dialogue Synthesis Failed</p>
            <p className="text-rose-500">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-1 flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || turns.every((t) => !t.text.trim())}
          className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-tr from-[#7c3aed] to-[#db2777] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-500/25 transition-all duration-200 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
              <span>Synthesizing…</span>
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
