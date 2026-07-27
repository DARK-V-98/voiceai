import React, { useRef, useState, useEffect } from 'react';
import { GeneratedAudioItem } from '../types';
import { Play, Pause, Download, Copy, Check, Volume2, RotateCcw, Sparkles } from 'lucide-react';

interface AudioPlayerCardProps {
  item: GeneratedAudioItem | null;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({ item }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [item]);

  if (!item) {
    return (
      <div className="w-full bg-[#080808] rounded-2xl border border-[#1a1a1a] p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-[#111] border border-[#222] text-[#666] flex items-center justify-center mb-3">
          <Volume2 className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-serif italic text-white">No Audio Selected</h4>
        <p className="text-xs text-[#666] max-w-sm mt-1">
          Select a voice actor and generate an AI voiceover or multi-speaker dialogue above to preview and download your audio clip.
        </p>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Audio playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.audioData;
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.download = `${cleanTitle || 'ai_voice'}_24khz.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Simulated visualizer bars based on playback time
  const renderVisualizerBars = () => {
    const barCount = 28;
    return (
      <div className="flex items-center justify-between h-12 gap-1 my-3 px-3 overflow-hidden bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
        {Array.from({ length: barCount }).map((_, i) => {
          // Dynamic height formula for wave effect
          const activePercent = duration > 0 ? (currentTime / duration) * barCount : 0;
          const isActive = i <= activePercent;
          const heightPercent = isPlaying
            ? Math.max(20, Math.sin(currentTime * 5 + i * 0.5) * 45 + 55)
            : isActive ? 40 : 15;

          return (
            <div
              key={i}
              style={{ height: `${heightPercent}%` }}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-t from-[#9966ff] to-[#ff6699] shadow-sm'
                  : 'bg-[#1a1a1a]'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#080808] text-white rounded-2xl p-6 shadow-xl border border-[#1a1a1a] relative overflow-hidden transition-all">
      <audio
        ref={audioRef}
        src={item.audioData}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#9966ff]/20 to-[#ff6699]/20 text-[#9966ff] border border-[#9966ff]/30 flex items-center justify-center shadow-inner flex-shrink-0">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-lg font-serif italic text-white tracking-tight">{item.title}</h3>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#111] text-[#9966ff] border border-[#222]">
                {item.mode === 'single' ? `Voice: ${item.voiceName}` : 'Multi-Speaker'}
              </span>
            </div>
            <p className="text-xs font-mono text-[#666] mt-0.5">
              Generated at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 24kHz Uncompressed WAV
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center text-xs font-mono uppercase tracking-wider bg-[#111] hover:bg-[#1a1a1a] text-[#888] hover:text-white px-3.5 py-2 rounded-lg border border-[#222] transition-all cursor-pointer"
            title="Copy script to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-[#9966ff]" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            <span>{copied ? 'Copied' : 'Copy Script'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center text-xs font-bold uppercase tracking-widest bg-white hover:bg-[#eee] text-black px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Download .WAV</span>
          </button>
        </div>
      </div>

      {/* Visualizer & Controls */}
      <div className="space-y-3">
        {renderVisualizerBars()}

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full border border-[#222] bg-[#111] hover:bg-white hover:text-black text-white flex items-center justify-center shadow-lg transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2 text-[#666] hover:text-white transition-all rounded-lg hover:bg-[#111]"
            title="Restart playback"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center space-x-3">
            <span className="text-xs font-mono text-[#666] min-w-[36px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#9966ff]"
            />
            <span className="text-xs font-mono text-[#666] min-w-[36px] text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Script Transcript Box */}
      <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#444] font-bold">
            Script Transcript
          </span>
          <span className="text-[10px] font-mono text-[#666]">
            {item.text.length} characters
          </span>
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-4 text-xs text-[#888] font-sans max-h-32 overflow-y-auto leading-relaxed border border-[#1a1a1a] whitespace-pre-wrap">
          {item.text}
        </div>
      </div>
    </div>
  );
};
