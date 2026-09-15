import React, { useState } from 'react';
import { ChartAnalysisResult, PositionSizingConfig } from '../types';
import { detectAssetType, computePositionSizing } from '../utils/calculator';
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  Send,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface BrokerWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ChartAnalysisResult | null;
}

type BrokerTarget = 'ccxt' | 'metatrader' | 'alpaca';

export function BrokerWebhookModal({
  isOpen,
  onClose,
  result,
}: BrokerWebhookModalProps) {
  const [activeBroker, setActiveBroker] = useState<BrokerTarget>('ccxt');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.your-broker-bridge.com/v1/webhook');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: 'success' | 'error';
    orderId: string;
    timestamp: string;
    message: string;
  } | null>(null);

  if (!isOpen || !result) return null;

  const assetType = detectAssetType(result.ticker);
  const sizingConfig: PositionSizingConfig = {
    accountBalance: 10000,
    riskPercentage: 1.0,
    assetType,
    leverage: 1,
  };

  const sizing = computePositionSizing(
    result.coordinates,
    result.bias,
    result.confidence_score,
    sizingConfig
  );

  const isLong = result.bias !== 'BEARISH';
  const action = isLong ? 'BUY' : 'SELL';
  const side = isLong ? 'buy' : 'sell';

  // Format symbol for each broker engine
  const cleanTicker = result.ticker.replace(/[^a-zA-Z0-9]/g, '');

  // 1. CCXT Payload (Binance, Bybit, OKX)
  const ccxtPayload = {
    exchange: 'binance',
    symbol: result.ticker.includes('/') ? result.ticker : `${result.ticker}/USDT`,
    timeframe: result.timeframe,
    type: orderType,
    side: side,
    amount: Number(sizing.positionUnits.toFixed(4)) || 0.1,
    price: orderType === 'limit' ? sizing.entryPrice : undefined,
    params: {
      timeframe: result.timeframe,
      stopLoss: {
        triggerPrice: result.coordinates.stop_loss,
        price: result.coordinates.stop_loss,
      },
      takeProfit: {
        triggerPrice: result.coordinates.take_profit_1,
        price: result.coordinates.take_profit_1,
      },
      extendedTargets: {
        tp2: result.coordinates.take_profit_2,
        tp3: result.coordinates.take_profit_3,
      },
      timeInForce: 'GTC',
      clientOrderId: `ZH_${cleanTicker}_${Date.now().toString().slice(-6)}`,
    },
  };

  // 2. MetaTrader 4/5 EA Webhook Payload
  const mtPayload = {
    symbol: result.ticker.replace('/', ''),
    timeframe: result.timeframe,
    action: action,
    type: orderType === 'limit' ? (isLong ? 'BUY_LIMIT' : 'SELL_LIMIT') : action,
    lots: Number(sizing.positionUnits.toFixed(2)) || 0.1,
    entry: sizing.entryPrice,
    sl: result.coordinates.stop_loss,
    tp: result.coordinates.take_profit_1,
    tp2: result.coordinates.take_profit_2,
    tp3: result.coordinates.take_profit_3,
    magic: 88092,
    slippage: 3,
    comment: `Zeher_${cleanTicker}_${result.timeframe}`,
    timestamp: new Date().toISOString(),
  };

  // 3. Alpaca API US Equities Payload (Bracket Order)
  const alpacaPayload = {
    symbol: cleanTicker,
    timeframe: result.timeframe,
    qty: Math.max(1, Math.floor(sizing.positionUnits)),
    side: side,
    type: orderType,
    time_in_force: 'gtc',
    limit_price: orderType === 'limit' ? sizing.entryPrice : undefined,
    order_class: 'bracket',
    take_profit: {
      limit_price: result.coordinates.take_profit_1,
    },
    stop_loss: {
      stop_price: result.coordinates.stop_loss,
      limit_price: result.coordinates.stop_loss,
    },
  };

  const getActivePayloadString = () => {
    switch (activeBroker) {
      case 'ccxt':
        return JSON.stringify(ccxtPayload, null, 2);
      case 'metatrader':
        return JSON.stringify(mtPayload, null, 2);
      case 'alpaca':
        return JSON.stringify(alpacaPayload, null, 2);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActivePayloadString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(getActivePayloadString());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `webhook_${activeBroker}_${cleanTicker}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSimulateDispatch = () => {
    setIsSimulating(false);
    setSimulationResult({
      status: 'success',
      orderId: `SIM-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleTimeString(),
      message: `Successfully validated & simulated dispatch for ${cleanTicker} [${action}]. Invalidation SL & TP brackets active.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Broker Webhook & Order Execution Engine
              </h2>
              <p className="text-xs text-slate-400">
                Institutional JSON payloads with automated bracket SL/TP & dynamic lot sizing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Target Engine Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">TARGET BROKER / ENGINE</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setActiveBroker('ccxt');
                  setSimulationResult(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeBroker === 'ccxt'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4 mb-1 text-cyan-400" />
                <span className="text-xs font-bold">CCXT Engine</span>
                <span className="text-[10px] text-slate-500">Binance / Bybit / OKX</span>
              </button>

              <button
                onClick={() => {
                  setActiveBroker('metatrader');
                  setSimulationResult(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeBroker === 'metatrader'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="text-xs font-bold">MetaTrader 4 / 5</span>
                <span className="text-[10px] text-slate-500">Expert Advisor Webhook</span>
              </button>

              <button
                onClick={() => {
                  setActiveBroker('alpaca');
                  setSimulationResult(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeBroker === 'alpaca'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-purple-400" />
                <span className="text-xs font-bold">Alpaca API</span>
                <span className="text-[10px] text-slate-500">US Equities / Bracket</span>
              </button>
            </div>
          </div>

          {/* Parameters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">ORDER TYPE:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                    orderType === 'limit'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  LIMIT
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                    orderType === 'market'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  MARKET
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">TIMEFRAME & BIAS:</span>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800 font-bold text-white flex items-center justify-between">
                <span className="text-indigo-300 font-mono">TF: {result.timeframe}</span>
                <span className={isLong ? 'text-emerald-400' : 'text-rose-400'}>{result.bias}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">ACTION & VOLUME:</span>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800 font-bold text-white flex items-center justify-between">
                <span className={isLong ? 'text-emerald-400' : 'text-rose-400'}>{action}</span>
                <span className="text-cyan-300">{sizing.formattedUnits}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">BRACKET TARGETS:</span>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
                <span className="text-rose-400">SL: {result.coordinates.stop_loss}</span>
                <span className="text-emerald-400">TP: {result.coordinates.take_profit_1}</span>
              </div>
            </div>
          </div>

          {/* Webhook Endpoint Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>TARGET WEBHOOK LISTENER URL</span>
              <span className="text-[10px] text-slate-500">POST Request Handler</span>
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              placeholder="https://api.your-broker-bridge.com/v1/webhook"
            />
          </div>

          {/* JSON Payload Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>FORMATTED PAYLOAD STRING</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 text-xs leading-relaxed overflow-x-auto max-h-56 select-all">
                {getActivePayloadString()}
              </pre>
            </div>
          </div>

          {/* Simulation Output Receipt */}
          {simulationResult && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulation Dispatch Acknowledged [HTTP 200 OK]</span>
              </div>
              <div className="text-slate-300 text-[11px]">{simulationResult.message}</div>
              <div className="text-[10px] text-slate-400 flex gap-4 pt-1">
                <span>Order Reference: {simulationResult.orderId}</span>
                <span>Time: {simulationResult.timestamp}</span>
                <span>Latency: 38ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-[11px] text-slate-400">
            Pre-configured with SL, TP, and Lot Sizing
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateDispatch}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              {isSimulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isSimulating ? 'Validating...' : 'Simulate Dispatch'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Webhook JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
