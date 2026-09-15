import React, { useState, useRef, useEffect, useId, memo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Sliders,
  Check,
  ChevronRight,
  Camera,
  Radio,
} from 'lucide-react';
import { SampleChart } from '../types';
import { optimizeChartImage } from '../utils/imageOptimizer';
import { mapTickerToTradingViewSymbol } from './LiveTradingViewChart';

export const STANDARD_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'] as const;

interface ChartUploaderProps {
  onImageSelected: (dataUrl: string, name?: string) => void;
  onAnalyze: () => void;
  selectedImage: string | null;
  imageName: string | null;
  isLoading: boolean;
  sampleCharts: SampleChart[];
  onSelectSample: (sample: SampleChart) => void;
  selectedSampleId: string | null;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  selectedTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

export const ChartUploader = memo(function ChartUploader({
  onImageSelected,
  onAnalyze,
  selectedImage,
  imageName,
  isLoading,
  sampleCharts,
  onSelectSample,
  selectedSampleId,
  selectedTimeframe,
  onTimeframeChange,
  selectedTicker = 'BTC/USD',
  onSelectTicker,
}: ChartUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ originalKb: number; optimizedKb: number } | null>(null);
  const [isCustomTimeframeOpen, setIsCustomTimeframeOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const uploaderId = useId();

  // Sync custom input when selectedTimeframe changes externally
  useEffect(() => {
    if (!STANDARD_TIMEFRAMES.includes(selectedTimeframe as any)) {
      setCustomInputValue(selectedTimeframe);
      setIsCustomTimeframeOpen(true);
    }
  }, [selectedTimeframe]);

  const handleProcessAndSelectImage = async (fileOrDataUrl: File | string, filename?: string) => {
    try {
      setIsCompressing(true);
      const { optimizedDataUrl, originalSizeKb, optimizedSizeKb } = await optimizeChartImage(fileOrDataUrl, 1024, 0.85);
      setCompressionStats({ originalKb: originalSizeKb, optimizedKb: optimizedSizeKb });
      onImageSelected(optimizedDataUrl, filename || 'Optimized Chart Image');
    } catch (err) {
      console.error('Image compression failed, using source:', err);
      if (typeof fileOrDataUrl === 'string') {
        onImageSelected(fileOrDataUrl, filename);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessAndSelectImage(file, 'Pasted Chart Image');
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessAndSelectImage(file, file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessAndSelectImage(file, file.name);
    }
  };

  const handleSampleClick = async (sample: SampleChart) => {
    setCompressionStats(null);
    onSelectSample(sample);
    if (sample.timeframe) {
      onTimeframeChange(sample.timeframe);
    }
    if (sample.ticker && onSelectTicker) {
      onSelectTicker(sample.ticker);
    }
  };

  const handleSelectPresetTimeframe = (tf: string) => {
    onTimeframeChange(tf);
    setIsCustomTimeframeOpen(false);
  };

  const handleToggleCustom = () => {
    const nextOpen = !isCustomTimeframeOpen;
    setIsCustomTimeframeOpen(nextOpen);
    if (nextOpen) {
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 50);
    }
  };

  const handleCustomInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customInputValue.trim();
    if (val) {
      onTimeframeChange(val);
    }
  };

  const isCustomActive = !STANDARD_TIMEFRAMES.includes(selectedTimeframe as any);

  // Compute descriptive guidance based on active horizon
  const getTimeframeHorizonHint = (tf: string) => {
    const lower = tf.toLowerCase();
    if (['1m', '3m', '5m', '15m'].includes(lower)) {
      return {
        label: 'Scalp Execution Mode',
        desc: 'Tight micro-invalidation SL pips & agile liquid target bands',
        color: 'text-amber-300 border-amber-500/30 bg-amber-950/40',
      };
    }
    if (['30m', '1h', '2h', '4h'].includes(lower)) {
      return {
        label: 'Intraday / Session Order Flow',
        desc: 'Institutional 4H/1H Order Blocks & fair value gap invalidations',
        color: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/40',
      };
    }
    return {
      label: 'Macro / Swing Horizon',
      desc: 'Multi-day structural swing invalidations & major daily S/R targets',
      color: 'text-indigo-300 border-indigo-500/30 bg-indigo-950/40',
    };
  };

  const horizonHint = getTimeframeHorizonHint(selectedTimeframe);
  const activeTvSymbol = mapTickerToTradingViewSymbol(selectedTicker);

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-xl">
      {/* Top Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Institutional Chart Data Feed
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live TradingView Connected: <strong className="text-emerald-400">{activeTvSymbol}</strong>
        </span>
      </div>

      {/* Preset Fast Selector */}
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 font-medium">
          Benchmark Market Structure Feeds:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {sampleCharts.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                id={`sample-chart-btn-${sample.id}`}
                onClick={() => handleSampleClick(sample)}
                disabled={isLoading || isCompressing}
                className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between text-xs ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-500/10 text-white shadow-sm ring-1 ring-cyan-500/40'
                    : 'border-slate-800/90 bg-[#07090e] text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[11px] text-cyan-300">{sample.ticker}</span>
                  <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                    {sample.timeframe}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">{sample.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIME-FRAME CONTROL SELECTOR COMPONENT */}
      <div className="bg-[#07090e] border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Execution Timeframe Setting
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
              Active: {selectedTimeframe}
            </span>
          </div>

          <div className={`text-[11px] font-mono px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${horizonHint.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{horizonHint.label}:</span>
            <span className="text-slate-300 hidden md:inline">{horizonHint.desc}</span>
          </div>
        </div>

        {/* Standard Preset Pills + Custom Toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STANDARD_TIMEFRAMES.map((tf) => {
            const isActive = selectedTimeframe.toLowerCase() === tf.toLowerCase() && !isCustomActive;
            return (
              <button
                key={tf}
                type="button"
                id={`timeframe-preset-${tf}`}
                onClick={() => handleSelectPresetTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400/80 shadow-md shadow-cyan-950 ring-1 ring-cyan-400/40 scale-105'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          {/* Custom Timeframe Button */}
          <button
            type="button"
            onClick={handleToggleCustom}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
              isCustomActive
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/80 shadow-md ring-1 ring-purple-400/40'
                : isCustomTimeframeOpen
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Custom TF</span>
            {isCustomActive && (
              <span className="px-1 py-0.2 bg-purple-950 text-purple-200 rounded text-[10px]">
                {selectedTimeframe}
              </span>
            )}
          </button>
        </div>

        {/* Custom Input Expandable Row */}
        {isCustomTimeframeOpen && (
          <form
            onSubmit={handleCustomInputSubmit}
            className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80"
          >
            <span className="text-[11px] font-mono text-slate-400">Specify Target Horizon:</span>
            <div className="relative">
              <input
                ref={customInputRef}
                type="text"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                placeholder="e.g. 3m, 2H, 8H, 12H, 3D"
                className="bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-2.5 py-1 text-xs font-mono text-white placeholder-slate-600 focus:outline-none w-44"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Apply Horizon
            </button>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <span>Presets:</span>
              {['3m', '2H', '8H', '12H', '3D'].map((quickTf) => (
                <button
                  key={quickTf}
                  type="button"
                  onClick={() => {
                    setCustomInputValue(quickTf);
                    onTimeframeChange(quickTf);
                  }}
                  className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800"
                >
                  {quickTf}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* Drag and Drop Screenshot / Live Feed Stage Bar */}
      <div
        id={`chart-dropzone-${uploaderId}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-3.5 sm:p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800/90 hover:border-slate-700 bg-[#07090e]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedImage ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                <img
                  src={selectedImage}
                  alt="Chart Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[240px] sm:max-w-md">
                    {imageName
                      ? `${imageName.replace(/\s*-\s*\d+[mhdHMDwW]?.*$/i, '').trim()} - ${selectedTimeframe} Execution Stage`
                      : `Live Chart Feed - ${selectedTimeframe} Execution Stage`}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400">
                    Live TradingView Snapshot Bound: <span className="text-cyan-400 font-mono font-bold">{activeTvSymbol} ({selectedTimeframe})</span>
                  </p>
                  {compressionStats && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                      <Zap className="w-2.5 h-2.5" />
                      {compressionStats.optimizedKb}KB
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 flex-shrink-0 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>TF: {selectedTimeframe}</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 flex-shrink-0 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                Live Feed Ready
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Upload className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Click to browse or Drag & Drop financial chart screenshot
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Auto-optimized to 1024px JPEG for lightning sub-2s processing • Clipboard (<kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">⌘+V</kbd>)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Execution Trigger Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Pipeline: High-Precision Coordinate Extractor & Alpha Engine ({selectedTicker} • {selectedTimeframe})</span>
        </div>

        <button
          id="run-analysis-engine-button"
          onClick={onAnalyze}
          disabled={isLoading || isCompressing}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            isLoading || isCompressing
              ? 'bg-blue-600/50 text-blue-200 cursor-wait border border-blue-500/40'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.99] border border-cyan-400/30'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Analyzing Institutional Order Flow ({selectedTimeframe.toUpperCase()})...</span>
            </>
          ) : isCompressing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Optimizing Chart Frame...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>ANALYZE INSTITUTIONAL ORDER FLOW ({selectedTicker} - {selectedTimeframe.toUpperCase()})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
