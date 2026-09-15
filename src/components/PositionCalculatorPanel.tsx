import React, { useState, useEffect } from 'react';
import { ChartAnalysisResult, PositionSizingConfig, PropFirmPreset } from '../types';
import { detectAssetType, computePositionSizing, PROP_FIRM_PRESETS } from '../utils/calculator';
import {
  Calculator,
  DollarSign,
  Percent,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Award,
  Zap,
  Send,
  SlidersHorizontal,
  FileCheck,
} from 'lucide-react';

interface PositionCalculatorPanelProps {
  result: ChartAnalysisResult;
  onOpenWebhookModal: () => void;
}

export function PositionCalculatorPanel({
  result,
  onOpenWebhookModal,
}: PositionCalculatorPanelProps) {
  const detectedType = detectAssetType(result.ticker);

  const [config, setConfig] = useState<PositionSizingConfig>({
    accountBalance: 100000,
    riskPercentage: 1.0,
    assetType: detectedType,
    leverage: 1,
    propFirmMode: 'ftmo',
  });

  // Update asset type when ticker changes
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      assetType: detectAssetType(result.ticker),
    }));
  }, [result.ticker]);

  const sizing = computePositionSizing(
    result.coordinates,
    result.bias,
    result.confidence_score,
    config
  );

  const activePropPreset = config.propFirmMode && config.propFirmMode !== 'off' 
    ? PROP_FIRM_PRESETS[config.propFirmMode] 
    : null;

  const quickBalances = [10000, 25000, 50000, 100000, 200000];
  const quickRisks = [0.25, 0.5, 1.0, 1.5, 2.0];

  const handlePropPresetChange = (preset: PropFirmPreset) => {
    const rule = PROP_FIRM_PRESETS[preset];
    setConfig((prev) => ({
      ...prev,
      propFirmMode: preset,
      riskPercentage: preset !== 'off' ? rule.maxRiskPerTradePct : prev.riskPercentage,
    }));
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header with Prop Firm Compliance Toggle */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Institutional Risk & Lot Sizing Matrix
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Algorithmic lot allocation with live prop-firm risk audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">TF:</span>
          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-bold">
            {result.timeframe}
          </span>
          <span className="text-[11px] font-mono text-slate-400">Asset:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold uppercase">
            {config.assetType}
          </span>
        </div>
      </div>

      {/* Prop Firm Compliance Selector Bar */}
      <div className="bg-[#07090e] p-3 rounded-lg border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-300 font-bold">PROP-FIRM COMPLIANCE MODE:</span>
            <span className="text-[11px] text-slate-400 ml-1.5 hidden md:inline">
              Enforce drawdown caps & max trade risk
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['ftmo', 'funding_pips', 'topstep', 'custom', 'off'] as PropFirmPreset[]).map((preset) => {
            const isSelected = config.propFirmMode === preset;
            const label =
              preset === 'ftmo'
                ? 'FTMO (1.0%)'
                : preset === 'funding_pips'
                ? 'Funding Pips (1.0%)'
                : preset === 'topstep'
                ? 'Topstep (0.75%)'
                : preset === 'custom'
                ? 'Fund Mandate'
                : 'Unrestricted';

            return (
              <button
                key={preset}
                onClick={() => handlePropPresetChange(preset)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/60 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prop-Firm Live Compliance Status Banner */}
      {activePropPreset && (
        <div
          className={`p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 font-mono text-xs ${
            sizing.isPropFirmCompliant
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {sizing.isPropFirmCompliant ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {sizing.isPropFirmCompliant
                  ? `COMPLIANT: PASSED ${activePropPreset.name.toUpperCase()} RISK AUDIT`
                  : `RISK VIOLATION: EXCEEDS ${activePropPreset.name.toUpperCase()} LIMIT`}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Max Daily DD: <strong className="text-slate-200">{activePropPreset.maxDailyLossPct}%</strong> (${(config.accountBalance * (activePropPreset.maxDailyLossPct / 100)).toLocaleString()}) • Total Loss Cap: <strong className="text-slate-200">{activePropPreset.maxTotalLossPct}%</strong> (${(config.accountBalance * (activePropPreset.maxTotalLossPct / 100)).toLocaleString()})
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sizing.isPropFirmCompliant
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              }`}
            >
              Risk at Stake: ${sizing.riskAmount.toFixed(2)} ({config.riskPercentage}%)
            </span>
          </div>
        </div>
      )}

      {/* Inputs Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Balance */}
        <div className="bg-[#07090e] p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold">PORTFOLIO / CHALLENGE CAPITAL</span>
            <span className="text-cyan-400 font-bold">${config.accountBalance.toLocaleString()}</span>
          </div>

          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="1000"
              step="5000"
              value={config.accountBalance}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  accountBalance: Math.max(1, Number(e.target.value) || 0),
                }))
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-md text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="100000"
            />
          </div>

          {/* Quick Balance Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickBalances.map((bal) => (
              <button
                key={bal}
                onClick={() => setConfig((prev) => ({ ...prev, accountBalance: bal }))}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  config.accountBalance === bal
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                ${bal >= 1000 ? `${bal / 1000}k` : bal}
              </button>
            ))}
          </div>
        </div>

        {/* Max Risk Percentage */}
        <div className="bg-[#07090e] p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold">CAPITAL ALLOCATION RISK PER SETUP</span>
            <span
              className={`font-bold ${
                activePropPreset && config.riskPercentage > activePropPreset.maxRiskPerTradePct
                  ? 'text-rose-400'
                  : 'text-cyan-400'
              }`}
            >
              {config.riskPercentage}% (${sizing.riskAmount.toFixed(2)})
            </span>
          </div>

          <div className="relative">
            <Percent className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={config.riskPercentage}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  riskPercentage: Math.max(0.05, Math.min(20, Number(e.target.value) || 0)),
                }))
              }
              className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-md text-white font-mono text-sm font-bold focus:outline-none transition-colors ${
                activePropPreset && config.riskPercentage > activePropPreset.maxRiskPerTradePct
                  ? 'border-rose-500/80 focus:border-rose-400'
                  : 'border-slate-700/80 focus:border-cyan-500'
              }`}
              placeholder="1.0"
            />
          </div>

          {/* Quick Risk Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickRisks.map((r) => (
              <button
                key={r}
                onClick={() => setConfig((prev) => ({ ...prev, riskPercentage: r }))}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  config.riskPercentage === r
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Computed Quantitative Sizing Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Recommended Trade Volume */}
        <div className="bg-[#07090e] p-3.5 rounded-lg border border-cyan-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>RECOMMENDED LOT / NOTIONAL</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-mono font-extrabold text-base text-cyan-300">
            {sizing.formattedUnits}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {sizing.unitLabel} • Notional: ${Math.round(sizing.positionNotional).toLocaleString()}
          </div>
        </div>

        {/* Structural Invalidation Risk */}
        <div className="bg-[#07090e] p-3.5 rounded-lg border border-rose-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>STRUCTURAL INVALIDATION AT RISK</span>
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="font-mono font-extrabold text-base text-rose-400">
            -${sizing.riskAmount.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            SL Span: {sizing.slDistance.toFixed(4)} ({sizing.slPercentage.toFixed(2)}%)
          </div>
        </div>

        {/* Audited Win Probability / Alpha Profile */}
        <div className="bg-[#07090e] p-3.5 rounded-lg border border-emerald-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>AUDITED WIN PROBABILITY</span>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-600/30">
              Alpha R:R 1:{sizing.tp1RR.toFixed(2)}
            </span>
          </div>
          <div className="font-mono font-extrabold text-base text-emerald-300">
            ~{sizing.winProbability}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Sharpe: {sizing.sharpeRatio} • 1-Day VaR (95%): {sizing.valueAtRisk95?.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Target Profit Scenarios Matrix */}
      <div className="bg-[#07090e] p-3 rounded-lg border border-slate-800 text-xs font-mono">
        <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIQUID TARGET BANDS & EXPECTED REWARD</span>
          </div>
          <span className="text-slate-500 text-[10px]">Real-Time Invalidation Brackets</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">TARGET 1 (CONSERVATIVE)</div>
            <div className="text-emerald-400 font-bold text-xs mt-0.5">
              +${sizing.tp1Profit.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              1:{sizing.tp1RR.toFixed(2)} R:R
            </div>
          </div>

          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">TARGET 2 (RUNNER)</div>
            <div className="text-emerald-400 font-bold text-xs mt-0.5">
              +${sizing.tp2Profit.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              1:{sizing.tp2RR.toFixed(2)} R:R
            </div>
          </div>

          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">TARGET 3 (LIQUIDITY EXPANSION)</div>
            <div className="text-emerald-400 font-bold text-xs mt-0.5">
              +${sizing.tp3Profit.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              1:{sizing.tp3RR.toFixed(2)} R:R
            </div>
          </div>
        </div>
      </div>

      {/* One-Click Webhook Execution Trigger */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Risk calculated against visual coordinates & prop-firm daily drawdown bounds
        </div>
        <button
          onClick={onOpenWebhookModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-wider"
        >
          <Send className="w-3.5 h-3.5 text-slate-950" />
          <span>Export Webhook / Dispatch Order</span>
        </button>
      </div>
    </div>
  );
}
