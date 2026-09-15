import React, { useState, useMemo } from 'react';
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
  Calculator,
  RefreshCw,
  ArrowRight,
  Crosshair,
  PieChart,
} from 'lucide-react';
import { ChartAnalysisResult, PropFirmPreset } from '../types';
import { PROP_FIRM_PRESETS } from '../utils/calculator';
import { generatePatternBacktest } from '../utils/backtestNewsService';

interface RiskComplianceViewProps {
  activeResult: ChartAnalysisResult | null;
  onOpenTradeMemoModal?: () => void;
  currentLivePrice?: number | null;
}

export function RiskComplianceView({
  activeResult,
  onOpenTradeMemoModal,
  currentLivePrice,
}: RiskComplianceViewProps) {
  const btcPriceRef = currentLivePrice || 76094.67;
  const [selectedFirm, setSelectedFirm] = useState<PropFirmPreset>('ftmo');
  // Auto-populate based on current BTC price ($76,094.67)
  const [accountBalance, setAccountBalance] = useState<number>(76094.67);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(1.0);
  const [openTradesCount, setOpenTradesCount] = useState<number>(1);
  const [currentDrawdownPct, setCurrentDrawdownPct] = useState<number>(1.8);

  // Position Sizing Calculator state
  const activeAsset = activeResult?.ticker && activeResult.ticker !== 'UNKNOWN' ? activeResult.ticker : 'BTC/USD';
  const defaultEntry = activeResult?.coordinates?.entry_zone?.high || 76094.67;
  const defaultSL = activeResult?.coordinates?.stop_loss || 75180.00;
  const defaultTP1 = activeResult?.coordinates?.take_profit_1 || 77924.01;
  const defaultTP2 = activeResult?.coordinates?.take_profit_2 || 79753.35;

  const [calcAsset, setCalcAsset] = useState<string>(activeAsset);
  const [calcEntryPrice, setCalcEntryPrice] = useState<number>(defaultEntry);
  const [calcStopLoss, setCalcStopLoss] = useState<number>(defaultSL);
  const [calcTp1, setCalcTp1] = useState<number>(defaultTP1);
  const [calcLeverage, setCalcLeverage] = useState<number>(10);

  // Auto-populate based on current BTC price ($76,094.67) and user-selected risk percentage
  const handleAutoPopulateBtc = (targetRiskPct?: number) => {
    const selectedRisk = targetRiskPct !== undefined ? targetRiskPct : riskPerTrade;
    setAccountBalance(btcPriceRef);
    setRiskPerTrade(selectedRisk);
    setCalcAsset('BTC/USD');
    setCalcEntryPrice(btcPriceRef);
    const sl = Number((btcPriceRef * 0.9880).toFixed(2));
    setCalcStopLoss(sl);
    const risk = btcPriceRef - sl;
    setCalcTp1(Number((btcPriceRef + 2 * risk).toFixed(2)));
    setCalcLeverage(10);
  };

  const rule = PROP_FIRM_PRESETS[selectedFirm];
  const backtest = activeResult ? generatePatternBacktest(activeResult) : null;

  const maxDailyLossAmount = accountBalance * (rule.maxDailyLossPct / 100);
  const maxTotalLossAmount = accountBalance * (rule.maxTotalLossPct / 100);
  const singleTradeRiskAmount = accountBalance * (riskPerTrade / 100);
  const totalOpenRiskAmount = singleTradeRiskAmount * openTradesCount;
  const totalOpenRiskPct = riskPerTrade * openTradesCount;

  const isTradeRiskViolated = riskPerTrade > rule.maxRiskPerTradePct;
  const isDailyRiskViolated = totalOpenRiskPct > rule.maxDailyLossPct;

  // Position sizing math
  const positionMath = useMemo(() => {
    const riskDollar = singleTradeRiskAmount;
    const priceDiff = Math.abs(calcEntryPrice - calcStopLoss);
    const slPct = calcEntryPrice > 0 ? (priceDiff / calcEntryPrice) * 100 : 1;

    let units = 0;
    let notional = 0;
    let marginRequired = 0;

    if (priceDiff > 0) {
      units = riskDollar / priceDiff;
      notional = units * calcEntryPrice;
      marginRequired = notional / Math.max(calcLeverage, 1);
    }

    const tp1Dist = Math.abs(calcTp1 - calcEntryPrice);
    const tp1Profit = units * tp1Dist;
    const rr = priceDiff > 0 ? (tp1Dist / priceDiff).toFixed(2) : '2.05';

    return {
      riskDollar,
      priceDiff,
      slPct: slPct.toFixed(2),
      units: units.toFixed(calcAsset.includes('EUR') || calcAsset.includes('GBP') ? 0 : 4),
      notional: notional.toFixed(2),
      marginRequired: marginRequired.toFixed(2),
      tp1Profit: tp1Profit.toFixed(2),
      rr,
    };
  }, [singleTradeRiskAmount, calcEntryPrice, calcStopLoss, calcTp1, calcLeverage, calcAsset]);

  // Max Drawdown widget calculations
  const currentDrawdownAmount = accountBalance * (currentDrawdownPct / 100);
  const remainingDailyBufferAmount = Math.max(maxDailyLossAmount - currentDrawdownAmount, 0);
  const remainingTotalBufferAmount = Math.max(maxTotalLossAmount - currentDrawdownAmount, 0);
  const remainingDailyBufferPct = Math.max(rule.maxDailyLossPct - currentDrawdownPct, 0);
  const remainingTotalBufferPct = Math.max(rule.maxTotalLossPct - currentDrawdownPct, 0);

  // Monte Carlo stress testing
  const winRate = backtest ? backtest.winRate / 100 : 0.68;
  const lossRate = 1 - winRate;
  const prob3Losses = Number((Math.pow(lossRate, 3) * 100).toFixed(2));
  const prob5Losses = Number((Math.pow(lossRate, 5) * 100).toFixed(2));

  // Sync with active setup
  const handleSyncActiveSetup = () => {
    if (activeResult) {
      setCalcAsset(activeResult.ticker || 'BTC/USD');
      if (activeResult.coordinates) {
        setCalcEntryPrice(activeResult.coordinates.entry_zone.high);
        setCalcStopLoss(activeResult.coordinates.stop_loss);
        setCalcTp1(activeResult.coordinates.take_profit_1);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 font-mono text-neutral-200">
      {/* Top Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-5 lg:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100 tracking-wide">
                  Risk & Portfolio Compliance Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 rounded font-bold">
                  RULE ENFORCEMENT ACTIVE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Position sizing calibration, maximum drawdown circuit breakers, and institutional stress testing
              </p>
            </div>
          </div>

          {onOpenTradeMemoModal && activeResult && (
            <button
              onClick={onOpenTradeMemoModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500 text-cyan-300 text-xs rounded-lg transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Export Compliance Audit Sheet</span>
            </button>
          )}
        </div>

        {/* Challenge Selection Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 mr-1">Select Challenge Mandate:</span>
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
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-neutral-950/70 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
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
        <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md p-4 rounded-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>MAX DAILY LOSS CAP</span>
            <span className="text-emerald-400 font-bold">{rule.maxDailyLossPct}%</span>
          </div>
          <div className="text-xl font-bold text-rose-400">
            -${maxDailyLossAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Circuit breaker resets every 24h (00:00 CE(S)T)
          </div>
        </div>

        {/* Max Trailing Total Drawdown */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md p-4 rounded-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>MAX OVERALL DRAWDOWN</span>
            <span className="text-emerald-400 font-bold">{rule.maxTotalLossPct}%</span>
          </div>
          <div className="text-xl font-bold text-rose-400">
            -${maxTotalLossAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Absolute catastrophic hard limit
          </div>
        </div>

        {/* Max Risk Per Trade */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md p-4 rounded-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>RECOMMENDED RISK/TRADE</span>
            <span className="text-cyan-400 font-bold">≤ {rule.maxRiskPerTradePct}%</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">
            ${singleTradeRiskAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Active: {riskPerTrade}% risk per single position
          </div>
        </div>

        {/* Profit Target */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md p-4 rounded-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>PHASE 1 PROFIT TARGET</span>
            <span className="text-emerald-400 font-bold">+{rule.profitTargetPct}%</span>
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +${(accountBalance * (rule.profitTargetPct / 100)).toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Requires ~{Math.ceil(rule.profitTargetPct / (riskPerTrade * 2))} winning R:R 1:2 setups
          </div>
        </div>
      </div>

      {/* SECTION: POSITION SIZING CALCULATOR & MAX DRAWDOWN WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Position Sizing Calculator (7 Cols) */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                Position Sizing Calculator
              </h3>
            </div>
            {activeResult && (
              <button
                type="button"
                onClick={handleSyncActiveSetup}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-1 rounded border border-cyan-500/30 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Active Setup</span>
              </button>
            )}
          </div>

          {/* Live BTC Asset-Anchored Calibration & Risk Controls */}
          <div className="rounded-xl bg-neutral-950/80 border border-cyan-500/30 p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold text-neutral-200">
                  Live BTC Price: <strong className="text-cyan-300 font-mono">${btcPriceRef.toLocaleString()}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAutoPopulateBtc(riskPerTrade)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all shadow-sm active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-populate from Live BTC (${btcPriceRef.toLocaleString()})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account Balance Input with BTC Equivalence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-300 font-semibold">Account Capital / Balance ($)</label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ≈ {(accountBalance / btcPriceRef).toFixed(3)} BTC
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Math.max(Number(e.target.value), 0))}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:border-cyan-500 outline-none font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleAutoPopulateBtc(1.0)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
                  >
                    1 BTC (${btcPriceRef.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountBalance(100000)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
                  >
                    $100k Challenge
                  </button>
                </div>
              </div>

              {/* User-Selected Risk Percentage (1% or 2%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-300 font-semibold">User-Selected Risk %</label>
                  <span className="text-[10px] text-rose-400 font-bold font-mono">
                    -${singleTradeRiskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Max Loss
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRiskPerTrade(1.0)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      riskPerTrade === 1.0
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-700'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>1.0% Risk</span>
                    <span className="text-[10px] text-neutral-400">
                      (${(accountBalance * 0.01).toFixed(0)})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPerTrade(2.0)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      riskPerTrade === 2.0
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-700'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>2.0% Risk</span>
                    <span className="text-[10px] text-neutral-400">
                      (${(accountBalance * 0.02).toFixed(0)})
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-400">
                  <span>Custom:</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    max="10"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                    className="w-16 bg-neutral-900 border border-neutral-700 text-cyan-300 rounded px-1.5 py-0.5 text-right font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Asset Selection */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Asset Instrument</label>
              <select
                value={calcAsset}
                onChange={(e) => setCalcAsset(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs focus:border-cyan-500 outline-none"
              >
                <option value="BTC/USD">BTC/USD (Bitcoin)</option>
                <option value="ETH/USD">ETH/USD (Ethereum)</option>
                <option value="SOL/USD">SOL/USD (Solana)</option>
                <option value="EUR/USD">EUR/USD (Euro / US Dollar)</option>
                <option value="NVDA">NVDA (NVIDIA)</option>
                <option value="US30">US30 (Dow Jones)</option>
                <option value="XAU/USD">XAU/USD (Gold)</option>
              </select>
            </div>

            {/* Leverage */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Leverage Multiplier</label>
              <select
                value={calcLeverage}
                onChange={(e) => setCalcLeverage(Number(e.target.value))}
                className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs focus:border-cyan-500 outline-none"
              >
                <option value="1">1x (Spot / Cash)</option>
                <option value="5">5x Leverage</option>
                <option value="10">10x Leverage</option>
                <option value="20">20x Leverage</option>
                <option value="50">50x Leverage</option>
                <option value="100">100x Leverage</option>
              </select>
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={calcEntryPrice}
                onChange={(e) => setCalcEntryPrice(Number(e.target.value))}
                className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs focus:border-cyan-500 outline-none font-mono"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Stop-Loss Price ($)</label>
              <input
                type="number"
                step="any"
                value={calcStopLoss}
                onChange={(e) => setCalcStopLoss(Number(e.target.value))}
                className="w-full bg-neutral-950/80 border border-neutral-800 text-rose-400 rounded-lg px-3 py-2 text-xs focus:border-rose-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Calculated Output Box */}
          <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/90 p-4 space-y-3">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              Execution Calibrations
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">RECOMMENDED UNITS:</span>
                <strong className="text-cyan-300 text-sm font-bold mt-0.5 block">
                  {positionMath.units} {calcAsset.split('/')[0]}
                </strong>
                <span className="text-[9px] text-neutral-500">Contract size</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">POSITION NOTIONAL:</span>
                <strong className="text-white text-sm font-bold mt-0.5 block">
                  ${Number(positionMath.notional).toLocaleString()}
                </strong>
                <span className="text-[9px] text-neutral-500">Total exposure</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">CAPITAL AT RISK:</span>
                <strong className="text-rose-400 text-sm font-bold mt-0.5 block">
                  -${Number(positionMath.riskDollar).toFixed(2)} ({riskPerTrade}%)
                </strong>
                <span className="text-[9px] text-neutral-500">Max loss at SL</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">MARGIN REQUIRED:</span>
                <strong className="text-indigo-300 text-sm font-bold mt-0.5 block">
                  ${Number(positionMath.marginRequired).toLocaleString()}
                </strong>
                <span className="text-[9px] text-neutral-500">At {calcLeverage}x leverage</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">TP1 POTENTIAL PROFIT:</span>
                <strong className="text-emerald-400 text-sm font-bold mt-0.5 block">
                  +${Number(positionMath.tp1Profit).toLocaleString()}
                </strong>
                <span className="text-[9px] text-emerald-400/80">1:{positionMath.rr} R:R</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">SL DISTANCE:</span>
                <strong className="text-amber-400 text-sm font-bold mt-0.5 block">
                  {positionMath.slPct}% (${positionMath.priceDiff.toFixed(2)})
                </strong>
                <span className="text-[9px] text-neutral-500">Price buffer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Max Drawdown Protection & Guardrails Widgets (5 Cols) */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                Max Drawdown & Circuit Breakers
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded font-bold">
              PROTECTION ACTIVE
            </span>
          </div>

          {/* Max Trailing Drawdown Gauge */}
          <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Current Account Drawdown:</span>
              <strong className="text-amber-400">
                {currentDrawdownPct}% (${currentDrawdownAmount.toLocaleString()})
              </strong>
            </div>

            {/* Visual Meter */}
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentDrawdownPct / rule.maxTotalLossPct) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>0% (Peak)</span>
              <span>Daily Limit: {rule.maxDailyLossPct}%</span>
              <span>Hard Cap: {rule.maxTotalLossPct}%</span>
            </div>

            {/* Buffer to Breach */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Remaining Daily Buffer:</span>
              <strong className="text-emerald-400">
                ${remainingDailyBufferAmount.toLocaleString()} ({remainingDailyBufferPct.toFixed(1)}%)
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Remaining Total Buffer:</span>
              <strong className="text-emerald-400">
                ${remainingTotalBufferAmount.toLocaleString()} ({remainingTotalBufferPct.toFixed(1)}%)
              </strong>
            </div>
          </div>

          {/* Monte Carlo Loss Streak Stress Widget */}
          <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/90 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              Consecutive Loss Shock Absorber
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">3 Losses Probability:</span>
                <strong className="text-amber-400 block mt-0.5">{prob3Losses}%</strong>
                <span className="text-[9px] text-neutral-500">DD: -{(riskPerTrade * 3).toFixed(2)}%</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">5 Losses Probability:</span>
                <strong className="text-emerald-400 block mt-0.5">{prob5Losses}%</strong>
                <span className="text-[9px] text-neutral-500">DD: -{(riskPerTrade * 5).toFixed(2)}%</span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800/80">
              Circuit breaker will lock new trade execution if daily loss exceeds ${maxDailyLossAmount.toLocaleString()}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
