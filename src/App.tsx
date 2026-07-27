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
import { HelpCircle, KeyRound } from 'lucide-react';
import { loadHistoryFromDB, saveItemToDB, deleteItemFromDB, clearAllFromDB } from './utils/storage';

const API_KEY_STORAGE = 'aivs_gemini_api_key';

export default function App() {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>('Kore');
  const [singleText, setSingleText] = useState<string>(SAMPLE_TEXTS[0]);
  const [multiTurns, setMultiTurns] = useState<DialogueTurn[]>(DEFAULT_DIALOGUE_TURNS);
  const [historyItems, setHistoryItems] = useState<GeneratedAudioItem[]>([]);
  const [selectedAudioItem, setSelectedAudioItem] = useState<GeneratedAudioItem | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load persisted API key (per-browser convenience for clients using their own key)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE);
      if (saved) setApiKey(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist API key whenever it changes
  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      /* ignore */
    }
  }, [apiKey]);

  // Load history from IndexedDB on initial mount
  useEffect(() => {
    loadHistoryFromDB()
      .then((items) => {
        if (items && items.length > 0) {
          setHistoryItems(items);
          setSelectedAudioItem(items[0]);
        }
      })
      .catch((e) => console.error('Failed to load history from DB:', e));
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
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ mode: 'single', text: singleText.trim(), voiceName: selectedVoiceId }),
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
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ mode: 'multi', speakers: multiTurns }),
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
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ mode: 'single', text: voice.previewText, voiceName: voice.id }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Failed to preview voice ${voice.name}.`);
      }

      const newItem: GeneratedAudioItem = {
        id: `preview-${voice.id}-${Date.now()}`,
        title: `Preview: ${voice.name} (${voice.tone})`,
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
    <div className="min-h-screen bg-[#f4f5f8] text-[#1f2430] font-sans flex flex-col">
      <Header totalGenerated={historyItems.length} apiKey={apiKey} setApiKey={setApiKey} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* No-key gentle prompt */}
        {!apiKey && (
          <div className="flex items-start sm:items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 animate-fadeIn">
            <div className="w-9 h-9 rounded-lg bg-white border border-violet-100 text-[#7c3aed] flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-[#5b6473] leading-relaxed">
              <strong className="text-[#111827]">Add your Gemini API key to get started.</strong> Tap
              <span className="mx-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-violet-100 text-[#7c3aed] font-semibold text-[11px]"><KeyRound className="w-3 h-3" />Add API Key</span>
              at the top. It stays in your browser and is sent straight to Google.
            </p>
          </div>
        )}

        {/* Workspace Title & Mode Selector Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-5 sm:p-6 rounded-2xl border border-[#e7e9ef] shadow-sm">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-serif italic font-semibold text-[#111827] tracking-tight">
                {mode === 'single' ? 'Single Voiceover Studio' : 'Multi-Speaker Studio'}
              </h2>
            </div>
            <p className="text-xs text-[#8a92a6] mt-2 max-w-xl leading-relaxed">
              {mode === 'single'
                ? 'Synthesize natural, expressive speech with granular tone control and 24kHz uncompressed audio output.'
                : 'Build engaging dialogues, interviews, and podcasts. Gemini transitions timbres between speakers automatically.'}
            </p>
          </div>

          <ModeSelector
            mode={mode}
            onSelectMode={(newMode) => {
              setMode(newMode);
              setError(null);
            }}
          />
        </div>

        {/* Studio Editor Section */}
        {mode === 'single' ? (
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-7 rounded-2xl border border-[#e7e9ef] shadow-sm">
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
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#9aa2b1] px-1 font-bold mb-2">
              Active Audio Workspace
            </h3>
            <AudioPlayerCard item={selectedAudioItem} />
          </div>

          <div className="lg:col-span-5">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#9aa2b1] px-1 font-bold mb-2">
              Recordings Archive
            </h3>
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
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e7e9ef] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-[#7c3aed] flex items-center justify-center flex-shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-[#111827] uppercase tracking-wider">
                Pro Vocal Direction Tips
              </h4>
              <p className="text-xs font-sans text-[#8a92a6] mt-1 max-w-2xl leading-relaxed">
                Gemini TTS responds to natural language! Prefix lines with <span className="text-[#7c3aed] bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">"Say cheerfully:"</span>, <span className="text-[#db2777] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">"In a deep dramatic whisper:"</span>, or <span className="text-[#7c3aed] bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">"With confident emphasis:"</span> to shape emotional inflection.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-[#9aa2b1] bg-[#f4f5f8] px-3 py-1.5 rounded-full border border-[#e7e9ef] self-start md:self-auto flex-shrink-0">
            <span>Powered by Gemini TTS</span>
          </div>
        </div>
      </main>

      {/* Footer — eSystemLK branding */}
      <footer className="border-t border-[#e7e9ef] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8a92a6]">
            <span>© {new Date().getFullYear()} AI Voice Studio</span>
          </div>
          <a
            href="https://esystemlk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-[#5b6473] hover:text-[#7c3aed] transition-colors"
          >
            <span className="text-[#9aa2b1] group-hover:text-[#5b6473]">Designed &amp; developed by</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white text-[10px] font-bold flex items-center justify-center">e</span>
              <span className="font-serif italic text-sm text-[#111827] group-hover:text-[#7c3aed]">eSystemLK.com</span>
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
