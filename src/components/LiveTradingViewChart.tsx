import React, { useEffect, useRef, useState } from 'react';
import { Coordinates, ChartAnalysisResult } from '../types';
import {
  Activity,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Shield,
  Target,
  Sparkles,
  Undo2,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Clock,
  Sliders,
  Radio,
  BarChart3,
  ExternalLink,
  Zap,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  subscribeToLiveChartStream,
  LiveTickerInfo,
  getAssetBaseProfile,
} from '../services/liveChartService';

declare global {
  interface Window {
    TradingView?: any;
  }
}

interface LiveTradingViewChartProps {
  ticker: string;
  timeframe: string;
  analysis: ChartAnalysisResult | null;
  onUpdateCoordinates?: (newCoords: Coordinates) => void;
  onResetCoordinates?: () => void;
  isLoading?: boolean;
  onPriceTick?: (price: number) => void;
  currentLivePrice?: number | null;
}

// Convert asset ticker to TradingView official symbol format
export function mapTickerToTradingViewSymbol(ticker: string): string {
  const clean = ticker.toUpperCase().replace('/', '').trim();
  if (clean.includes('BTC')) return 'BINANCE:BTCUSDT';
  if (clean.includes('ETH')) return 'BINANCE:ETHUSDT';
  if (clean.includes('SOL')) return 'BINANCE:SOLUSDT';
  if (clean.includes('EUR')) return 'FX:EURUSD';
  if (clean.includes('NVDA')) return 'NASDAQ:NVDA';
  if (clean.includes('XAU') || clean.includes('GOLD')) return 'OANDA:XAUUSD';
  if (clean.includes('US30') || clean.includes('DJI')) return 'CAPITALCOM:US30';
  if (clean.includes('SPX') || clean.includes('SP500')) return 'CAPITALCOM:US500';
  if (clean.includes('GBP')) return 'FX:GBPUSD';
  if (clean.includes('TSLA')) return 'NASDAQ:TSLA';
  if (clean.includes('AAPL')) return 'NASDAQ:AAPL';
  return `BINANCE:${clean}USDT`;
}

// Convert app timeframes (1m, 5m, 15m, 1H, 4H, 1D, 1W) to TradingView intervals
export function mapTimeframeToTradingViewInterval(timeframe: string): string {
  const tf = timeframe.toLowerCase().trim();
  if (tf === '1m') return '1';
  if (tf === '3m') return '3';
  if (tf === '5m') return '5';
  if (tf === '15m') return '15';
  if (tf === '30m') return '30';
  if (tf === '1h' || tf === '60m') return '60';
  if (tf === '2h') return '120';
  if (tf === '4h' || tf === '240m') return '240';
  if (tf === '8h') return '480';
  if (tf === '12h') return '720';
  if (tf === '1d' || tf === 'd') return 'D';
  if (tf === '3d') return '3D';
  if (tf === '1w' || tf === 'w') return 'W';
  return '15';
}

export const LiveTradingViewChart = React.memo(function LiveTradingViewChart({
  ticker,
  timeframe,
  analysis,
  onUpdateCoordinates,
  onResetCoordinates,
  isLoading = false,
  onPriceTick,
  currentLivePrice,
}: LiveTradingViewChartProps) {
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const containerId = useRef(`tradingview_widget_${Math.random().toString(36).substring(2, 9)}`).current;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showCoordinateEditor, setShowCoordinateEditor] = useState(false);
  const [tvReady, setTvReady] = useState(false);

  // Live WebSocket Tick State
  const [liveTicker, setLiveTicker] = useState<LiveTickerInfo | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(currentLivePrice || null);

  const activeTicker = analysis?.ticker || ticker;
  const activeTimeframe = analysis?.timeframe || timeframe;
  const tvSymbol = mapTickerToTradingViewSymbol(activeTicker);
  const tvInterval = mapTimeframeToTradingViewInterval(activeTimeframe);
  const assetProfile = getAssetBaseProfile(activeTicker);

  // Format price with correct precision
  const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (assetProfile.precision >= 4) {
      return val.toFixed(assetProfile.precision);
    }
    return val.toLocaleString(undefined, {
      minimumFractionDigits: assetProfile.precision,
      maximumFractionDigits: assetProfile.precision,
    });
  };

  // Subscribe to live WebSocket / institutional tick stream
  useEffect(() => {
    const profile = getAssetBaseProfile(activeTicker);
    setLivePrice(profile.basePrice);

    const unsubscribe = subscribeToLiveChartStream(
      activeTicker,
      activeTimeframe,
      () => {},
      (tickerInfo) => {
        setLiveTicker(tickerInfo);
        setLivePrice(tickerInfo.price);
        if (onPriceTick) {
          onPriceTick(tickerInfo.price);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTicker, activeTimeframe, onPriceTick]);

  // Sync external price if provided
  useEffect(() => {
    if (currentLivePrice) {
      setLivePrice(currentLivePrice);
    }
  }, [currentLivePrice]);

  // Load official TradingView tv.js script dynamically
  useEffect(() => {
    let script = document.getElementById('tradingview-widget-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => {
        setTvReady(true);
      };
      document.head.appendChild(script);
    } else if (window.TradingView) {
      setTvReady(true);
    } else {
      script.addEventListener('load', () => setTvReady(true));
    }
  }, []);

  // Initialize or re-render the TradingView Advanced Technical Analysis Widget
  useEffect(() => {
    if (!tvReady || !window.TradingView) return;

    const widgetContainer = document.getElementById(containerId);
    if (!widgetContainer) return;
    widgetContainer.innerHTML = '';

    try {
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: tvInterval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1', // Candlestick style
        locale: 'en',
        toolbar_bg: '#07090e',
        enable_publishing: false,
        hide_side_toolbar: false, // FULL side drawing tools enabled (fib, trendlines, patterns)
        hide_top_toolbar: false, // FULL top header (indicators, candle styles, search)
        allow_symbol_change: true,
        save_image: true,
        container_id: containerId,
        studies: [
          'Volume@tv-basicstudies',
          'MASimple@tv-basicstudies',
          'RSI@tv-basicstudies',
        ],
        loading_screen: {
          backgroundColor: '#07090e',
          foregroundColor: '#06b6d4',
        },
        overrides: {
          'paneProperties.background': '#07090e',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': '#1e293b20',
          'paneProperties.horzGridProperties.color': '#1e293b20',
          'symbolWatermarkProperties.transparency': 92,
          'scalesProperties.textColor': '#94a3b8',
          'scalesProperties.lineColor': '#1e293b',
          'mainSeriesProperties.candleStyle.upColor': '#10b981',
          'mainSeriesProperties.candleStyle.downColor': '#f43f5e',
          'mainSeriesProperties.candleStyle.drawWick': true,
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderColor': '#10b981',
          'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.borderDownColor': '#f43f5e',
          'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.wickDownColor': '#f43f5e',
        },
      });
    } catch (e) {
      console.warn('TradingView initialization notice:', e);
    }
  }, [tvReady, tvSymbol, tvInterval, containerId]);

  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      containerWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const coords = analysis?.coordinates;
  const isLong = analysis?.bias === 'BULLISH';
  const isManuallyAdjusted = !!analysis?.original_coordinates;

  // Real-time Level Interaction Calculations
  const isInsideEntry = Boolean(
    coords &&
    livePrice &&
    livePrice >= Math.min(coords.entry_zone.low, coords.entry_zone.high) &&
    livePrice <= Math.max(coords.entry_zone.low, coords.entry_zone.high)
  );

  const isSlHit = Boolean(
    coords &&
    livePrice &&
    (isLong ? livePrice <= coords.stop_loss : livePrice >= coords.stop_loss)
  );

  const isTp1Smashed = Boolean(
    coords &&
    coords.take_profit_1 &&
    livePrice &&
    (isLong ? livePrice >= coords.take_profit_1 : livePrice <= coords.take_profit_1)
  );

  const isTp2Smashed = Boolean(
    coords &&
    coords.take_profit_2 &&
    livePrice &&
    (isLong ? livePrice >= coords.take_profit_2 : livePrice <= coords.take_profit_2)
  );

  const isTp3Smashed = Boolean(
    coords &&
    coords.take_profit_3 &&
    livePrice &&
    (isLong ? livePrice >= coords.take_profit_3 : livePrice <= coords.take_profit_3)
  );

  // Visual Overlay Calculations: Map prices relative to the bounding box of entry, SL, and TP targets
  const getNormalizedYPercent = (price: number): number => {
    if (!coords) return 50;
    const allPrices = [
      coords.entry_zone.high,
      coords.entry_zone.low,
      coords.stop_loss,
      coords.take_profit_1,
      coords.take_profit_2,
      coords.take_profit_3,
      livePrice || coords.entry_zone.high,
    ];
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const padding = (maxP - minP) * 0.25 || (maxP * 0.05) || 1;
    const lowBound = minP - padding;
    const highBound = maxP + padding;
    const range = highBound - lowBound || 1;

    // Invert because higher price is higher up (smaller top %)
    const percent = 100 - ((price - lowBound) / range) * 100;
    return Math.max(8, Math.min(92, percent));
  };

  // Distance calculations
  const entryMid = coords ? (coords.entry_zone.low + coords.entry_zone.high) / 2 : 0;
  const distanceToEntryPct = coords && livePrice && entryMid
    ? (((livePrice - entryMid) / entryMid) * 100).toFixed(2)
    : '0.00';
  const distanceToSlPct = coords && livePrice && coords.stop_loss
    ? (((livePrice - coords.stop_loss) / coords.stop_loss) * 100).toFixed(2)
    : '0.00';
  const distanceToTp1Pct = coords && livePrice && coords.take_profit_1
    ? (((coords.take_profit_1 - livePrice) / livePrice) * 100).toFixed(2)
    : '0.00';

  return (
    <div
      ref={containerWrapperRef}
      className={`bg-[#0b101b] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col shadow-2xl transition-all ${
        isFullscreen ? 'p-3 bg-[#07090e] h-screen' : 'h-[640px]'
      }`}
    >
      {/* 1. REAL-TIME TRADINGVIEW ADVANCED HEADER BAR */}
      <div className="bg-[#07090e] border-b border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Stream ID, Symbol, Timeframe, Active Setup, Live Price */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-extrabold text-white text-sm tracking-wide">
              {activeTicker}
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
              {activeTimeframe}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Live Price Tag */}
          {livePrice !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-white font-bold text-xs">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>${formatPrice(livePrice)}</span>
              {liveTicker && (
                <span
                  className={`text-[10px] font-bold ${
                    liveTicker.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {liveTicker.change24h >= 0 ? '▲' : '▼'} {liveTicker.change24h}%
                </span>
              )}
            </div>
          )}

          {analysis && (
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                isLong
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : analysis.bias === 'BEARISH'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>
                {analysis.bias} ({analysis.confidence_score}%)
              </span>
            </div>
          )}
        </div>

        {/* Right: Overlay Controls & Tools */}
        <div className="flex items-center gap-2">
          {/* Overlay Levels Toggle */}
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
              showOverlays
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Zeher AI Overlay Target HUD & Coordinate Lines"
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Overlay Lines</span>
          </button>

          {/* Quick Fine-Tuning Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowCoordinateEditor(!showCoordinateEditor)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
              showCoordinateEditor
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Open Quick Price Coordinate Adjuster"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calibrate</span>
          </button>

          {/* Reset to AI */}
          {isManuallyAdjusted && onResetCoordinates && (
            <button
              type="button"
              onClick={onResetCoordinates}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/30 rounded transition-colors"
              title="Reset trade coordinates back to raw AI vision analysis"
            >
              <Undo2 className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded transition-colors"
            title="Toggle Fullscreen Chart"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. ADVANCED TRADINGVIEW CANVAS WITH ZEHER AI HUD OVERLAY & GLOWING TARGET LINES */}
      <div className="relative flex-1 bg-[#07090e] w-full h-full overflow-hidden">
        {/* The Official TradingView Advanced Widget Container */}
        <div id={containerId} className="w-full h-full" />

        {/* 3. INTERACTIVE GLOWING TECHNICAL OVERLAY LINES DIRECTLY ON LIVE CANVAS */}
        {coords && showOverlays && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden pr-16 pl-14">
            {/* Live Current Price Horizontal Line */}
            {livePrice && (
              <div
                className="absolute left-14 right-16 border-t border-cyan-400/70 flex items-center justify-between pointer-events-auto transition-all shadow-[0_0_8px_rgba(6,182,212,0.4)] z-20"
                style={{ top: `${getNormalizedYPercent(livePrice)}%` }}
              >
                <span className="bg-cyan-950/95 border border-cyan-400 text-cyan-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  LIVE TICK: ${livePrice.toLocaleString()}
                </span>
                <span className="bg-cyan-900/90 text-cyan-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold -translate-y-1/2 mr-2">
                  To SL: {distanceToSlPct}% • To TP1: {distanceToTp1Pct}%
                </span>
              </div>
            )}

            {/* Take Profit 3 Line - Flashes radiant Green if Smashed */}
            {coords.take_profit_3 && (
              <div
                className={`absolute left-14 right-16 border-t-2 border-dashed flex items-center justify-between pointer-events-auto transition-all ${
                  isTp3Smashed
                    ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-pulse'
                    : 'border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                }`}
                style={{ top: `${getNormalizedYPercent(coords.take_profit_3)}%` }}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg transition-all ${
                    isTp3Smashed
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-200 font-extrabold animate-bounce'
                      : 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
                  }`}
                >
                  <Target className="w-2.5 h-2.5" />
                  {isTp3Smashed ? '✓ TARGET TP3 RUNNER SMASHED: ' : 'TP3 (Runner Target): '}
                  {coords.take_profit_3}
                </span>
                <span className="bg-emerald-900/90 text-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 mr-2">
                  +3.5R
                </span>
              </div>
            )}

            {/* Take Profit 2 Line - Flashes radiant Green if Smashed */}
            {coords.take_profit_2 && (
              <div
                className={`absolute left-14 right-16 border-t-2 flex items-center justify-between pointer-events-auto transition-all ${
                  isTp2Smashed
                    ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-pulse'
                    : 'border-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                }`}
                style={{ top: `${getNormalizedYPercent(coords.take_profit_2)}%` }}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg transition-all ${
                    isTp2Smashed
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-200 font-extrabold animate-bounce'
                      : 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
                  }`}
                >
                  <Target className="w-2.5 h-2.5" />
                  {isTp2Smashed ? '✓ TARGET TP2 SMASHED: ' : 'TP2 (Balanced): '}
                  {coords.take_profit_2}
                </span>
                <span className="bg-emerald-900/90 text-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 mr-2">
                  +2.5R
                </span>
              </div>
            )}

            {/* Take Profit 1 Line - Flashes radiant Green if Smashed */}
            {coords.take_profit_1 && (
              <div
                className={`absolute left-14 right-16 border-t-2 flex items-center justify-between pointer-events-auto transition-all ${
                  isTp1Smashed
                    ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-pulse'
                    : 'border-teal-400/80 shadow-[0_0_10px_rgba(45,212,191,0.4)]'
                }`}
                style={{ top: `${getNormalizedYPercent(coords.take_profit_1)}%` }}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg transition-all ${
                    isTp1Smashed
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-200 font-extrabold animate-bounce'
                      : 'bg-teal-950/90 border border-teal-400 text-teal-300'
                  }`}
                >
                  <Target className="w-2.5 h-2.5" />
                  {isTp1Smashed ? '✓ TARGET TP1 SMASHED (LOCK 50%): ' : 'TP1 (Primary Target): '}
                  {coords.take_profit_1}
                </span>
                <span className="bg-teal-900/90 text-teal-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 mr-2">
                  +1.5R
                </span>
              </div>
            )}

            {/* Entry High Line & Shaded Entry Zone */}
            <div
              className={`absolute left-14 right-16 border-t-2 flex items-center justify-between pointer-events-auto transition-all ${
                isInsideEntry
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse'
                  : 'border-blue-400/90 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
              }`}
              style={{ top: `${getNormalizedYPercent(coords.entry_zone.high)}%` }}
            >
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg ${
                  isInsideEntry
                    ? 'bg-cyan-500 text-slate-950 border border-cyan-200 font-extrabold'
                    : 'bg-blue-950/90 border border-blue-400 text-blue-300'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                {isInsideEntry ? '⚡ ENTRY HIGH (IN ZONE): ' : 'ENTRY HIGH: '}
                {coords.entry_zone.high}
              </span>
            </div>

            <div
              className={`absolute left-14 right-16 border-t-2 flex items-center justify-between pointer-events-auto transition-all ${
                isInsideEntry
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse'
                  : 'border-blue-400/90 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
              }`}
              style={{ top: `${getNormalizedYPercent(coords.entry_zone.low)}%` }}
            >
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg ${
                  isInsideEntry
                    ? 'bg-cyan-500 text-slate-950 border border-cyan-200 font-extrabold'
                    : 'bg-blue-950/90 border border-blue-400 text-blue-300'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                {isInsideEntry ? '⚡ ENTRY LOW (IN ZONE): ' : 'ENTRY LOW: '}
                {coords.entry_zone.low}
              </span>
            </div>

            {/* Invalidation Buffer Zone (Anti-Stop-Hunt Shaded Buffer Area) */}
            {analysis?.invalidation_buffer && analysis.invalidation_buffer.raw_swing_level && (
              (() => {
                const rawSwing = analysis.invalidation_buffer.raw_swing_level;
                const hardSl = coords.stop_loss;
                const y1 = getNormalizedYPercent(Math.max(rawSwing, hardSl));
                const y2 = getNormalizedYPercent(Math.min(rawSwing, hardSl));
                const topY = Math.min(y1, y2);
                const heightY = Math.max(Math.abs(y2 - y1), 1.2);

                return (
                  <div
                    className="absolute left-14 right-16 bg-rose-500/15 border-y border-dashed border-rose-500/40 pointer-events-auto transition-all"
                    style={{ top: `${topY}%`, height: `${heightY}%` }}
                    title={`Anti-Stop-Hunt ATR Buffer Zone: ${analysis.invalidation_buffer.anti_stop_hunt_note}`}
                  >
                    <span className="absolute right-2 top-0 text-[9px] font-mono font-bold text-rose-300 bg-rose-950/90 px-1.5 py-0.2 rounded border border-rose-600/40 -translate-y-1/2">
                      🛡️ Invalidation Buffer ({analysis.invalidation_buffer.buffer_amount || '+0.85% ATR'})
                    </span>
                  </div>
                );
              })()
            )}

            {/* Stop Loss (Hard Structural Invalidation) Line - Flashes radiant Crimson Red on breach */}
            {coords.stop_loss && (
              <div
                className={`absolute left-14 right-16 border-t-2 border-dashed flex items-center justify-between pointer-events-auto transition-all ${
                  isSlHit
                    ? 'border-rose-500 shadow-[0_0_26px_rgba(244,63,94,0.95)] animate-pulse bg-rose-950/30'
                    : 'border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)]'
                }`}
                style={{ top: `${getNormalizedYPercent(coords.stop_loss)}%` }}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 ml-2 flex items-center gap-1 shadow-lg transition-all ${
                    isSlHit
                      ? 'bg-rose-600 text-white border border-rose-200 font-extrabold animate-bounce'
                      : 'bg-rose-950/95 border border-rose-500 text-rose-300 animate-pulse'
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {isSlHit ? '⚠️ STOP LOSS BREACHED (SETUP INVALIDATED): ' : 'STRUCTURAL INVALIDATION (SL): '}
                  {coords.stop_loss}
                </span>
                <span className="bg-rose-900/90 text-rose-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold -translate-y-1/2 mr-2">
                  -1.0R RISK
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4. FLOATING ZEHER AI RISK PARAMETERS HUD OVERLAY */}
        {coords && showOverlays && (
          <div className="absolute top-3 left-14 z-20 pointer-events-none max-w-xs md:max-w-md">
            <div className="bg-[#07090e]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl font-mono text-xs pointer-events-auto border-l-4 border-l-cyan-400">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-white tracking-wide">
                    ZEHER AI SETUP
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {activeTimeframe}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  {analysis.identified_structures?.[0] || 'Order Block'}
                </div>
              </div>

              {/* Grid of Targets */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {/* Entry Zone */}
                <div
                  className={`border rounded p-1.5 transition-all ${
                    isInsideEntry
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-blue-950/50 border-blue-500/30'
                  }`}
                >
                  <div className="text-blue-300 text-[10px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Crosshair className="w-2.5 h-2.5 text-blue-400" />
                      ENTRY ZONE
                    </span>
                    {isInsideEntry && (
                      <span className="text-[9px] bg-cyan-500 text-slate-950 px-1 rounded font-extrabold animate-pulse">
                        IN ZONE
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-white mt-0.5">
                    {coords.entry_zone.low} - {coords.entry_zone.high}
                  </div>
                </div>

                {/* Invalidation SL */}
                <div
                  className={`border rounded p-1.5 transition-all ${
                    isSlHit
                      ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                      : 'bg-rose-950/50 border-rose-500/30'
                  }`}
                >
                  <div className="text-rose-300 text-[10px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-rose-400" />
                      INVALIDATION SL
                    </span>
                    {isSlHit && (
                      <span className="text-[9px] bg-rose-600 text-white px-1 rounded font-extrabold animate-pulse">
                        HIT
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-rose-400 mt-0.5">
                    {coords.stop_loss}
                  </div>
                </div>

                {/* Take Profit 1 */}
                <div
                  className={`border rounded p-1.5 transition-all ${
                    isTp1Smashed
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'bg-teal-950/50 border-teal-500/30'
                  }`}
                >
                  <div className="text-teal-300 text-[10px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Target className="w-2.5 h-2.5 text-teal-400" />
                      TP1 (1.5R)
                    </span>
                    {isTp1Smashed && (
                      <span className="text-[9px] bg-emerald-500 text-slate-950 px-1 rounded font-extrabold animate-pulse">
                        SMASHED
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-teal-300 mt-0.5">
                    {coords.take_profit_1}
                  </div>
                </div>

                {/* Take Profit 2 & 3 */}
                <div
                  className={`border rounded p-1.5 transition-all ${
                    isTp2Smashed || isTp3Smashed
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'bg-emerald-950/50 border-emerald-500/30'
                  }`}
                >
                  <div className="text-emerald-300 text-[10px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Target className="w-2.5 h-2.5 text-emerald-400" />
                      TP2 / TP3 (RUNNER)
                    </span>
                    {(isTp2Smashed || isTp3Smashed) && (
                      <span className="text-[9px] bg-emerald-500 text-slate-950 px-1 rounded font-extrabold animate-pulse">
                        REACHED
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-emerald-400 mt-0.5">
                    {coords.take_profit_2} / {coords.take_profit_3}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. QUICK COORDINATE FINE-TUNER DRAWER */}
        {coords && showCoordinateEditor && onUpdateCoordinates && (
          <div className="absolute top-3 right-3 z-30 bg-[#07090e]/95 backdrop-blur-md border border-indigo-500/40 rounded-xl p-3.5 shadow-2xl font-mono text-xs w-72 max-h-[90%] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fine-Tune Coordinates</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCoordinateEditor(false)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-blue-300 font-semibold block mb-1">
                  ENTRY HIGH
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.entry_zone.high}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      entry_zone: {
                        ...coords.entry_zone,
                        high: parseFloat(e.target.value) || coords.entry_zone.high,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-blue-500/40 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-blue-300 font-semibold block mb-1">
                  ENTRY LOW
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.entry_zone.low}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      entry_zone: {
                        ...coords.entry_zone,
                        low: parseFloat(e.target.value) || coords.entry_zone.low,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-blue-500/40 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-300 font-semibold block mb-1">
                  STOP LOSS (INVALIDATION)
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.stop_loss}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      stop_loss: parseFloat(e.target.value) || coords.stop_loss,
                    })
                  }
                  className="w-full bg-slate-950 border border-rose-500/40 rounded px-2 py-1 text-rose-300 font-mono text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-teal-300 font-semibold block mb-1">
                  TAKE PROFIT 1
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.take_profit_1}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      take_profit_1: parseFloat(e.target.value) || coords.take_profit_1,
                    })
                  }
                  className="w-full bg-slate-950 border border-teal-500/40 rounded px-2 py-1 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-300 font-semibold block mb-1">
                  TAKE PROFIT 2
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.take_profit_2}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      take_profit_2: parseFloat(e.target.value) || coords.take_profit_2,
                    })
                  }
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-300 font-semibold block mb-1">
                  TAKE PROFIT 3
                </label>
                <input
                  type="number"
                  step="any"
                  value={coords.take_profit_3}
                  onChange={(e) =>
                    onUpdateCoordinates({
                      ...coords,
                      take_profit_3: parseFloat(e.target.value) || coords.take_profit_3,
                    })
                  }
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#07090e]/85 backdrop-blur-sm flex flex-col items-center justify-center z-40">
            <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center mb-3">
              <Crosshair className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <p className="font-mono text-sm font-bold text-white tracking-wider uppercase">
              Extracting Spatial Coordinates
            </p>
            <p className="font-mono text-xs text-cyan-400 mt-1">
              Analyzing Order Flow • Calibrating Invalidation Bands • Connecting TradingView Engine...
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
