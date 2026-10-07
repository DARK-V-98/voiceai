import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import { ensureWavHeader, enhanceSinhalaPrompt, TTS_MODELS } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customKey = req.headers['x-gemini-api-key'] as string | undefined;
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

    const { mode = 'single', text, voiceName = 'Kore', speakers } = req.body ?? {};
    let lastError: any = null;

    if (mode === 'single') {
      if (!text || !text.trim()) return res.status(400).json({ error: 'Please provide valid text.' });
      const formattedText = enhanceSinhalaPrompt(text.trim());

      for (const modelId of TTS_MODELS) {
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
              base64, mimeType, voiceName, modelUsed: modelId,
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
        if (/[඀-෿]/.test(lineText) || /sinhala|සිංහල/i.test(lineText)) containsSinhala = true;
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

      for (const modelId of TTS_MODELS) {
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
              base64, mimeType, modelUsed: modelId,
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
}
