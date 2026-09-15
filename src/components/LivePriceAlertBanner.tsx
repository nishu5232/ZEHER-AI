import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  Target,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Crosshair,
  Radio,
} from 'lucide-react';
import { LivePriceAlert, ChartAnalysisResult } from '../types';
import { soundEngine } from '../services/soundAlertService';

interface LivePriceAlertBannerProps {
  alerts: LivePriceAlert[];
  currentPrice: number | null;
  analysis: ChartAnalysisResult | null;
  onClearAlerts: () => void;
  onDismissAlert: (id: string) => void;
}

export function LivePriceAlertBanner({
  alerts,
  currentPrice,
  analysis,
  onClearAlerts,
  onDismissAlert,
}: LivePriceAlertBannerProps) {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playOrderDispatchedChime();
    }
  };

  const activeAlert = alerts[0]; // Most recent alert

  if (!analysis) return null;

  const getAlertStyle = (type: string, severity: string) => {
    switch (type) {
      case 'STOP_LOSS':
        return {
          bg: 'bg-rose-950/90 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          textColor: 'text-rose-200',
          titleColor: 'text-rose-300',
          badge: 'bg-rose-900/90 border-rose-500 text-rose-300',
        };
      case 'TP1':
      case 'TP2':
      case 'TP3':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          icon: Target,
          iconColor: 'text-emerald-400',
          textColor: 'text-emerald-200',
          titleColor: 'text-emerald-300',
          badge: 'bg-emerald-900/90 border-emerald-500 text-emerald-300',
        };
      case 'ENTRY_ZONE':
      default:
        return {
          bg: 'bg-cyan-950/90 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
          icon: Crosshair,
          iconColor: 'text-cyan-400',
          textColor: 'text-cyan-200',
          titleColor: 'text-cyan-300',
          badge: 'bg-cyan-900/90 border-cyan-500 text-cyan-300',
        };
    }
  };

  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      {/* Active High-Priority Alert Banner if one is firing */}
      {activeAlert && (
        <div
          className={`border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all relative overflow-hidden animate-pulse ${
            getAlertStyle(activeAlert.type, activeAlert.severity).bg
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black/40 border border-white/10 flex-shrink-0">
              {React.createElement(getAlertStyle(activeAlert.type, activeAlert.severity).icon, {
                className: `w-5 h-5 ${getAlertStyle(activeAlert.type, activeAlert.severity).iconColor}`,
              })}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                    getAlertStyle(activeAlert.type, activeAlert.severity).badge
                  }`}
                >
                  {activeAlert.type === 'ENTRY_ZONE'
                    ? '⚡ ENTRY TRIGGER'
                    : activeAlert.type === 'STOP_LOSS'
                    ? '⚠️ INVALIDATION'
                    : '🎯 TARGET SMASHED'}
                </span>
                <span className="text-[11px] text-slate-400">{activeAlert.timestamp}</span>
              </div>
              <p
                className={`text-xs font-bold mt-1 ${
                  getAlertStyle(activeAlert.type, activeAlert.severity).textColor
                }`}
              >
                {activeAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onDismissAlert(activeAlert.id)}
              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/60 text-slate-400 hover:text-white transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Price Invalidation & Target Guardrail HUD Toolbar */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Live Ticker Tracking & State */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 text-[11px]">Real-Time Invalidation Monitor:</span>
            <strong className="text-white text-xs">{analysis.ticker}</strong>
          </div>

          {currentPrice && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-slate-400">Live Tick:</span>
              <span className="text-cyan-300 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span className="bg-blue-950/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50">
              Entry: {analysis.coordinates.entry_zone.low} - {analysis.coordinates.entry_zone.high}
            </span>
            <span className="bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/50">
              SL: {analysis.coordinates.stop_loss}
            </span>
            <span className="bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/50">
              TP1: {analysis.coordinates.take_profit_1}
            </span>
          </div>
        </div>

        {/* Right: Audio Tone Synthesizer Toggle & Alert History Drawer */}
        <div className="flex items-center gap-2">
          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
              !isMuted
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={isMuted ? 'Unmute Audio Tone Cues' : 'Mute Audio Tone Cues'}
          >
            {!isMuted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Audio Cues: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>Audio: MUTED</span>
              </>
            )}
          </button>

          {/* Alert History Counter */}
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              <BellRing className="w-3 h-3 text-amber-400" />
              <span>{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {alerts.length > 0 && (
            <button
              type="button"
              onClick={onClearAlerts}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expandable Alert History Log Drawer */}
      {isExpanded && alerts.length > 0 && (
        <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-bold">
            <span>REAL-TIME NOTIFICATION LOG</span>
            <span>{alerts.length} TRIGGERED</span>
          </div>

          {alerts.map((al) => {
            const style = getAlertStyle(al.type, al.severity);
            const Icon = style.icon;
            return (
              <div
                key={al.id}
                className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${style.badge}`}>
                        {al.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{al.timestamp}</span>
                      <span className="text-[10px] text-slate-400">${al.price.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{al.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDismissAlert(al.id)}
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
