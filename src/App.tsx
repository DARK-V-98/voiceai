/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { SingleVoiceEditor } from './components/SingleVoiceEditor';
import { MultiSpeakerEditor } from './components/MultiSpeakerEditor';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { HistoryList } from './components/HistoryList';
import { VoiceId, VoiceModel, DialogueTurn, GeneratedAudioItem } from './types';
import { GEMINI_VOICES, DEFAULT_DIALOGUE_TURNS, SAMPLE_TEXTS } from './data';
import { Volume2, Sparkles, Mic, Users, HelpCircle } from 'lucide-react';
import { loadHistoryFromDB, saveItemToDB, deleteItemFromDB, clearAllFromDB } from './utils/storage';

export default function App() {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>('Kore');
  const [singleText, setSingleText] = useState<string>(SAMPLE_TEXTS[0]);
  const [multiTurns, setMultiTurns] = useState<DialogueTurn[]>(DEFAULT_DIALOGUE_TURNS);
  const [historyItems, setHistoryItems] = useState<GeneratedAudioItem[]>([]);
  const [selectedAudioItem, setSelectedAudioItem] = useState<GeneratedAudioItem | null>(null);
  const [apiKey, setApiKey] = useState<string>(''); // Session-only API Key

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load history from IndexedDB on initial mount
  useEffect(() => {
    loadHistoryFromDB().then((items) => {
      if (items && items.length > 0) {
        setHistoryItems(items);
        setSelectedAudioItem(items[0]);
      }
    }).catch((e) => {
      console.error('Failed to load history from DB:', e);
    });
  }, []);

  const addItemToHistory = (newItem: GeneratedAudioItem) => {
    setHistoryItems((prev) => [newItem, ...prev]);
    setSelectedAudioItem(newItem);
    saveItemToDB(newItem);
  };

  const handleGenerateSingleVoice = async () => {
    if (!singleText.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey 
        },
        body: JSON.stringify({
          mode: 'single',
          text: singleText.trim(),
          voiceName: selectedVoiceId,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate voice.');
      }

      const voiceInfo = GEMINI_VOICES.find((v) => v.id === selectedVoiceId);
      const shortTitle = `${voiceInfo?.name || selectedVoiceId}: "${singleText.slice(0, 24)}${singleText.length > 24 ? '...' : ''}"`;

      const newItem: GeneratedAudioItem = {
        id: `audio-${Date.now()}`,
        title: shortTitle,
        timestamp: Date.now(),
        audioData: data.audioData,
        mode: 'single',
        voiceName: selectedVoiceId,
        text: singleText.trim(),
      };

      addItemToHistory(newItem);
    } catch (err: any) {
      console.error('Voice generation error:', err);
      setError(err.message || 'An error occurred while calling the Gemini TTS service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMultiDialogue = async () => {
    if (isGenerating || multiTurns.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey 
        },
        body: JSON.stringify({
          mode: 'multi',
          speakers: multiTurns,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate dialogue audio.');
      }

      const spk1 = multiTurns.find((t) => t.speaker === 'Speaker1')?.voiceName || 'Puck';
      const spk2 = multiTurns.find((t) => t.speaker === 'Speaker2')?.voiceName || 'Kore';
      const shortTitle = `Dialogue (${spk1} & ${spk2}): ${multiTurns.length} turns`;

      const newItem: GeneratedAudioItem = {
        id: `audio-${Date.now()}`,
        title: shortTitle,
        timestamp: Date.now(),
        audioData: data.audioData,
        mode: 'multi',
        speakers: [
          { speaker: 'Speaker 1', voiceName: spk1 },
          { speaker: 'Speaker 2', voiceName: spk2 },
        ],
        text: data.dialogueText || multiTurns.map((t) => `${t.speaker}: ${t.text}`).join('\n'),
      };

      addItemToHistory(newItem);
    } catch (err: any) {
      console.error('Multi-speaker generation error:', err);
      setError(err.message || 'An error occurred during multi-speaker dialogue synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewVoice = async (voice: VoiceModel) => {
    if (previewingId || isGenerating) return;
    setPreviewingId(voice.id);
    setError(null);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey 
        },
        body: JSON.stringify({
          mode: 'single',
          text: voice.previewText,
          voiceName: voice.id,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Failed to preview voice ${voice.name}.`);
      }

      const newItem: GeneratedAudioItem = {
        id: `preview-${voice.id}-${Date.now()}`,
        title: `Preview Voice: ${voice.name} (${voice.tone})`,
        timestamp: Date.now(),
        audioData: data.audioData,
        mode: 'single',
        voiceName: voice.id,
        text: voice.previewText,
      };

      addItemToHistory(newItem);
      setSelectedVoiceId(voice.id);
    } catch (err: any) {
      console.error('Preview voice error:', err);
      setError(err.message || `Failed to preview voice ${voice.name}.`);
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = historyItems.filter((item) => item.id !== id);
    setHistoryItems(updated);
    if (selectedAudioItem?.id === id) {
      setSelectedAudioItem(updated[0] || null);
    }
    deleteItemFromDB(id);
  };

  const handleClearAll = () => {
    setHistoryItems([]);
    setSelectedAudioItem(null);
    clearAllFromDB();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#d1d1d1] font-sans selection:bg-[#9966ff] selection:text-white pb-16">
      <Header totalGenerated={historyItems.length} apiKey={apiKey} setApiKey={setApiKey} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Workspace Title & Mode Selector Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#080808] p-8 rounded-2xl border border-[#1a1a1a] shadow-xl">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9966ff] animate-pulse" />
              <h2 className="text-2xl font-serif italic text-white tracking-tight">
                {mode === 'single' ? 'Single Voiceover Studio' : 'Multi-Speaker Podcast Studio'}
              </h2>
            </div>
            <p className="text-xs font-mono text-[#888] mt-2 max-w-xl leading-relaxed">
              {mode === 'single'
                ? 'Synthesize natural, highly expressive speech with granular tone control, emotional direction, and 24kHz uncompressed audio output.'
                : 'Build engaging dialogues, interviews, and podcasts. Gemini automatically transitions timbres and cadence between speakers.'}
            </p>
          </div>

          <ModeSelector mode={mode} onSelectMode={(newMode) => {
            setMode(newMode);
            setError(null);
          }} />
        </div>

        {/* Studio Editor Section */}
        {mode === 'single' ? (
          <div className="space-y-6">
            <div className="bg-[#080808] p-8 rounded-2xl border border-[#1a1a1a] shadow-xl">
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={setSelectedVoiceId}
                onPreviewVoice={handlePreviewVoice}
                previewingId={previewingId}
              />
            </div>

            <SingleVoiceEditor
              text={singleText}
              onChangeText={setSingleText}
              selectedVoiceId={selectedVoiceId}
              onGenerate={handleGenerateSingleVoice}
              isGenerating={isGenerating}
              error={error}
              apiKey={apiKey}
            />
          </div>
        ) : (
          <MultiSpeakerEditor
            turns={multiTurns}
            onChangeTurns={setMultiTurns}
            onGenerate={handleGenerateMultiDialogue}
            isGenerating={isGenerating}
            error={error}
            apiKey={apiKey}
          />
        )}

        {/* Audio Player & Session History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <div className="space-y-2 mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#666] px-1 font-bold">
                Active Audio Workspace
              </h3>
            </div>
            <AudioPlayerCard item={selectedAudioItem} />
          </div>

          <div className="lg:col-span-5">
            <div className="space-y-2 mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#666] px-1 font-bold">
                Recordings Archive
              </h3>
            </div>
            <HistoryList
              items={historyItems}
              selectedItem={selectedAudioItem}
              onSelectItem={setSelectedAudioItem}
              onDeleteItem={handleDeleteItem}
              onClearAll={handleClearAll}
            />
          </div>
        </div>

        {/* Helpful Tips Card */}
        <div className="bg-[#080808] rounded-2xl p-6 border border-[#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#111] border border-[#222] text-[#9966ff] flex items-center justify-center flex-shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Pro Vocal Direction Tips
              </h4>
              <p className="text-xs font-sans text-[#888] mt-1 max-w-2xl leading-relaxed">
                Gemini TTS responds directly to natural language phrasing! Prefix lines with <span className="text-[#9966ff] bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">"Say cheerfully:"</span>, <span className="text-[#ff6699] bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">"In a deep dramatic whisper:"</span>, or <span className="text-[#9966ff] bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">"With confident emphasis:"</span> to instantly shape emotional inflection and cadence.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-[#666] bg-[#111] px-3 py-1.5 rounded-full border border-[#222] self-end md:self-auto flex-shrink-0">
            <span>Powered by Gemini 3.1 Flash TTS</span>
          </div>
        </div>
      </main>
    </div>
  );
}
