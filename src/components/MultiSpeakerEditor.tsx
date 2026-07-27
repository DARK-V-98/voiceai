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

  // Derive speaker voice assignments
  const speaker1Voice = turns.find((t) => t.speaker === 'Speaker1')?.voiceName || 'Puck';
  const speaker2Voice = turns.find((t) => t.speaker === 'Speaker2')?.voiceName || 'Kore';

  const handleUpdateSpeakerVoice = (speaker: 'Speaker1' | 'Speaker2', newVoice: VoiceId) => {
    onChangeTurns(
      turns.map((turn) => {
        if (turn.speaker === speaker) {
          return { ...turn, voiceName: newVoice };
        }
        return turn;
      })
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
    onChangeTurns(
      turns.map((t) => {
        if (t.id === id) {
          return { ...t, text };
        }
        return t;
      })
    );
  };

  const handleUpdateTurnSpeaker = (id: string, speaker: 'Speaker1' | 'Speaker2') => {
    const voice = speaker === 'Speaker1' ? speaker1Voice : speaker2Voice;
    onChangeTurns(
      turns.map((t) => {
        if (t.id === id) {
          return { ...t, speaker, voiceName: voice };
        }
        return t;
      })
    );
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/enhance-script', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
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
    <div className="space-y-6 bg-[#080808] p-8 rounded-2xl border border-[#1a1a1a] shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif italic text-white tracking-tight">
            2. Multi-Speaker Dialogue Builder
          </h3>
          <p className="text-[11px] text-[#666] uppercase font-mono tracking-wider mt-1">
            Create multi-character conversations or podcasts. Gemini automatically switches timbres between turns!
          </p>
        </div>
      </div>

      {/* Speaker Voice Configuration Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#9966ff] to-[#ff6699] text-white font-mono font-bold text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-white">Speaker 1 Voice</span>
          </div>
          <select
            value={speaker1Voice}
            onChange={(e) => handleUpdateSpeakerVoice('Speaker1', e.target.value as VoiceId)}
            className="text-xs font-mono bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444]"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender} - {v.tone})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff6699] to-[#9966ff] text-white font-mono font-bold text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-white">Speaker 2 Voice</span>
          </div>
          <select
            value={speaker2Voice}
            onChange={(e) => handleUpdateSpeakerVoice('Speaker2', e.target.value as VoiceId)}
            className="text-xs font-mono bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444]"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender} - {v.tone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Dialogue Generator Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl">
        <div className="flex items-center space-x-2.5 text-xs text-[#888]">
          <Wand2 className="w-4 h-4 text-[#ff6699] flex-shrink-0" />
          <span><strong className="font-serif italic text-white text-sm">AI Dialogue Writer:</strong> Enter a topic or story premise to auto-generate a script.</span>
        </div>

        <div className="flex items-center space-x-2.5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Debate about artificial intelligence in sci-fi..."
            className="text-xs font-mono bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-3.5 py-2 focus:outline-none focus:border-[#444] flex-1 min-w-[200px]"
          />
          <button
            type="button"
            onClick={handleGenerateScript}
            disabled={isGeneratingScript || !topic.trim()}
            className="inline-flex items-center justify-center bg-[#1a1a1a] hover:bg-white hover:text-black disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-[#333] transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                <span>Writing...</span>
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
      {(turns.some(t => /[\u0D80-\u0DFF]/.test(t.text) || /sinhala|සිංහල/i.test(t.text)) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(speaker1Voice) || ['Aoede', 'Clio', 'Leda', 'Orpheus', 'Pegasus'].includes(speaker2Voice)) && (
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

      {/* Dialogue Turns List */}
      <div className="space-y-3.5">
        {turns.map((turn, index) => {
          const isSpk1 = turn.speaker === 'Speaker1';
          return (
            <div
              key={turn.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] transition-all"
            >
              <div className="flex flex-col items-center space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateTurnSpeaker(turn.id, isSpk1 ? 'Speaker2' : 'Speaker1')}
                  className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center text-white transition-all shadow-sm border border-[#333] cursor-pointer ${
                    isSpk1 ? 'bg-[#9966ff] hover:bg-white hover:text-black' : 'bg-[#ff6699] hover:bg-white hover:text-black'
                  }`}
                  title="Click to toggle speaker"
                >
                  {isSpk1 ? '1' : '2'}
                </button>
                <span className="text-[10px] font-mono text-[#666] uppercase">
                  {turn.voiceName}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isSpk1 ? 'text-[#9966ff]' : 'text-[#ff6699]'}`}>
                    {isSpk1 ? `Speaker 1 (${speaker1Voice})` : `Speaker 2 (${speaker2Voice})`}
                  </span>
                  <span className="text-[10px] font-mono text-[#666]">Turn #{index + 1}</span>
                </div>
                <textarea
                  value={turn.text}
                  onChange={(e) => handleUpdateTurnText(turn.id, e.target.value)}
                  rows={2}
                  placeholder={`What does ${turn.speaker} say? Example: With excited emphasis: That is incredible!`}
                  className="w-full text-sm bg-[#111] border border-[#222] rounded-lg p-3 text-[#d1d1d1] focus:text-white focus:outline-none focus:border-[#444] resize-y font-sans"
                />
              </div>

              {turns.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTurn(turn.id)}
                  className="p-2 text-[#666] hover:text-rose-400 rounded-lg hover:bg-[#111] transition-all self-center"
                  title="Remove turn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleAddTurn}
          className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold text-[#888] hover:text-white bg-[#111] hover:bg-[#161616] px-5 py-2.5 rounded-xl border border-[#222] transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5 text-[#9966ff]" />
          <span>Add Dialogue Turn</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Dialogue Synthesis Failed</p>
            <p className="text-[#aaa]">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || turns.every((t) => !t.text.trim())}
          className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-[#eee] active:scale-95 disabled:opacity-50 text-black px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-white/5 transition-all duration-200 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
              <span>Synthesizing Conversation...</span>
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
