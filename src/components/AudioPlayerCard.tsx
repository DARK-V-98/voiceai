import React, { useRef, useState, useEffect } from 'react';
import { GeneratedAudioItem } from '../types';
import { Play, Pause, Download, Copy, Check, Volume2, RotateCcw } from 'lucide-react';

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
      <div className="w-full bg-white rounded-2xl border border-dashed border-[#d5d9e0] p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f4f5f8] border border-[#e7e9ef] text-[#9aa2b1] flex items-center justify-center mb-3">
          <Volume2 className="w-7 h-7" />
        </div>
        <h4 className="text-lg font-serif italic font-semibold text-[#111827]">No Audio Selected</h4>
        <p className="text-xs text-[#8a92a6] max-w-sm mt-1 leading-relaxed">
          Generate an AI voiceover or multi-speaker dialogue above to preview and download your audio clip.
        </p>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Audio playback error:', err));
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

  const renderVisualizerBars = () => {
    const barCount = 28;
    return (
      <div className="flex items-center justify-between h-12 gap-1 my-3 px-3 overflow-hidden bg-[#f8f9fb] rounded-xl border border-[#e7e9ef]">
        {Array.from({ length: barCount }).map((_, i) => {
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
                  ? 'bg-gradient-to-t from-[#7c3aed] to-[#db2777]'
                  : 'bg-[#dfe3ea]'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#e7e9ef] relative overflow-hidden transition-all">
      <audio
        ref={audioRef}
        src={item.audioData}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#eef0f4]">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-100 to-pink-100 text-[#7c3aed] border border-violet-200 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base sm:text-lg font-serif italic font-semibold text-[#111827] tracking-tight truncate">{item.title}</h3>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-violet-50 text-[#7c3aed] border border-violet-100 flex-shrink-0">
                {item.mode === 'single' ? `Voice: ${item.voiceName}` : 'Multi-Speaker'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#9aa2b1] mt-0.5">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 24kHz WAV
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 md:flex-initial inline-flex items-center justify-center text-xs font-mono uppercase tracking-wider bg-[#f4f5f8] hover:bg-[#eceef3] text-[#4b5262] hover:text-[#111827] px-3.5 py-2 rounded-lg border border-[#e2e5ec] transition-all cursor-pointer"
            title="Copy script"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 md:flex-initial inline-flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-gradient-to-tr from-[#7c3aed] to-[#db2777] hover:opacity-95 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-violet-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Visualizer & Controls */}
      <div className="space-y-3">
        {renderVisualizerBars()}

        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#db2777] hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2 text-[#9aa2b1] hover:text-[#111827] transition-all rounded-lg hover:bg-[#f4f5f8]"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs font-mono text-[#9aa2b1] min-w-[36px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-[#e5e8ee] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-[#9aa2b1] min-w-[36px] text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Script Transcript */}
      <div className="mt-4 pt-4 border-t border-[#eef0f4]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#9aa2b1] font-bold">
            Script Transcript
          </span>
          <span className="text-[10px] font-mono text-[#9aa2b1]">
            {item.text.length} characters
          </span>
        </div>
        <div className="bg-[#f8f9fb] rounded-xl p-4 text-xs text-[#5b6473] font-sans max-h-32 overflow-y-auto leading-relaxed border border-[#e7e9ef] whitespace-pre-wrap">
          {item.text}
        </div>
      </div>
    </div>
  );
};
