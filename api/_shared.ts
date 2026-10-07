// Shared helpers used by the Vercel serverless functions in this folder.

// Wrap raw PCM audio in a standard 44-byte WAV header (no-op if already a WAV/RIFF payload).
export function ensureWavHeader(base64Data: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): { base64: string; mimeType: string } {
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
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
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

export function enhanceSinhalaPrompt(input: string): string {
  const containsSinhalaScript = /[඀-෿]/.test(input);
  const mentionsSinhala = /sinhala|සිංහල/i.test(input);

  if (containsSinhalaScript || mentionsSinhala) {
    if (!input.includes('[System Phonetic Directive:')) {
      return `[System Phonetic Directive: You MUST speak in authentic, native Sri Lankan Sinhala (ශ්‍රී ලාංකික සිංහල) with accurate Sinhalese pronunciation, genuine vowel lengths, and natural Colombo Sri Lankan cadence. CRITICAL MANDATE: Under NO circumstances should you use a Tamil, South Indian, or foreign accent. Pronounce every Sinhala word clearly and naturally as a native Sinhalese speaker from Sri Lanka.]\n\n${input}`;
    }
  }
  return input;
}

export const TTS_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
export const TEXT_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro'];
