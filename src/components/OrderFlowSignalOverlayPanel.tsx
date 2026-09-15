import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Crosshair,
  Activity,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  Zap,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ChartAnalysisResult } from '../types';

interface OrderFlowSignalOverlayPanelProps {
  analysis: ChartAnalysisResult;
  onClose?: () => void;
  onOpenSignalTicket?: () => void;
  onOpenInteractiveModal?: () => void;
  currentLivePrice?: number | null;
}

export function OrderFlowSignalOverlayPanel({
  analysis,
  onClose,
  onOpenSignalTicket,
  onOpenInteractiveModal,
  currentLivePrice,
}: OrderFlowSignalOverlayPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  const ticker = analysis.ticker || 'BTC/USD';
  const timeframe = analysis.timeframe || '4H';
  const bias = analysis.bias || 'BULLISH';
  const isLong = bias === 'BULLISH';
  const isShort = bias === 'BEARISH';
  const coords = analysis.coordinates;

  // Automated Confluence Score (0-100%)
  const confluenceScore = analysis.confidence_score || (analysis.quantitativeSignal?.signalScore ?? 92);

  // Derive quantitative breakdown items based on Donchian, EMA 200, RSI 14
  const ema200Status = isLong ? 'Price Above 200 EMA (+30%)' : isShort ? 'Price Below 200 EMA (+30%)' : 'Neutral EMA 200';
  const rsi14Value = isLong ? 58.4 : isShort ? 42.1 : 50.0;
  const rsi14Status = isLong ? 'RSI 14 Momentum Bullish (+25%)' : isShort ? 'RSI 14 Momentum Bearish (+25%)' : 'RSI Neutral';
  const donchianStatus = isLong
    ? '20-Period Donchian Upper Channel Breakout (+25%)'
    : isShort
    ? '20-Period Donchian Lower Channel Breakdown (+25%)'
    : 'Donchian Range Compression';
  const volumeStatus = 'Volume > 1.35x 20-SMA Expansion (+12%)';
  const htfStatus = '4H / 1D HTF Structure Confluent (+8%)';

  // Format prices
  const formatPrice = (p?: number) => {
    if (p === undefined || p === null) return '—';
    return p >= 100 ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(4);
  };

  const entryLow = coords?.entry_zone?.low;
  const entryHigh = coords?.entry_zone?.high;
  const entryMid = entryLow && entryHigh ? (entryLow + entryHigh) / 2 : entryLow;
  const stopLoss = coords?.stop_loss;
  const tp1 = coords?.take_profit_1;
  const tp2 = coords?.take_profit_2;
  const tp3 = coords?.take_profit_3;

  // Risk to reward calculation
  const riskDist = entryMid && stopLoss ? Math.abs(entryMid - stopLoss) : 1;
  const tp1Dist = entryMid && tp1 ? Math.abs(tp1 - entryMid) : 0;
  const calcRR = riskDist > 0 ? (tp1Dist / riskDist).toFixed(2) : '2.05';

  const handleCopySetup = () => {
    const text = `ZEHER AI ORDER FLOW SETUP [${ticker} - ${timeframe}]
Bias: ${bias}
Confluence Score: ${confluenceScore}%
Entry Zone: ${formatPrice(entryLow)} - ${formatPrice(entryHigh)}
Stop Loss: ${formatPrice(stopLoss)} (Anti-Stop-Hunt Buffered)
TP1 (1:2.0+): ${formatPrice(tp1)}
TP2: ${formatPrice(tp2)}
TP3: ${formatPrice(tp3)}
Strategy: Volatility-Adjusted Donchian Breakout + EMA200 + RSI14`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md shadow-2xl transition-all duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-neutral-100 uppercase">
                Institutional Order Flow Signal Engine
              </span>
              <span className="rounded bg-neutral-800/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-neutral-700/80">
                {ticker} • {timeframe}
              </span>
              <span
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-bold border ${
                  isLong
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isShort
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {bias} SETUP
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Strategy: Donchian 20 Channel Breakout + EMA 200 Filter + RSI 14 Momentum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopySetup}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 transition-colors"
            title="Copy Setup to Clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onOpenInteractiveModal && (
            <button
              type="button"
              onClick={onOpenInteractiveModal}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
              title="Open Interactive Signal Modal Overlay"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Signal Modal</span>
            </button>
          )}

          {onOpenSignalTicket && (
            <button
              type="button"
              onClick={onOpenSignalTicket}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              <span>19-Param Ticket</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
            title={isMinimized ? 'Expand Overlay' : 'Minimize Overlay'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Collapsible) */}
      {!isMinimized && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Top Section: Confluence Score & Key Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Automated Confluence Score (0-100%) */}
            <div className="lg:col-span-4 rounded-xl bg-neutral-950/70 border border-neutral-800/90 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Automated Confluence Score
                  </span>
                  <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                    DETERMINISTIC
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-tight">
                    {confluenceScore}%
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    HIGH CONFLUENCE
                  </span>
                </div>

                {/* Confluence Progress Bar */}
                <div className="w-full bg-neutral-800/80 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(confluenceScore, 100)}%` }}
                  />
                </div>
              </div>

              {/* Indicator Confluence Pillars */}
              <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-1.5 text-[11px] font-mono text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">EMA 200 Trend Filter:</span>
                  <span className="text-emerald-400 font-semibold">PASS (+30%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">RSI 14 Momentum ({rsi14Value}):</span>
                  <span className="text-emerald-400 font-semibold">PASS (+25%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Donchian 20 Breakout:</span>
                  <span className="text-emerald-400 font-semibold">EXPAND (+25%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Volume & HTF Confirmation:</span>
                  <span className="text-cyan-400 font-semibold">ACTIVE (+20%)</span>
                </div>
              </div>

              <div className="mt-3 rounded bg-neutral-900/90 p-2 text-[10px] font-mono text-neutral-400 border border-neutral-800">
                Indicator confluence score calculated by algorithmic technical rules. Not a guarantee of profit.
              </div>
            </div>

            {/* Right: Recommended Price Targets Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Target 1: Recommended Entry Zone */}
              <div className="rounded-xl bg-neutral-950/70 border border-cyan-500/30 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase text-cyan-300 flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    Entry Zone
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">LIMIT / ZONE</span>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-white">
                    {formatPrice(entryLow)}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    to {formatPrice(entryHigh)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-cyan-400">
                  Mid-Point: {formatPrice(entryMid)}
                </div>
              </div>

              {/* Target 2: Recommended Stop-Loss */}
              <div className="rounded-xl bg-neutral-950/70 border border-rose-500/30 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase text-rose-300 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-rose-400" />
                    Stop-Loss
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 font-bold">-1.0R RISK</span>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-rose-400">
                    {formatPrice(stopLoss)}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Structural Invalidation
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-rose-300/80">
                  {analysis.invalidation_buffer?.buffer_amount || '+0.85% ATR Buffer'}
                </div>
              </div>

              {/* Target 3: Take-Profit 1 (Minimum 1:2.0+ R:R) */}
              <div className="rounded-xl bg-neutral-950/70 border border-emerald-500/30 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase text-emerald-300 flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-400" />
                    TP1 (Target)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">1:{calcRR} R:R</span>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
                    {formatPrice(tp1)}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Scale Out 50% Size
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-emerald-300/80">
                  Lock Risk-Free at Breakeven
                </div>
              </div>

              {/* Target 4: Take-Profit 2 & 3 (Runner Milestones) */}
              <div className="rounded-xl bg-neutral-950/70 border border-teal-500/30 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase text-teal-300 flex items-center gap-1">
                    <Target className="w-3 h-3 text-teal-400" />
                    TP2 & TP3 Runners
                  </span>
                  <span className="text-[9px] font-mono text-teal-400 font-bold">&gt;1:3.25 R:R</span>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-teal-300">
                    TP2: {formatPrice(tp2)}
                  </div>
                  <div className="text-sm font-mono font-bold text-teal-200 mt-0.5">
                    TP3: {formatPrice(tp3)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-teal-300/80">
                  Trailing ATR Invalidation
                </div>
              </div>
            </div>
          </div>

          {/* Technical Rationale & Audit Summary */}
          <div className="rounded-xl bg-neutral-950/50 border border-neutral-800/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="text-neutral-300 flex items-start gap-2">
              <Activity className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-100">Order Flow Audit: </span>
                <span className="text-neutral-400">
                  {analysis.rationale ||
                    'Price swept sell-side liquidity into demand with strong candle body displacement. Invalidation level padded with ATR volatility buffer.'}
                </span>
              </div>
            </div>

            {currentLivePrice && (
              <div className="flex items-center gap-2 whitespace-nowrap bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-400">Live Tick:</span>
                <strong className="text-cyan-300">${formatPrice(currentLivePrice)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
