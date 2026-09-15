import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Layers,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Clock,
  Send,
  MoveVertical,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Radio,
  Database,
} from 'lucide-react';
import { ChartAnalysisResult } from '../types';
import { PositionCalculatorPanel } from './PositionCalculatorPanel';
import { MacroNewsRadarCard } from './MacroNewsRadarCard';
import { HistoricalBacktestCard } from './HistoricalBacktestCard';

interface AnalysisResultsDashboardProps {
  result: ChartAnalysisResult | null;
  executionTimeMs: number | null;
  isLoading: boolean;
  onOpenWebhookModal?: () => void;
  onOpenTradeMemoModal?: () => void;
  onOpenExecutionTicketModal?: () => void;
}

export function AnalysisResultsDashboard({
  result,
  executionTimeMs,
  isLoading,
  onOpenWebhookModal,
  onOpenTradeMemoModal,
  onOpenExecutionTicketModal,
}: AnalysisResultsDashboardProps) {
  if (!result && !isLoading) {
    return (
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[350px] shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 font-mono">Awaiting Institutional Order Flow Analysis</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select a sample chart or upload a screenshot and click "ANALYZE INSTITUTIONAL ORDER FLOW" to extract quantitative parameters.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[350px] shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
          <Zap className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
          Auditing Institutional Market Structure
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Parsing visual price axis, validating liquidity pools, calculating structural invalidation levels...
        </p>
      </div>
    );
  }

  if (!result) return null;

  // Calculate Live Risk-to-Reward Ratios
  const entryMid = (result.coordinates.entry_zone.low + result.coordinates.entry_zone.high) / 2;
  const slDistance = Math.abs(entryMid - result.coordinates.stop_loss);

  const calculateRR = (tp: number) => {
    if (slDistance <= 0 || !tp) return 'N/A';
    const rewardDistance = Math.abs(tp - entryMid);
    const ratio = rewardDistance / slDistance;
    return `1:${ratio.toFixed(2)}`;
  };

  const getBiasConfig = (bias: string) => {
    switch (bias) {
      case 'BULLISH':
        return {
          icon: TrendingUp,
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400',
          badge: 'Bullish Institutional Expansion',
        };
      case 'BEARISH':
        return {
          icon: TrendingDown,
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          textColor: 'text-rose-400',
          badge: 'Bearish Institutional Distribution',
        };
      default:
        return {
          icon: Minus,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-400',
          badge: 'Equilibrium Range Consolidation',
        };
    }
  };

  const biasConfig = getBiasConfig(result.bias);
  const BiasIcon = biasConfig.icon;
  const isAdjusted = !!result.original_coordinates;

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Institutional Status Banner */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          {/* Ticker & Timeframe */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#07090e] border border-slate-800 font-mono">
              <span className="text-xs text-slate-400">INSTRUMENT: </span>
              <span className="text-base font-bold text-white tracking-wide">{result.ticker}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">TF: </span>
              <span className="text-cyan-300 font-semibold">{result.timeframe}</span>
            </div>
          </div>

          {/* Directional Bias */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono ${biasConfig.bgColor} ${biasConfig.borderColor}`}>
            <BiasIcon className={`w-4 h-4 ${biasConfig.textColor}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${biasConfig.textColor}`}>
              {result.bias} ORDER FLOW
            </span>
          </div>

          {/* Signal Confluence Score Meter (Explicitly NOT a win probability) */}
          <div className="flex items-center gap-3 bg-[#07090e] px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Signal Score</div>
              <div className="text-sm font-bold text-cyan-300">{result.confidence_score}/100</div>
              <div className="text-[8px] text-slate-500 uppercase">Quantitative Confluence</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center relative">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={81.68}
                  strokeDashoffset={81.68 - (81.68 * result.confidence_score) / 100}
                  className="text-cyan-400 transition-all duration-1000"
                  fill="transparent"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Execution Metadata Bar with Print Trade Memo Button */}
        <div className="flex flex-wrap items-center justify-between pt-3 text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Market Structure & Price Coordinates Extracted</span>
            {isAdjusted && (
              <span className="text-cyan-400 font-semibold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                • Overlay Coordinates Custom Adjusted
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {executionTimeMs && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Latency: {executionTimeMs}ms</span>
              </div>
            )}

            {onOpenTradeMemoModal && (
              <button
                onClick={onOpenTradeMemoModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#07090e] hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 hover:text-white transition-all shadow-sm"
                title="Export Institutional Trade Memo"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Trade Sheet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Macro News Guardrail Radar */}
      <MacroNewsRadarCard ticker={result.ticker} />

      {/* STATISTICALLY VALIDATED QUANTITATIVE SIGNAL ACTION CARD (MANUAL EXECUTION ONLY) */}
      <div className="bg-[#0b101b] border-2 border-cyan-500/40 rounded-xl p-4 lg:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border flex items-center justify-center ${
            result.bias === 'BULLISH'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : result.bias === 'BEARISH'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          }`}>
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Quantitative Signal Intelligence Setup
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                result.bias === 'BULLISH'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : result.bias === 'BEARISH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}>
                {result.bias === 'BULLISH' ? 'LONG SETUP' : result.bias === 'BEARISH' ? 'SHORT SETUP' : 'NO TRADE'} • {result.ticker}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                MANUAL EXECUTION ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Volatility-Adjusted Donchian Breakout + EMA200 + RSI14 + Volume SMA20 + ATR14. Dynamic Targets: TP1 ({calculateRR(result.coordinates.take_profit_1)}), TP2 ({calculateRR(result.coordinates.take_profit_2)}), TP3 ({calculateRR(result.coordinates.take_profit_3 || 0)}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {onOpenExecutionTicketModal && (
            <button
              onClick={onOpenExecutionTicketModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-xl shadow-cyan-500/20 transition-all uppercase tracking-wider text-xs"
            >
              <Target className="w-4 h-4" />
              <span>Inspect 19-Point Signal Spec</span>
            </button>
          )}

          {onOpenWebhookModal && (
            <button
              onClick={onOpenWebhookModal}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors"
              title="Signal Webhook Dispatch"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Signal Webhook</span>
            </button>
          )}
        </div>
      </div>

      {/* Trade Execution Coordinates Matrix (Updates in Real-Time on Drag) */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Liquid Target Bands & Structural Invalidation Level
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
              TF: {result.timeframe}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdjusted && (
              <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                <MoveVertical className="w-2.5 h-2.5" />
                Live Adjusted
              </span>
            )}
            <span className="text-[11px] font-mono text-slate-400">Visual Scale Coordinates</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Entry Zone */}
          <div className="bg-[#07090e] p-3 rounded-lg border border-blue-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>ENTRY ZONE</span>
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            </div>
            <div className="font-mono font-bold text-sm text-blue-300">
              {result.coordinates.entry_zone.low} - {result.coordinates.entry_zone.high}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Recommended Execution Band</div>
          </div>

          {/* Structural Invalidation Level */}
          <div className="bg-[#07090e] p-3 rounded-lg border border-rose-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>STRUCTURAL INVALIDATION (SL)</span>
              <Shield className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="font-mono font-bold text-sm text-rose-400">
              {result.coordinates.stop_loss}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Hard Stop Invalidation Point
            </div>
          </div>

          {/* TP 1 */}
          <div className="bg-[#07090e] p-3 rounded-lg border border-emerald-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>TP1 LIQUIDITY TARGET</span>
              <span className="text-[10px] px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono font-bold border border-emerald-600/30">
                R:R {calculateRR(result.coordinates.take_profit_1)}
              </span>
            </div>
            <div className="font-mono font-bold text-sm text-emerald-400">
              {result.coordinates.take_profit_1}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Conservative Milestone Target</div>
          </div>

          {/* TP 2 / TP 3 */}
          <div className="bg-[#07090e] p-3 rounded-lg border border-emerald-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>TP2 & TP3 (RUNNERS)</span>
              <span className="text-[10px] px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono font-bold border border-emerald-600/30">
                R:R {calculateRR(result.coordinates.take_profit_3 || result.coordinates.take_profit_2)}
              </span>
            </div>
            <div className="font-mono font-bold text-xs text-emerald-300 flex items-center gap-1.5">
              <span>TP2: {result.coordinates.take_profit_2}</span>
              <span>•</span>
              <span>TP3: {result.coordinates.take_profit_3}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Extended Liquidity Objectives</div>
          </div>
        </div>
      </div>

      {/* Dynamic Risk & Position Sizing Calculator Panel */}
      <PositionCalculatorPanel
        result={result}
        onOpenWebhookModal={onOpenWebhookModal || (() => {})}
      />

      {/* Key Levels & Market Structure Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Support & Resistance Zones */}
        <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Key Support & Resistance Levels
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
              TF: {result.timeframe}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                SUPPORT ZONES (INSTITUTIONAL DEMAND):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.key_levels?.support && result.key_levels.support.length > 0 ? (
                  result.key_levels.support.map((lvl, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#07090e] border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold"
                    >
                      {lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-mono">None isolated</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                RESISTANCE ZONES (INSTITUTIONAL SUPPLY):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.key_levels?.resistance && result.key_levels.resistance.length > 0 ? (
                  result.key_levels.resistance.map((lvl, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#07090e] border border-rose-500/30 text-rose-300 font-mono text-xs font-bold"
                    >
                      {lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-mono">None isolated</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Identified Structures & Patterns */}
        <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Identified Market Structures & Smart Money Concepts (SMC)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
              TF: {result.timeframe}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.identified_structures.map((structure, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {structure}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional Rationale Card */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Institutional Trade Rationale & Confluence Narrative
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
            TF: {result.timeframe}
          </span>
        </div>
        <p className="text-xs text-slate-300 font-mono leading-relaxed bg-[#07090e] p-3.5 rounded-lg border border-slate-800/80">
          {result.rationale}
        </p>
      </div>
    </div>
  );
}
