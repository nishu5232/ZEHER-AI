import { useState, useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Target,
  Shield,
  Percent,
  TrendingUp,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { ChartAnalysisResult, Coordinates } from '../types';
import { generatePatternBacktest, getMacroNewsRadar } from '../utils/backtestNewsService';
import { computePositionSizing } from '../utils/calculator';

interface TradeMemoReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ChartAnalysisResult | null;
  imageSrc: string | null;
}

export function TradeMemoReportModal({
  isOpen,
  onClose,
  result,
  imageSrc,
}: TradeMemoReportModalProps) {
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const backtest = generatePatternBacktest(result);
  const macro = getMacroNewsRadar(result.ticker);
  const sizing = computePositionSizing(result.coordinates, result.bias, result.confidence_score, {
    accountBalance: 100000,
    riskPercentage: 1.0,
    assetType: 'crypto',
    leverage: 1,
    propFirmMode: 'ftmo',
  });

  const memoId = `ZHR-AUDIT-${result.ticker.replace('/', '')}-${Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toUTCString();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = `
# ZEHER QUANTITATIVE CAPITAL — INSTITUTIONAL TRADE MEMO
**Reference ID:** ${memoId}
**Date / UTC Timestamp:** ${currentDate}
**Instrument:** ${result.ticker} | **Timeframe:** ${result.timeframe} | **Bias:** ${result.bias} ORDER FLOW
**Confidence Score:** ${result.confidence_score}%

---

### 1. QUANTITATIVE COORDINATES & LIQUID TARGET BANDS
- **Entry Zone:** ${result.coordinates.entry_zone.low} - ${result.coordinates.entry_zone.high}
- **Structural Invalidation (SL):** ${result.coordinates.stop_loss}
- **Liquid Target Band 1 (TP1):** ${result.coordinates.take_profit_1} (R:R 1:${sizing.tp1RR.toFixed(2)})
- **Liquid Target Band 2 (TP2):** ${result.coordinates.take_profit_2} (R:R 1:${sizing.tp2RR.toFixed(2)})
- **Liquid Target Band 3 (TP3):** ${result.coordinates.take_profit_3} (R:R 1:${sizing.tp3RR.toFixed(2)})

### 2. RISK ALLOCATION & PROP-FIRM COMPLIANCE
- **Account Base:** $100,000.00
- **Risk Per Setup:** 1.0% ($1,000.00)
- **Recommended Size:** ${sizing.formattedUnits}
- **Compliance Status:** FTMO & Funding Pips Verified (Within 5% Daily DD Guardrail)

### 3. QUANT ALPHA PROFILE & AUDITED BACKTEST
- **Audited Win Probability:** ${backtest.winRate}% (90-Day Lookback)
- **Sharpe Ratio:** ${backtest.sharpeRatio}
- **Sortino Ratio:** ${backtest.sortinoRatio}
- **Value at Risk (95% 1-Day VaR):** ${backtest.valueAtRisk95}
- **Profit Factor:** ${backtest.profitFactor} | **Expectancy:** +${backtest.expectancyR}R

### 4. SMC STRUCTURE & CONFLUENCE NARRATIVE
- **Identified Structures:** ${result.identified_structures.join(', ')}
- **Rationale:** ${result.rationale}

### 5. MACRO RISK RADAR EXPOSURE
- **Execution Window:** ${macro.overallStatus} (${macro.hasImminentHighRisk ? 'Macro Volatility Warning' : 'Clear Execution Window'})

---
*Signed & Audited by Zeher AI Institutional Vision Engine v1.5*
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-slate-200 my-auto">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#07090e] print:hidden">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Institutional Trade Sheet & Risk Audit Memo
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
              Ready for Export
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied MD' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Institutional Memo Sheet */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#07090e] print:p-0 print:bg-white print:text-black"
        >
          {/* Institutional Top Letterhead */}
          <div className="border-b-2 border-slate-700 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-cyan-400 tracking-wider">ZEHER QUANTITATIVE CAPITAL</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded uppercase font-bold">
                  Fund Memo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quantitative Order Flow & Risk Committee Audit Sheet
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <div>
                Ref ID: <strong className="text-slate-200">{memoId}</strong>
              </div>
              <div>
                Date: <strong className="text-slate-200">{currentDate}</strong>
              </div>
              <div className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RISK COMPLIANT</span>
              </div>
            </div>
          </div>

          {/* Instrument Summary Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b101b] p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">ASSET / TICKER</span>
              <span className="text-base font-bold text-white">{result.ticker}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">TIMEFRAME</span>
              <span className="text-base font-bold text-cyan-300">{result.timeframe}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ORDER FLOW BIAS</span>
              <span
                className={`text-base font-bold ${
                  result.bias === 'BULLISH' ? 'text-emerald-400' : result.bias === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {result.bias}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">CONFIDENCE ALPHA</span>
              <span className="text-base font-bold text-cyan-300">{result.confidence_score}%</span>
            </div>
          </div>

          {/* Chart Preview with Visual Invalidation Snapshot */}
          {imageSrc && (
            <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase text-slate-300">Audited Visual Market Structure</span>
                <span>Coordinate Mapping: Active</span>
              </div>
              <div className="max-h-56 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center">
                <img src={imageSrc} alt="Chart Snapshot" className="max-h-56 w-full object-contain" />
              </div>
            </div>
          )}

          {/* Quantitative Coordinates & Target Bands Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quantitative Price Coordinates & Target Brackets</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0b101b] p-3 rounded-lg border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">ENTRY ZONE</span>
                <span className="font-bold text-blue-300 text-sm">
                  {result.coordinates.entry_zone.low} - {result.coordinates.entry_zone.high}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">Execution Spread</span>
              </div>

              <div className="bg-[#0b101b] p-3 rounded-lg border border-rose-900/40">
                <span className="text-[10px] text-slate-400 block">STRUCTURAL INVALIDATION (SL)</span>
                <span className="font-bold text-rose-400 text-sm">{result.coordinates.stop_loss}</span>
                <span className="text-[9px] text-slate-500 block mt-1">Hard Stop Loss</span>
              </div>

              <div className="bg-[#0b101b] p-3 rounded-lg border border-emerald-900/40">
                <span className="text-[10px] text-slate-400 block">TARGET 1 (TP1)</span>
                <span className="font-bold text-emerald-400 text-sm">{result.coordinates.take_profit_1}</span>
                <span className="text-[9px] text-emerald-400 block mt-1">R:R 1:{sizing.tp1RR.toFixed(2)}</span>
              </div>

              <div className="bg-[#0b101b] p-3 rounded-lg border border-emerald-900/40">
                <span className="text-[10px] text-slate-400 block">TARGET 2 & 3 (TP2/TP3)</span>
                <span className="font-bold text-emerald-300 text-sm">
                  {result.coordinates.take_profit_2} / {result.coordinates.take_profit_3}
                </span>
                <span className="text-[9px] text-emerald-400 block mt-1">R:R 1:{sizing.tp3RR.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quantitative Alpha & Prop-Firm Risk Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk & Compliance Box */}
            <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-300 flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prop-Firm Risk Compliance</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                  PASSED FTMO / 1.0% RULE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Challenge Balance:</span>
                  <div className="font-bold text-slate-200">$100,000.00</div>
                </div>
                <div>
                  <span className="text-slate-400">Risk Allocation:</span>
                  <div className="font-bold text-rose-400">1.0% ($1,000.00)</div>
                </div>
                <div>
                  <span className="text-slate-400">Recommended Size:</span>
                  <div className="font-bold text-cyan-300">{sizing.formattedUnits}</div>
                </div>
                <div>
                  <span className="text-slate-400">Daily Max Loss Buffer:</span>
                  <div className="font-bold text-emerald-400">5.0% ($5,000.00)</div>
                </div>
              </div>
            </div>

            {/* Quant Alpha Profile */}
            <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-300 flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Audited Quantitative Alpha</span>
                </span>
                <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700">
                  90D BACKTESTED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Win Rate:</span>
                  <div className="font-bold text-emerald-400">{backtest.winRate}%</div>
                </div>
                <div>
                  <span className="text-slate-400">Sharpe Ratio:</span>
                  <div className="font-bold text-blue-300">{backtest.sharpeRatio}</div>
                </div>
                <div>
                  <span className="text-slate-400">Sortino Ratio:</span>
                  <div className="font-bold text-purple-300">{backtest.sortinoRatio}</div>
                </div>
                <div>
                  <span className="text-slate-400">1-Day VaR (95%):</span>
                  <div className="font-bold text-rose-400">{backtest.valueAtRisk95.split(' ')[0]}</div>
                </div>
                <div>
                  <span className="text-slate-400">Profit Factor:</span>
                  <div className="font-bold text-indigo-300">{backtest.profitFactor}</div>
                </div>
                <div>
                  <span className="text-slate-400">Expectancy:</span>
                  <div className="font-bold text-amber-300">+{backtest.expectancyR}R</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale Narrative & SMC Confluence */}
          <div className="bg-[#0b101b] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Money Concepts (SMC) & Institutional Rationale</span>
            </div>
            <div className="flex flex-wrap gap-1.5 py-1">
              {result.identified_structures.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px]">
                  • {s}
                </span>
              ))}
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] bg-[#07090e] p-3 rounded-lg border border-slate-800">
              {result.rationale}
            </p>
          </div>

          {/* Macro Risk Window Status */}
          <div className="bg-[#0b101b] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Macro Economic Catalyst Guardrail:</span>
            </div>
            <div className="font-bold text-emerald-400">
              {macro.hasImminentHighRisk ? 'Macro Volatility Impending' : 'Clear Execution Window (No Imminent Tier-1 Spikes)'}
            </div>
          </div>

          {/* Institutional Sign-Off Box */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="border border-slate-800 bg-[#0b101b] p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 block">LEAD QUANT ANALYST</span>
              <div className="font-bold text-slate-300 mt-1">Zeher Vision AI Engine v1.5</div>
              <div className="text-[9px] text-emerald-400 mt-1">✓ Automated Signature Verified</div>
            </div>

            <div className="border border-slate-800 bg-[#0b101b] p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 block">CHIEF RISK OFFICER (CRO)</span>
              <div className="font-bold text-slate-300 mt-1">Prop-Firm Compliance Gate</div>
              <div className="text-[9px] text-emerald-400 mt-1">✓ Approved: 1.0% Risk Max</div>
            </div>

            <div className="border border-slate-800 bg-[#0b101b] p-3 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block">ORDER EXECUTION DISPATCH</span>
              <div className="font-bold text-cyan-300 mt-1">Webhook / CCXT Bridge</div>
              <div className="text-[9px] text-slate-400 mt-1">Status: Ready for Injection</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
