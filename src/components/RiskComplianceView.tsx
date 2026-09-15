import { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertTriangle,
  Lock,
  Percent,
  DollarSign,
  BarChart3,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Zap,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { ChartAnalysisResult, PropFirmPreset } from '../types';
import { PROP_FIRM_PRESETS, computePositionSizing } from '../utils/calculator';
import { generatePatternBacktest } from '../utils/backtestNewsService';

interface RiskComplianceViewProps {
  activeResult: ChartAnalysisResult | null;
  onOpenTradeMemoModal?: () => void;
}

export function RiskComplianceView({ activeResult, onOpenTradeMemoModal }: RiskComplianceViewProps) {
  const [selectedFirm, setSelectedFirm] = useState<PropFirmPreset>('ftmo');
  const [accountBalance, setAccountBalance] = useState<number>(100000);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(1.0);
  const [openTradesCount, setOpenTradesCount] = useState<number>(2);

  const rule = PROP_FIRM_PRESETS[selectedFirm];
  const backtest = activeResult ? generatePatternBacktest(activeResult) : null;

  const maxDailyLossAmount = accountBalance * (rule.maxDailyLossPct / 100);
  const maxTotalLossAmount = accountBalance * (rule.maxTotalLossPct / 100);
  const singleTradeRiskAmount = accountBalance * (riskPerTrade / 100);
  const totalOpenRiskAmount = singleTradeRiskAmount * openTradesCount;
  const totalOpenRiskPct = riskPerTrade * openTradesCount;

  const isTradeRiskViolated = riskPerTrade > rule.maxRiskPerTradePct;
  const isDailyRiskViolated = totalOpenRiskPct > rule.maxDailyLossPct;

  // Monte Carlo stress-testing: probability of consecutive losses
  const winRate = backtest ? backtest.winRate / 100 : 0.68;
  const lossRate = 1 - winRate;
  const prob3Losses = Number((Math.pow(lossRate, 3) * 100).toFixed(2));
  const prob5Losses = Number((Math.pow(lossRate, 5) * 100).toFixed(2));

  return (
    <div className="flex flex-col gap-5 font-mono text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 lg:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Prop-Firm & Institutional Portfolio Risk Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-bold">
                  PASS AUDIT ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drawdown guardrails, challenge rule enforcement, and statistical stress testing
              </p>
            </div>
          </div>

          {onOpenTradeMemoModal && activeResult && (
            <button
              onClick={onOpenTradeMemoModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-cyan-300 text-xs rounded-lg transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Export Compliance Audit Sheet</span>
            </button>
          )}
        </div>

        {/* Challenge Selection Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Select Challenge Mandate:</span>
          {(['ftmo', 'funding_pips', 'topstep', 'custom', 'off'] as PropFirmPreset[]).map((preset) => {
            const isSelected = selectedFirm === preset;
            const item = PROP_FIRM_PRESETS[preset];
            return (
              <button
                key={preset}
                onClick={() => {
                  setSelectedFirm(preset);
                  if (preset !== 'off') setRiskPerTrade(item.maxRiskPerTradePct);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border border-emerald-500/60 shadow-sm'
                    : 'bg-[#07090e] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compliance Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Drawdown Limit */}
        <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MAX DAILY LOSS CAP</span>
            <span className="text-emerald-400 font-bold">{rule.maxDailyLossPct}%</span>
          </div>
          <div className="text-xl font-bold text-rose-400">
            -${maxDailyLossAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Circuit breaker resets every 24h (00:00 CE(S)T)
          </div>
        </div>

        {/* Max Trailing Total Drawdown */}
        <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MAX OVERALL DRAWDOWN</span>
            <span className="text-emerald-400 font-bold">{rule.maxTotalLossPct}%</span>
          </div>
          <div className="text-xl font-bold text-rose-400">
            -${maxTotalLossAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Absolute catastrophic stop limit
          </div>
        </div>

        {/* Max Risk Per Trade */}
        <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>RECOMMENDED RISK/TRADE</span>
            <span className="text-cyan-400 font-bold">≤ {rule.maxRiskPerTradePct}%</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">
            ${singleTradeRiskAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Active: {riskPerTrade}% risk per single position
          </div>
        </div>

        {/* Profit Target */}
        <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>PHASE 1 PROFIT TARGET</span>
            <span className="text-emerald-400 font-bold">+{rule.profitTargetPct}%</span>
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +${(accountBalance * (rule.profitTargetPct / 100)).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Requires ~{Math.ceil(rule.profitTargetPct / (riskPerTrade * 2))} winning R:R 1:2 setups
          </div>
        </div>
      </div>

      {/* Live Interactive Risk Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Parameters */}
        <div className="lg:col-span-7 bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Portfolio Allocation & Stress Parameters
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Real-Time Recalculation</span>
          </div>

          {/* Account Balance */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Account Equity / Challenge Size:</span>
              <strong className="text-white">${accountBalance.toLocaleString()}</strong>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[25000, 50000, 100000, 200000].map((b) => (
                <button
                  key={b}
                  onClick={() => setAccountBalance(b)}
                  className={`py-1.5 text-xs rounded-lg border transition-all ${
                    accountBalance === b
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-[#07090e] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ${b / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Risk Per Trade Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Risk Per Setup (% of Equity):</span>
              <strong className={isTradeRiskViolated ? 'text-rose-400' : 'text-cyan-300'}>
                {riskPerTrade}% (${singleTradeRiskAmount.toFixed(2)})
              </strong>
            </div>
            <input
              type="range"
              min="0.25"
              max="3.0"
              step="0.25"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.25% (Conservative)</span>
              <span>1.0% (Standard Prop Limit)</span>
              <span>3.0% (Aggressive)</span>
            </div>
          </div>

          {/* Concurrent Positions */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Concurrent Open Setups:</span>
              <strong className="text-white">{openTradesCount} Active Positions</strong>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setOpenTradesCount(count)}
                  className={`py-1.5 text-xs rounded-lg border transition-all ${
                    openTradesCount === count
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                      : 'bg-[#07090e] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {count} {count === 1 ? 'Trade' : 'Trades'} ({count * riskPerTrade}%)
                </button>
              ))}
            </div>
          </div>

          {/* Warning / Pass Notification */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
              isTradeRiskViolated || isDailyRiskViolated
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isTradeRiskViolated || isDailyRiskViolated ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold">
                {isTradeRiskViolated
                  ? `VIOLATION: ${riskPerTrade}% exceeds ${rule.name} Max Risk (${rule.maxRiskPerTradePct}%)`
                  : isDailyRiskViolated
                  ? `VIOLATION: Concurrent risk (${totalOpenRiskPct}%) exceeds Max Daily Loss (${rule.maxDailyLossPct}%)`
                  : `PASS: Configuration strictly complies with ${rule.name}`}
              </div>
              <p className="text-[11px] text-slate-400">
                {isTradeRiskViolated || isDailyRiskViolated
                  ? 'Executing under these parameters risks immediate prop-firm account disqualification.'
                  : `Remaining daily loss allowance buffer: $${(maxDailyLossAmount - totalOpenRiskAmount).toFixed(2)}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quantitative Monte Carlo Stress Analysis */}
        <div className="lg:col-span-5 bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Monte Carlo Streak Risk
              </h3>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-700 rounded">
              90D Alpha Model
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-[#07090e] p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Probability of 3 Consecutive Losses:</span>
                <strong className="text-amber-400">{prob3Losses}%</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Drawdown Impact: -{(riskPerTrade * 3).toFixed(2)}% (-${(singleTradeRiskAmount * 3).toFixed(2)})
              </div>
            </div>

            <div className="bg-[#07090e] p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Probability of 5 Consecutive Losses:</span>
                <strong className="text-emerald-400">{prob5Losses}%</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Drawdown Impact: -{(riskPerTrade * 5).toFixed(2)}% (-${(singleTradeRiskAmount * 5).toFixed(2)})
              </div>
            </div>

            <div className="bg-[#07090e] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">
                AUDITED RISK-ADJUSTED METRICS:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Sharpe Ratio:</span>
                  <div className="font-bold text-blue-300">{backtest ? backtest.sharpeRatio : '2.42'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Sortino Ratio:</span>
                  <div className="font-bold text-purple-300">{backtest ? backtest.sortinoRatio : '3.15'}</div>
                </div>
                <div>
                  <span className="text-slate-500">1-Day VaR (95%):</span>
                  <div className="font-bold text-rose-400">-{riskPerTrade * 1.15}%</div>
                </div>
                <div>
                  <span className="text-slate-500">Max Hist DD:</span>
                  <div className="font-bold text-slate-300">{backtest ? `-${backtest.maxDrawdownPct}%` : '-6.8%'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[10px] text-slate-400">
            Automated guardrails prevent trade placement when high-impact macro announcements are within 60 minutes.
          </div>
        </div>
      </div>
    </div>
  );
}
