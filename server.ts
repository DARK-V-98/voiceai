import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Helper to wrap raw PCM audio in a standard 44-byte WAV header
function ensureWavHeader(base64Data: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): { base64: string; mimeType: string } {
  // If base64 starts with "UklGR", it is already a RIFF/WAV header!
  if (base64Data.startsWith('UklGR')) {
    return { base64: base64Data, mimeType: 'audio/wav' };
  }

  const pcmBuffer = Buffer.from(base64Data, 'base64');
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  return {
    base64: wavBuffer.toString('base64'),
    mimeType: 'audio/wav',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  /**
   * Automatically applies phonetic conditioning to Sinhala text.
   * Prevents cross-lingual drift into Tamil/Indian accents by enforcing native Sri Lankan Sinhalese phonology.
   */
  function enhanceSinhalaPrompt(input: string): string {
    const containsSinhalaScript = /[\u0D80-\u0DFF]/.test(input);
    const mentionsSinhala = /sinhala|සිංහල/i.test(input);

    if (containsSinhalaScript || mentionsSinhala) {
      if (!input.includes('[System Phonetic Directive:')) {
        return `[System Phonetic Directive: You MUST speak in authentic, native Sri Lankan Sinhala (ශ්‍රී ලාංකික සිංහල) with accurate Sinhalese pronunciation, genuine vowel lengths, and natural Colombo Sri Lankan cadence. CRITICAL MANDATE: Under NO circumstances should you use a Tamil, South Indian, or foreign accent. Pronounce every Sinhala word clearly and naturally as a native Sinhalese speaker from Sri Lanka.]\n\n${input}`;
      }
    }
    return input;
  }

  // API Route: Generate Voice (TTS)
  app.post('/api/generate-voice', async (req, res) => {
    try {
      const customKey = req.headers['x-gemini-api-key'] as string;
      const apiKey = customKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({
          error: 'Gemini API Key is missing. Please provide your own key in the Studio settings at the top.',
        });
      }

      const requestAi = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const { mode = 'single', text, voiceName = 'Kore', speakers } = req.body;

      // Model Failover List
      const ttsModels = ['gemini-3.1-flash-tts-preview', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'];
      let lastError: any = null;

      if (mode === 'single') {
        if (!text || !text.trim()) return res.status(400).json({ error: 'Please provide valid text.' });
        const formattedText = enhanceSinhalaPrompt(text.trim());

        for (const modelId of ttsModels) {
          try {
            const response = await requestAi.models.generateContent({
              model: modelId,
              contents: [{ parts: [{ text: formattedText }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
              },
            });

            const rawAudio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (rawAudio) {
              const { base64, mimeType } = ensureWavHeader(rawAudio, 24000);
              return res.json({
                success: true,
                audioData: `data:${mimeType};base64,${base64}`,
                base64, mimeType, voiceName, modelUsed: modelId
              });
            }
          } catch (err) {
            console.warn(`Model ${modelId} failed:`, err);
            lastError = err;
          }
        }
      } else if (mode === 'multi') {
        if (!speakers || !Array.isArray(speakers)) return res.status(400).json({ error: 'Invalid speakers data.' });

        const uniqueSpeakersMap = new Map<string, string>();
        const dialogueLines: string[] = [];
        let containsSinhala = false;

        for (const turn of speakers) {
          const spk = (turn.speaker || 'Speaker1').trim();
          const vName = (turn.voiceName || 'Kore').trim();
          if (!uniqueSpeakersMap.has(spk)) uniqueSpeakersMap.set(spk, vName);
          const lineText = turn.text.trim();
          if (/[\u0D80-\u0DFF]/.test(lineText) || /sinhala|සිංහල/i.test(lineText)) containsSinhala = true;
          dialogueLines.push(`${spk}: ${lineText}`);
        }

        const speakerVoiceConfigs = Array.from(uniqueSpeakersMap.entries()).slice(0, 2).map(([spk, v]) => ({
          speaker: spk,
          voiceConfig: { prebuiltVoiceConfig: { voiceName: v } },
        }));

        let prompt = `TTS the following conversation between ${speakerVoiceConfigs.map((s) => s.speaker).join(' and ')}:\n\n${dialogueLines.join('\n')}`;
        if (containsSinhala) {
          prompt = `[System Phonetic Directive: All speakers MUST speak in authentic, native Sri Lankan Sinhala (ශ්‍රී ලාංකික සිංහල) with accurate Sinhalese pronunciation, genuine vowel lengths, and natural Colombo Sri Lankan cadence. CRITICAL MANDATE: Under NO circumstances should you use a Tamil, South Indian, or foreign accent. Pronounce every Sinhala word clearly and naturally as native Sinhalese speakers from Sri Lanka.]\n\n${prompt}`;
        }

        for (const modelId of ttsModels) {
          try {
            const response = await requestAi.models.generateContent({
              model: modelId,
              contents: [{ parts: [{ text: prompt }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { multiSpeakerVoiceConfig: { speakerVoiceConfigs } },
              },
            });

            const rawAudio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (rawAudio) {
              const { base64, mimeType } = ensureWavHeader(rawAudio, 24000);
              return res.json({
                success: true,
                audioData: `data:${mimeType};base64,${base64}`,
                base64, mimeType, modelUsed: modelId
              });
            }
          } catch (err) {
            console.warn(`Multi-Speaker Model ${modelId} failed:`, err);
            lastError = err;
          }
        }
      }

      throw lastError || new Error('All generation models failed.');
    } catch (err: any) {
      console.error('Error in /api/generate-voice:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  });

  // API Route: Enhance Script / Vocal Director
  app.post('/api/enhance-script', async (req, res) => {
    try {
      const customKey = req.headers['x-gemini-api-key'] as string;
      const apiKey = customKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: 'Gemini API Key is missing.' });
      }

      const requestAi = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const { text, style = 'expressive', mode = 'single' } = req.body;
      if (!text || !text.trim()) return res.status(400).json({ error: 'Please provide text.' });

      const textModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let lastError: any = null;

      for (const modelId of textModels) {
        try {
          if (mode === 'single') {
            const systemPrompt = `You are an expert voiceover director and scriptwriter.
Rewrite/enhance the script for AI voice delivery. Tailor for style: "${style}".
If Sinhala, ensure native Sri Lankan phrasing and prefix with: "Speak in authentic native Sri Lankan Sinhala without any Tamil or Indian accent:".
Return ONLY the enhanced text.`;

            const response = await requestAi.models.generateContent({
              model: modelId,
              contents: text.trim(),
              config: { systemInstruction: systemPrompt, temperature: 0.7 },
            });
            return res.json({ enhancedText: response.text?.trim() || text, modelUsed: modelId });
          } else {
            const systemPrompt = `Create a 2-speaker dialogue JSON tailored for style: "${style}".
Use authentic Sri Lankan Sinhala if applicable.
Return JSON array of items with "speaker" and "text".`;

            const response = await requestAi.models.generateContent({
              model: modelId,
              contents: text.trim(),
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      speaker: { type: 'STRING' },
                      text: { type: 'STRING' },
                    },
                    required: ['speaker', 'text'],
                  },
                },
              },
            });
            return res.json({ turns: JSON.parse(response.text?.trim() || '[]'), modelUsed: modelId });
          }
        } catch (err) {
          console.warn(`Text model ${modelId} failed:`, err);
          lastError = err;
        }
      }

      throw lastError || new Error('All text enhancement models failed.');
    } catch (err: any) {
      console.error('Error in /api/enhance-script:', err);
      return res.status(500).json({ error: err.message || 'Failed to enhance script.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
