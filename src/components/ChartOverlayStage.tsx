import React, { useState, memo } from 'react';
import { ChartAnalysisResult, Coordinates } from '../types';
import { LiveTradingViewChart } from './LiveTradingViewChart';
import {
  Activity,
  Image as ImageIcon,
  Crosshair,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ChartOverlayStageProps {
  imageSrc: string | null;
  analysis: ChartAnalysisResult | null;
  isLoading: boolean;
  onUpdateCoordinates?: (newCoords: Coordinates) => void;
  onResetCoordinates?: () => void;
  selectedTicker?: string;
  selectedTimeframe?: string;
  onPriceTick?: (price: number) => void;
  currentLivePrice?: number | null;
}

export const ChartOverlayStage = memo(function ChartOverlayStage({
  imageSrc,
  analysis,
  isLoading,
  onUpdateCoordinates,
  onResetCoordinates,
  selectedTicker = 'BTC/USD',
  selectedTimeframe = '15m',
  onPriceTick,
  currentLivePrice,
}: ChartOverlayStageProps) {
  const [chartMode, setChartMode] = useState<'live' | 'image'>('live');

  // Derive active ticker and timeframe from analysis or selection
  const activeTicker = analysis?.ticker && analysis.ticker !== 'UNKNOWN' ? analysis.ticker : selectedTicker;
  const activeTimeframe = analysis?.timeframe && analysis.timeframe !== 'UNKNOWN' ? analysis.timeframe : selectedTimeframe;

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Switcher Bar */}
      <div className="flex items-center justify-between bg-[#0b101b] border border-slate-800/90 px-3 py-1.5 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Chart Feed Engine:</span>
          </div>
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setChartMode('live')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all duration-200 ease-in-out ${
                chartMode === 'live'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live TradingView Engine</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('image')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all duration-200 ease-in-out ${
                chartMode === 'image'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3 text-indigo-400" />
              <span>Uploaded Screenshot View</span>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-500">Streaming:</span>
          <strong className="text-white">{activeTicker}</strong>
          <span className="text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30 font-bold">
            {activeTimeframe}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {chartMode === 'live' ? (
        <LiveTradingViewChart
          ticker={activeTicker}
          timeframe={activeTimeframe}
          analysis={analysis}
          onUpdateCoordinates={onUpdateCoordinates}
          onResetCoordinates={onResetCoordinates}
          isLoading={isLoading}
          onPriceTick={onPriceTick}
          currentLivePrice={currentLivePrice}
        />
      ) : (
        <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl overflow-hidden p-4 min-h-[500px] flex items-center justify-center relative transition-all duration-200 ease-in-out">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Uploaded Chart Screenshot"
              className="max-h-[520px] w-auto object-contain rounded-lg border border-slate-800 shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 text-center">
              <Crosshair className="w-12 h-12 text-slate-700 mb-3" />
              <p className="font-mono text-sm font-semibold text-slate-400">No Screenshot Uploaded</p>
              <p className="text-xs text-slate-600 max-w-sm mt-1">
                Select a benchmark preset or upload a screenshot to compare with the live feed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
