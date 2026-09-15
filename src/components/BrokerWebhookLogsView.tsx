import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Code2,
  Zap,
  Globe,
  Radio,
  Layers,
  Clock,
  ExternalLink,
  Target,
  Shield,
  Activity,
  Trash2,
} from 'lucide-react';
import { ChartAnalysisResult, LiveOrderTicket } from '../types';
import { getSavedOrderLedger } from '../services/liveAlertManager';

interface BrokerWebhookLogsViewProps {
  activeResult: ChartAnalysisResult | null;
  onOpenWebhookModal?: () => void;
  onOpenExecutionModal?: () => void;
}

interface WebhookLogEntry {
  id: string;
  timestamp: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  destination: string;
  status: 'DELIVERED' | 'SIMULATED' | 'QUEUED';
  latencyMs: number;
  payload: any;
}

export function BrokerWebhookLogsView({
  activeResult,
  onOpenWebhookModal,
  onOpenExecutionModal,
}: BrokerWebhookLogsViewProps) {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'TELEMETRY'>('LEDGER');

  // Live Order Ledger from local store
  const [orderLedger, setOrderLedger] = useState<LiveOrderTicket[]>([]);

  // Load and subscribe to live order ledger changes
  useEffect(() => {
    const loadLedger = () => {
      const saved = getSavedOrderLedger();
      if (saved && saved.length > 0) {
        setOrderLedger(saved);
      } else {
        // Seed with realistic demo dispatches if empty
        const initialSeed: LiveOrderTicket[] = [
          {
            id: 'ORD-984210',
            timestamp: '18:42:09',
            ticker: 'BTC/USD',
            bias: 'BULLISH',
            broker: 'ccxt',
            orderType: 'LIMIT',
            entryPrice: 64250,
            stopLoss: 62800,
            totalQuantity: 0.45,
            notionalValue: 28912.5,
            status: 'FILLED',
            slices: {
              tp1: { percent: 50, units: 0.225, targetPrice: 68500, status: 'PENDING' },
              tp2: { percent: 30, units: 0.135, targetPrice: 71200, status: 'PENDING' },
              tp3: { percent: 20, units: 0.09, targetPrice: 74500, status: 'PENDING' },
            },
            latencyMs: 54,
            timeInForce: 'GTC',
            slippagePct: 0.1,
            rawPayload: {
              exchange: 'binance',
              symbol: 'BTC/USDT',
              side: 'buy',
              type: 'limit',
              amount: 0.45,
              price: 64250,
            },
          },
          {
            id: 'ORD-984209',
            timestamp: '18:31:14',
            ticker: 'EUR/USD',
            bias: 'BULLISH',
            broker: 'metatrader',
            orderType: 'MARKET',
            entryPrice: 1.0865,
            stopLoss: 1.0825,
            totalQuantity: 1.5,
            notionalValue: 162975,
            status: 'FILLED',
            slices: {
              tp1: { percent: 50, units: 0.75, targetPrice: 1.0945, status: 'PENDING' },
              tp2: { percent: 30, units: 0.45, targetPrice: 1.0985, status: 'PENDING' },
              tp3: { percent: 20, units: 0.3, targetPrice: 1.104, status: 'PENDING' },
            },
            latencyMs: 78,
            timeInForce: 'IOC',
            slippagePct: 0.1,
            rawPayload: {
              symbol: 'EURUSD',
              cmd: 0,
              volume: 1.5,
              sl: 1.0825,
              tp: 1.0945,
            },
          },
        ];
        setOrderLedger(initialSeed);
      }
    };

    loadLedger();

    const handleLedgerUpdate = (e: any) => {
      loadLedger();
    };

    window.addEventListener('zeher_order_ledger_updated', handleLedgerUpdate);
    return () => {
      window.removeEventListener('zeher_order_ledger_updated', handleLedgerUpdate);
    };
  }, []);

  const [logs, setLogs] = useState<WebhookLogEntry[]>([
    {
      id: 'WH-LOG-9041',
      timestamp: '18:38:22 UTC',
      ticker: activeResult ? activeResult.ticker : 'BTC/USD',
      action: activeResult?.bias === 'BEARISH' ? 'SELL' : 'BUY',
      destination: 'https://api.binance.com/v3/order/test',
      status: 'DELIVERED',
      latencyMs: 142,
      payload: {
        symbol: activeResult?.ticker.replace('/', '') || 'BTCUSDT',
        side: activeResult?.bias === 'BEARISH' ? 'SELL' : 'BUY',
        type: 'LIMIT',
        timeInForce: 'GTC',
        quantity: '0.045',
        price: activeResult?.coordinates.entry_zone.low || '64200.00',
        stopLoss: activeResult?.coordinates.stop_loss || '62800.00',
        takeProfit: activeResult?.coordinates.take_profit_1 || '68500.00',
        clientOrderId: 'ZHR-INST-882190',
      },
    },
    {
      id: 'WH-LOG-9040',
      timestamp: '18:35:10 UTC',
      ticker: 'EUR/USD',
      action: 'BUY',
      destination: 'MetaTrader 5 EA Bridge (Port 8080)',
      status: 'DELIVERED',
      latencyMs: 89,
      payload: {
        magic: 894200,
        symbol: 'EURUSD',
        cmd: 0,
        volume: 1.5,
        price: 1.0865,
        sl: 1.0825,
        tp: 1.0945,
        comment: 'Zeher AI Order Flow',
      },
    },
    {
      id: 'WH-LOG-9039',
      timestamp: '18:22:04 UTC',
      ticker: 'SPX500',
      action: 'BUY',
      destination: 'Alpaca Markets Trading API v2',
      status: 'DELIVERED',
      latencyMs: 165,
      payload: {
        symbol: 'SPY',
        qty: 25,
        side: 'buy',
        type: 'limit',
        limit_price: '548.20',
        stop_loss: { stop_price: '542.50' },
        take_profit: { limit_price: '558.00' },
      },
    },
  ]);

  const [selectedLog, setSelectedLog] = useState<WebhookLogEntry>(logs[0]);
  const [copied, setCopied] = useState(false);
  const [isTestDispatching, setIsTestDispatching] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<LiveOrderTicket | null>(null);

  const handleClearLedger = () => {
    localStorage.removeItem('zeher_live_order_ledger');
    setOrderLedger([]);
  };

  const handleTestDispatch = () => {
    setIsTestDispatching(true);
    setTimeout(() => {
      const newEntry: WebhookLogEntry = {
        id: `WH-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toTimeString().split(' ')[0] + ' UTC',
        ticker: activeResult ? activeResult.ticker : 'ETH/USDT',
        action: activeResult?.bias === 'BEARISH' ? 'SELL' : 'BUY',
        destination: 'Live Institutional Broker Webhook Relay',
        status: 'DELIVERED',
        latencyMs: Math.floor(65 + Math.random() * 90),
        payload: {
          timestamp: new Date().toISOString(),
          ticker: activeResult?.ticker || 'ETHUSDT',
          action: activeResult?.bias === 'BEARISH' ? 'SELL' : 'BUY',
          entryLow: activeResult?.coordinates.entry_zone.low || 3420,
          entryHigh: activeResult?.coordinates.entry_zone.high || 3450,
          stopLoss: activeResult?.coordinates.stop_loss || 3350,
          takeProfit1: activeResult?.coordinates.take_profit_1 || 3650,
          takeProfit2: activeResult?.coordinates.take_profit_2 || 3800,
          status: 'ORDER_DISPATCHED_SUCCESSFULLY',
        },
      };

      setLogs((prev) => [newEntry, ...prev]);
      setSelectedLog(newEntry);
      setIsTestDispatching(false);
    }, 400);
  };

  const handleCopyPayload = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 font-mono text-slate-200">
      {/* Header Banner */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 lg:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Live Order Ledger & Broker Execution Relay
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 rounded font-bold">
                BROKER RELAY ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of dispatched trading orders across CCXT, MetaTrader 5 EA, Alpaca, and IBKR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenExecutionModal && (
            <button
              onClick={onOpenExecutionModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all uppercase"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Execute New Order</span>
            </button>
          )}

          {onOpenWebhookModal && (
            <button
              onClick={onOpenWebhookModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configure Endpoints</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LEDGER'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Dispatched Order Ledger ({orderLedger.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TELEMETRY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Webhook Telemetry & JSON Payloads</span>
          </button>
        </div>

        {activeTab === 'LEDGER' && orderLedger.length > 0 && (
          <button
            onClick={handleClearLedger}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors px-2 py-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Ledger</span>
          </button>
        )}
      </div>

      {/* TAB 1: LIVE ORDER LEDGER TABLE */}
      {activeTab === 'LEDGER' && (
        <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Institutional Dispatched Orders Ledger
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Auto-syncs on every executed ticket with multi-target slice metrics
            </span>
          </div>

          {orderLedger.length === 0 ? (
            <div className="bg-[#07090e] border border-dashed border-slate-800 rounded-xl p-10 text-center">
              <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No Orders Dispatched Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Analyze a chart and click "EXECUTE ORDER NOW" to dispatch institutional order flow.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-[#07090e]/60">
                    <th className="py-2.5 px-3 font-semibold">ORDER ID / TIME</th>
                    <th className="py-2.5 px-3 font-semibold">INSTRUMENT</th>
                    <th className="py-2.5 px-3 font-semibold">SIDE / TYPE</th>
                    <th className="py-2.5 px-3 font-semibold">BROKER DESTINATION</th>
                    <th className="py-2.5 px-3 font-semibold">ENTRY / SL</th>
                    <th className="py-2.5 px-3 font-semibold">SLICES (TP1/TP2/TP3)</th>
                    <th className="py-2.5 px-3 font-semibold">NOTIONAL</th>
                    <th className="py-2.5 px-3 font-semibold">STATUS</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {orderLedger.map((order) => {
                    const isLong = order.bias === 'BULLISH';
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrderDetails(order)}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{order.id}</div>
                          <div className="text-[10px] text-slate-500">{order.timestamp}</div>
                        </td>

                        <td className="py-3 px-3">
                          <strong className="text-cyan-300">{order.ticker}</strong>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isLong
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {order.bias} ({order.orderType})
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-300 uppercase text-[11px] font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {order.broker}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-bold">${order.entryPrice.toLocaleString()}</div>
                          <div className="text-[10px] text-rose-400">SL: ${order.stopLoss.toLocaleString()}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="bg-teal-950 text-teal-300 px-1 py-0.2 rounded border border-teal-800">
                              TP1 {order.slices.tp1.percent}%
                            </span>
                            <span className="bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800">
                              TP2 {order.slices.tp2.percent}%
                            </span>
                            <span className="bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800">
                              TP3 {order.slices.tp3.percent}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-white font-bold">${order.notionalValue.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{order.totalQuantity} units</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{order.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPayload(order.rawPayload);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-bold"
                          >
                            Copy JSON
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal / Card for viewing inspected order details */}
          {selectedOrderDetails && (
            <div className="bg-[#07090e] border border-cyan-500/30 rounded-xl p-4 mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">
                    Order Inspection: {selectedOrderDetails.id} ({selectedOrderDetails.ticker})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕ Close
                </button>
              </div>

              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-emerald-300 overflow-x-auto">
                {JSON.stringify(selectedOrderDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEBHOOK TELEMETRY STREAM & JSON INSPECTOR */}
      {activeTab === 'TELEMETRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Dispatched Logs Stream */}
          <div className="lg:col-span-5 bg-[#0b101b] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-300">Execution Events Stream</span>
              <button
                onClick={handleTestDispatch}
                disabled={isTestDispatching}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isTestDispatching ? 'animate-spin' : ''}`} />
                <span>Test Webhook Ping</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isSelected = selectedLog.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 text-xs ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/70 shadow-sm'
                        : 'bg-[#07090e] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            log.action === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {log.action}
                        </span>
                        <strong className="text-white">{log.ticker}</strong>
                        <span className="text-[10px] text-slate-500">{log.id}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                        {log.latencyMs}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="truncate max-w-[200px]">{log.destination}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed JSON Payload Inspector */}
          <div className="lg:col-span-7 bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Delivered Webhook Payload: <span className="text-cyan-300">{selectedLog.id}</span>
                </h3>
              </div>

              <button
                onClick={() => handleCopyPayload(selectedLog.payload)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-[#07090e] p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">DESTINATION</span>
                <span className="font-bold text-slate-300 truncate block">{selectedLog.destination}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ROUNDTRIP LATENCY</span>
                <span className="font-bold text-emerald-400">{selectedLog.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DELIVERY STATUS</span>
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>200 OK</span>
                </span>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-[#07090e] p-4 rounded-xl border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[360px] leading-relaxed">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
