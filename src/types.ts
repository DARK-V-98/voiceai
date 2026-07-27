export type VoiceId = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede' | 'Clio' | 'Leda' | 'Orpheus' | 'Pegasus';

export interface VoiceModel {
  id: VoiceId;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral' | 'Masculine' | 'Feminine';
  tone: string;
  description: string;
  badge: string;
  previewText: string;
  colorClass: string;
}

export interface DialogueTurn {
  id: string;
  speaker: 'Speaker1' | 'Speaker2';
  voiceName: VoiceId;
  text: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  timestamp: number;
  audioData: string; // Data URL (data:audio/wav;base64,...)
  mode: 'single' | 'multi';
  voiceName?: VoiceId;
  speakers?: { speaker: string; voiceName: string }[];
  text: string;
}

export interface StylePreset {
  id: string;
  label: string;
  description: string;
  examplePrefix: string;
}
