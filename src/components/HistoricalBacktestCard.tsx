import { useState, useMemo } from 'react';
import {
  History,
  TrendingUp,
  Percent,
  Award,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Target,
  Sparkles,
  ShieldAlert,
  Flame,
  Binary,
  Clock,
} from 'lucide-react';
import { ChartAnalysisResult } from '../types';
import { generatePatternBacktest } from '../utils/backtestNewsService';

interface HistoricalBacktestCardProps {
  result: ChartAnalysisResult;
}

export function HistoricalBacktestCard({ result }: HistoricalBacktestCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [resampleSeed, setResampleSeed] = useState(0);

  const backtestStats = useMemo(() => {
    // Generate fresh stats whenever result (ticker, timeframe, coordinates, confidence) or manual re-sample seed updates
    return generatePatternBacktest(result);
  }, [result, resampleSeed]);

  const handleReRunBacktest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setResampleSeed((s) => s + 1);
      setIsSimulating(false);
    }, 120);
  };

  const {
    patternName,
    ticker,
    timeframe,
    lookbackDays,
    sampleSize,
    winRate,
    profitFactor,
    avgRiskReward,
    maxConsecutiveWins,
    maxDrawdownPct,
    expectancyR,
    sharpeRatio,
    sortinoRatio,
    valueAtRisk95,
    holdTimeLabel,
    recentDistribution,
  } = backtestStats;

  // Format descriptive setup title based on timeframe and structure
  const isScalp = ['1m', '3m', '5m', '15m'].includes(timeframe.toLowerCase());
  const isSwing = ['8h', '12h', '1d', '3d', '1w'].includes(timeframe.toLowerCase());
  const setupTypeLabel = isScalp ? 'Scalp Sweep' : isSwing ? 'Swing Extension' : 'Order Flow Setup';

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 font-mono shadow-xl">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Audited Win Probability & Quantitative Alpha Engine
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-600/40 text-indigo-300 font-bold">
                {lookbackDays}D LOOKBACK
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Institutional quantitative backtesting, Sharpe/Sortino ratios & Value at Risk (VaR)
            </p>
          </div>
        </div>

        {/* Re-simulate Button */}
        <button
          onClick={handleReRunBacktest}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07090e] border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 text-xs transition-colors"
        >
          <RefreshCw className={`w-3 h-3 text-indigo-400 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Querying...' : 'Re-Sample Alpha'}</span>
        </button>
      </div>

      {/* Primary Pattern Summary Pill */}
      <div className="mt-3 bg-[#07090e] p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-300">
            Tested Setup:{' '}
            <strong className="text-cyan-300 font-bold">
              {ticker} {timeframe} {setupTypeLabel} ({patternName})
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          {holdTimeLabel && (
            <div className="flex items-center gap-1 text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Avg Hold: <strong className="text-slate-200">{holdTimeLabel}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited Sample: <strong className="text-slate-200">{sampleSize} Trades</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of Key Quantitative Institutional Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
        {/* Win Rate */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>WIN PROBABILITY</span>
            <Percent className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400">{winRate}%</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Historical Alpha</div>
        </div>

        {/* Avg Risk:Reward */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>AVG R:R RATIO</span>
            <Target className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-cyan-300">{avgRiskReward}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Realized Yield</div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>SHARPE RATIO</span>
            <TrendingUp className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-base font-bold text-blue-300">{sharpeRatio}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Risk-Adjusted Alpha</div>
        </div>

        {/* Sortino Ratio */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>SORTINO RATIO</span>
            <Flame className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-base font-bold text-purple-300">{sortinoRatio}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Downside Volatility</div>
        </div>

        {/* Profit Factor */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>PROFIT FACTOR</span>
            <Binary className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-indigo-300">{profitFactor}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Gross Win / Loss</div>
        </div>

        {/* Value at Risk (VaR 95%) */}
        <div className="bg-[#07090e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>VALUE AT RISK (95%)</span>
            <ShieldAlert className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-rose-400 truncate">{valueAtRisk95.split(' ')[0]}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">1-Day VaR Guardrail</div>
        </div>
      </div>

      {/* Target Distribution Visual Bar */}
      <div className="mt-3 bg-[#07090e] p-3 rounded-lg border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-slate-300 uppercase">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            Liquid Target Bands Realization Breakdown
          </span>
          <span>{recentDistribution.tp1Hits + recentDistribution.slHits} Audited Outcomes</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {/* TP1 Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-[10px] w-28">TP1 Conservative ({recentDistribution.tp1Hits})</span>
            <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${winRate}%` }}
              ></div>
            </div>
            <span className="text-emerald-400 font-bold text-[10px] w-10 text-right">{winRate}%</span>
          </div>

          {/* TP2 Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-[10px] w-28">TP2 Runner ({recentDistribution.tp2Hits})</span>
            <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${((recentDistribution.tp2Hits / sampleSize) * 100).toFixed(1)}%` }}
              ></div>
            </div>
            <span className="text-cyan-400 font-bold text-[10px] w-10 text-right">
              {((recentDistribution.tp2Hits / sampleSize) * 100).toFixed(0)}%
            </span>
          </div>

          {/* TP3 Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-[10px] w-28">TP3 Liquidity Pool ({recentDistribution.tp3Hits})</span>
            <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${((recentDistribution.tp3Hits / sampleSize) * 100).toFixed(1)}%` }}
              ></div>
            </div>
            <span className="text-indigo-400 font-bold text-[10px] w-10 text-right">
              {((recentDistribution.tp3Hits / sampleSize) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
          <span>Max Consecutive Wins: <strong className="text-slate-300">{maxConsecutiveWins}</strong></span>
          <span>Expectancy per Execution: <strong className="text-emerald-400">+{expectancyR}R</strong></span>
          <span>Max Historical Drawdown: <strong className="text-rose-400">-{maxDrawdownPct}%</strong></span>
        </div>
      </div>
    </div>
  );
}
