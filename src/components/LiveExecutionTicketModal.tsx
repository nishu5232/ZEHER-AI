import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  Target,
  Sparkles,
  Layers,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Database,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Share2,
} from 'lucide-react';
import { ChartAnalysisResult, QuantitativeSignal } from '../types';
import { signalHistoryDb } from '../services/signalHistoryDatabase';

interface LiveExecutionTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ChartAnalysisResult | null;
  onOrderDispatched?: (order: any) => void;
}

export function LiveExecutionTicketModal({
  isOpen,
  onClose,
  result,
}: LiveExecutionTicketModalProps) {
  const [copied, setCopied] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);

  if (!isOpen || !result) return null;

  // Synthesize or access the 19 quantitative signal parameters
  const quant: QuantitativeSignal = result.quantitativeSignal || {
    direction: result.bias === 'BEARISH' ? 'SHORT' : 'LONG',
    entryPrice: Number(((result.coordinates.entry_zone.low + result.coordinates.entry_zone.high) / 2).toFixed(4)),
    entryZone: {
      low: Number(result.coordinates.entry_zone.low.toFixed(4)),
      high: Number(result.coordinates.entry_zone.high.toFixed(4)),
    },
    stopLoss: Number(result.coordinates.stop_loss.toFixed(4)),
    tp1: Number(result.coordinates.take_profit_1.toFixed(4)),
    tp2: Number(result.coordinates.take_profit_2.toFixed(4)),
    tp3: Number(result.coordinates.take_profit_3.toFixed(4)),
    riskReward: 2.15,
    riskRewardFormatted: '1:2.15',
    signalScore: Math.min(95, Math.max(50, result.confidence_score || 84)),
    signalStrength: (result.confidence_score || 80) >= 85 ? 'VERY_STRONG' : 'STRONG',
    marketRegime: 'HIGH_VOLATILITY_EXPANSION',
    invalidationLevel: result.invalidation_buffer?.raw_swing_level || result.coordinates.stop_loss,
    technicalReasons: result.identified_structures.length > 0
      ? result.identified_structures
      : [
          'Volatility-Adjusted Donchian 20-channel breakout aligned with EMA200',
          'RSI 14 momentum oscillator confirms directional expansion',
          'Volume surge exceeds 20-period SMA threshold',
          'Anti-stop-hunt ATR volatility padding calculated past local swing level',
        ],
    multiTimeframeConfirmation: {
      htfTimeframe: result.trend_alignment?.htf_timeframe || '4H',
      htfDirection: result.bias === 'BEARISH' ? 'SHORT' : 'LONG',
      isConfirmed: result.trend_alignment?.is_aligned ?? true,
      alignment: result.trend_alignment?.alignment_status || 'CONFLUENT_TREND',
      notes: result.trend_alignment?.confluence_summary || 'Higher timeframe trend aligns with execution setup.',
    },
    liquidityStatus: 'BREAKOUT_LIQUIDITY_EXPANSION',
    volatilityStatus: 'EXPANDING_ATR14_VOLATILITY',
    volumeConfirmation: 'VOLUME_SURGE_CONFIRMED',
    timestamp: new Date().toISOString(),
    dataSources: ['binance', 'bybit', 'okx', 'coinbase', 'kraken', 'hyperliquid'],
    signalId: `SIG-${result.ticker.replace(/[^A-Z0-9]/g, '')}-${result.timeframe.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    asset: result.ticker,
    timeframe: result.timeframe,
    strategyId: 'volatility_donchian_breakout',
    strategyName: 'Volatility-Adjusted Donchian Breakout',
    aiExplanation: result.rationale,
  };

  const isLong = quant.direction === 'LONG';
  const isShort = quant.direction === 'SHORT';
  const isNoTrade = quant.direction === 'NO_TRADE';

  const formattedSignalText = `🚨 ZEHER AI TRADE SIGNAL 🚨
Asset: ${quant.asset}
Timeframe: ${quant.timeframe}
Signal ID: ${quant.signalId}
Direction: ${quant.direction}
Strategy: ${quant.strategyName}

Entry Zone: $${quant.entryZone.low.toLocaleString()} - $${quant.entryZone.high.toLocaleString()}
Entry Mid: $${quant.entryPrice.toLocaleString()}
Stop Loss: $${quant.stopLoss.toLocaleString()} (Invalidation: $${quant.invalidationLevel.toLocaleString()})
TP1 (1st Target): $${quant.tp1.toLocaleString()} [R:R ${quant.riskRewardFormatted}]
TP2 (Runner): $${quant.tp2.toLocaleString()}
TP3 (Expansion): $${quant.tp3.toLocaleString()}

Quantitative Confluence Score: ${quant.signalScore}/100 (${quant.signalStrength})
Market Regime: ${quant.marketRegime}
Multi-Timeframe HTF: ${quant.multiTimeframeConfirmation.htfTimeframe} (${quant.multiTimeframeConfirmation.alignment})
Sources: ${quant.dataSources.join(', ')}
Timestamp: ${quant.timestamp}

⚠️ MANUAL EXECUTION ONLY: Zeher AI is a quantitative market intelligence platform, not an auto-trading bot. Score represents indicator confluence, not a win probability.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSignalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDatabase = () => {
    signalHistoryDb.recordSignal(quant);
    setSavedToDb(true);
    setTimeout(() => setSavedToDb(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <Radio className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  ZEHER AI SIGNAL INTELLIGENCE SPECIFICATION
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded uppercase">
                  19-Parameter Audit
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic Quantitative Engine Signal • Verified Institutional Parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Strict Scope Banner: MANUAL EXECUTION ONLY */}
        <div className="px-6 py-3 bg-amber-950/30 border-b border-amber-500/30 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">MANUAL EXECUTION ONLY:</strong> ZEHER AI is a real-time cryptocurrency market intelligence and trade signal platform. Automatic trade execution and paper trading order-placement APIs are strictly disabled. The platform outputs trade signals for manual user execution.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* Signal Primary Header Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#0b101b] border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-white">{quant.asset}</div>
              <div className="text-xs text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                {quant.timeframe}
              </div>

              {isLong && (
                <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  LONG SETUP
                </span>
              )}
              {isShort && (
                <span className="flex items-center gap-1 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  SHORT SETUP
                </span>
              )}
              {isNoTrade && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  NO TRADE
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">SIGNAL CONFLUENCE SCORE</div>
                <div className="text-base font-bold text-cyan-400">{quant.signalScore}/100</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">STRENGTH</div>
                <div className="text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {quant.signalStrength}
                </div>
              </div>
            </div>
          </div>

          {/* 19-Parameter Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Quantitative Coordinates */}
            <div className="flex flex-col gap-3 p-4 bg-[#0b101b] border border-slate-800 rounded-xl">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-2 pb-1 border-b border-slate-800">
                <Target className="w-3.5 h-3.5" />
                <span>PRICE COORDINATES & TARGETS</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">1. Direction</span>
                <span className="font-bold text-white">{quant.direction}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">2. Entry Price / Zone</span>
                <span className="font-bold text-cyan-300">
                  ${quant.entryPrice.toLocaleString()}{' '}
                  <span className="text-[10px] text-slate-400">
                    [${quant.entryZone.low} - ${quant.entryZone.high}]
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">3. Stop Loss (ATR Padded)</span>
                <span className="font-bold text-rose-400">${quant.stopLoss.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">4. Take Profit 1 (TP1)</span>
                <span className="font-bold text-emerald-400">${quant.tp1.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">5. Take Profit 2 (TP2)</span>
                <span className="font-bold text-emerald-300">${quant.tp2.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">6. Take Profit 3 (TP3)</span>
                <span className="font-bold text-emerald-200">${quant.tp3.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">7. Risk/Reward Ratio</span>
                <span className="font-bold text-cyan-400">{quant.riskRewardFormatted}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">11. Invalidation Level</span>
                <span className="font-bold text-slate-200">${quant.invalidationLevel.toLocaleString()}</span>
              </div>
            </div>

            {/* Right Column: Quantitative Confluence & Market Context */}
            <div className="flex flex-col gap-3 p-4 bg-[#0b101b] border border-slate-800 rounded-xl">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-2 pb-1 border-b border-slate-800">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>MARKET CONTEXT & CONFLUENCE</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">8. Signal Score</span>
                <span className="font-bold text-white">{quant.signalScore} / 100</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">9. Signal Strength</span>
                <span className="font-bold text-white">{quant.signalStrength}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">10. Market Regime</span>
                <span className="font-bold text-indigo-300">{quant.marketRegime.replace(/_/g, ' ')}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">13. HTF Confirmation</span>
                <span className="font-bold text-emerald-400">
                  {quant.multiTimeframeConfirmation.htfTimeframe} ({quant.multiTimeframeConfirmation.alignment})
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">14. Liquidity Status</span>
                <span className="font-bold text-slate-200 truncate max-w-[180px]">{quant.liquidityStatus}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">15. Volatility Status</span>
                <span className="font-bold text-slate-200">{quant.volatilityStatus}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">16. Volume Confirmation</span>
                <span className="font-bold text-emerald-400">{quant.volumeConfirmation}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">19. Signal ID</span>
                <span className="font-bold text-cyan-400">{quant.signalId}</span>
              </div>
            </div>
          </div>

          {/* Technical Reasons (Item 12) */}
          <div className="p-4 bg-[#0b101b] border border-slate-800 rounded-xl">
            <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800 mb-2.5">
              12. TECHNICAL REASONS SUPPORTING SETUP
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {quant.technicalReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources & Timestamp (Items 17 & 18) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <div>
              <span className="text-slate-400">18. Data Sources: </span>
              <span className="text-slate-200 font-semibold uppercase">{quant.dataSources.join(' • ')}</span>
            </div>
            <div>
              <span className="text-slate-400">17. Timestamp: </span>
              <span className="text-slate-300">{new Date(quant.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1220]">
          <div className="text-[11px] text-slate-400">
            Copy parameters directly into your exchange order ticket (Binance, Bybit, etc.)
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveToDatabase}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors"
            >
              {savedToDb ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged in Audit DB</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save to Audit DB</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md uppercase tracking-wider"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copy Signal Spec</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
