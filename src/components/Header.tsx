import React, { useState } from 'react';
import { AudioLines, Sparkles, KeyRound, Check, X, ExternalLink, ShieldCheck, ChevronDown } from 'lucide-react';

interface HeaderProps {
  totalGenerated: number;
  apiKey: string;
  setApiKey: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ totalGenerated, apiKey, setApiKey }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const hasKey = apiKey.trim().length > 0;

  return (
    <header className="w-full border-b border-[#e7e9ef] bg-white/85 backdrop-blur-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
            <AudioLines className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-serif italic font-bold tracking-tight text-[#111827] truncate">
                AI Voice Studio
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-mono tracking-wider bg-violet-50 text-[#7c3aed] border border-violet-100">
                Gemini TTS
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-[#8a92a6] font-medium truncate">
              Expressive text-to-speech &amp; multi-speaker synthesis
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="hidden md:flex items-center space-x-1.5 text-xs font-mono text-[#5b6473] bg-[#f4f5f8] px-3 py-1.5 rounded-lg border border-[#e7e9ef]">
            <Sparkles className="w-3.5 h-3.5 text-[#db2777]" />
            <span>{totalGenerated} {totalGenerated === 1 ? 'Clip' : 'Clips'}</span>
          </div>

          {/* API key button — always visible, works on mobile */}
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
              hasKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gradient-to-tr from-[#7c3aed] to-[#db2777] text-white border-transparent shadow-md shadow-violet-500/20 hover:opacity-95'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasKey ? 'Key Set' : 'Add API Key'}</span>
            <span className="sm:hidden">{hasKey ? 'Key' : 'Key'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible API key panel (mobile + desktop) */}
      {panelOpen && (
        <div className="border-t border-[#e7e9ef] bg-white/95 backdrop-blur-lg animate-slideDown">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
                <span>Your Gemini API Key</span>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg text-[#8a92a6] hover:text-[#111827] hover:bg-[#f4f5f8] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1 flex items-center bg-[#f8f9fb] border border-[#e2e5ec] rounded-xl px-3.5 py-2.5 focus-within:border-[#7c3aed] focus-within:bg-white transition-all">
                <KeyRound className={`w-4 h-4 mr-2.5 flex-shrink-0 ${hasKey ? 'text-emerald-500' : 'text-[#9aa2b1]'}`} />
                <input
                  type="password"
                  placeholder="Paste your Gemini API key here…"
                  className="bg-transparent border-none text-sm font-mono text-[#1f2430] placeholder-[#aab0bd] focus:outline-none w-full"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {hasKey && (
                  <button
                    onClick={() => setApiKey('')}
                    className="ml-2 text-[11px] text-[#db2777] hover:underline uppercase font-bold flex-shrink-0 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {hasKey && (
                <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <Check className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[#8a92a6]">
              <span className="leading-relaxed">
                🔒 Stored only in this browser (localStorage). It is sent directly to Google Gemini and never to our servers.
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#7c3aed] font-semibold hover:underline flex-shrink-0"
              >
                Get a free API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
