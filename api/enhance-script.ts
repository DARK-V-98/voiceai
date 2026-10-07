import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { TEXT_MODELS } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customKey = req.headers['x-gemini-api-key'] as string | undefined;
    const apiKey = customKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: 'Gemini API Key is missing.' });
    }

    const requestAi = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const { text, style = 'expressive', mode = 'single' } = req.body ?? {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Please provide text.' });

    let lastError: any = null;

    for (const modelId of TEXT_MODELS) {
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
}
