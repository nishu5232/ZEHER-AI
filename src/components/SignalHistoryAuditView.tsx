import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Radio,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  ChartAnalysisResult,
  SignalDirection,
  MarketRegime,
  SignalEntryType,
  SignalHistoryRecord,
} from '../types';
import {
  signalHistoryDb,
  SignalFilterParams,
} from '../services/signalHistoryDatabase';

interface SignalHistoryAuditViewProps {
  activeResult: ChartAnalysisResult | null;
  onOpenSignalModal?: () => void;
}

export function SignalHistoryAuditView({
  activeResult,
  onOpenSignalModal,
}: SignalHistoryAuditViewProps) {
  // Filter States
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<SignalDirection | 'ALL'>('ALL');
  const [selectedScoreTier, setSelectedScoreTier] = useState<
    'ALL' | 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW'
  >('ALL');
  const [selectedRegime, setSelectedRegime] = useState<MarketRegime | 'ALL'>('ALL');
  const [selectedEntryType, setSelectedEntryType] = useState<SignalEntryType | 'ALL'>('ALL');
  const [minRR, setMinRR] = useState<number>(0);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recordSavedNotification, setRecordSavedNotification] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Auto-sync whenever a new trade setup is saved to localStorage
  useEffect(() => {
    const handleSignalSaved = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('zeher-signal-saved', handleSignalSaved);
    return () => window.removeEventListener('zeher-signal-saved', handleSignalSaved);
  }, []);

  // Active filters object
  const filters: SignalFilterParams = useMemo(() => {
    return {
      asset: selectedAsset,
      timeframe: selectedTimeframe,
      strategy: selectedStrategy,
      direction: selectedDirection,
      scoreTier: selectedScoreTier,
      marketRegime: selectedRegime,
      entryType: selectedEntryType,
      minRiskReward: minRR,
    };
  }, [
    selectedAsset,
    selectedTimeframe,
    selectedStrategy,
    selectedDirection,
    selectedScoreTier,
    selectedRegime,
    selectedEntryType,
    minRR,
  ]);

  // Query records
  const allRecords = useMemo(() => {
    let recs = signalHistoryDb.query(filters);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      recs = recs.filter(
        (r) =>
          r.signalId.toLowerCase().includes(q) ||
          r.asset.toLowerCase().includes(q) ||
          r.technicalSummary.toLowerCase().includes(q)
      );
    }
    return recs;
  }, [filters, searchQuery, refreshTrigger]);

  // Compute Metrics
  const metrics = useMemo(() => {
    return signalHistoryDb.computeMetrics(allRecords);
  }, [allRecords]);

  // Save current active signal to database
  const handleSaveActiveSignal = () => {
    if (!activeResult) return;
    if (activeResult.quantitativeSignal) {
      signalHistoryDb.recordSignal(activeResult.quantitativeSignal);
      setRecordSavedNotification(`Logged ${activeResult.quantitativeSignal.signalId} to audit database`);
      setTimeout(() => setRecordSavedNotification(null), 3500);
    } else {
      const rec = signalHistoryDb.recordFromAnalysis(activeResult);
      setRecordSavedNotification(`Logged ${rec.signalId} to audit database`);
      setTimeout(() => setRecordSavedNotification(null), 3500);
    }
  };

  const handleExportCsv = () => {
    const csv = signalHistoryDb.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeher_signal_performance_audit_${Date.now()}.csv`;
    a.click();
  };

  const handleExportJson = () => {
    const json = signalHistoryDb.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeher_signal_performance_audit_${Date.now()}.json`;
    a.click();
  };

  const handleResetFilters = () => {
    setSelectedAsset('ALL');
    setSelectedTimeframe('ALL');
    setSelectedStrategy('ALL');
    setSelectedDirection('ALL');
    setSelectedScoreTier('ALL');
    setSelectedRegime('ALL');
    setSelectedEntryType('ALL');
    setMinRR(0);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-mono">
      {/* Top Banner: Institutional Audit Identity */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-600 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-100 tracking-wide">
                HISTORICAL SIGNAL PERFORMANCE DATABASE
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded uppercase">
                Audited & Measured
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Empirical multi-exchange trade setup tracking indexed by Asset, Timeframe, Strategy, Score, Regime, and Risk/Reward.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeResult && (
            <button
              onClick={handleSaveActiveSignal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Log Active Signal</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg text-xs transition-colors"
            title="Download CSV Audit Log"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg text-xs transition-colors"
            title="Download JSON Machine-Readable Ledger"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {recordSavedNotification && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{recordSavedNotification}</span>
        </div>
      )}

      {/* Institutional Compliance Notice */}
      <div className="p-3.5 bg-neutral-900/60 border border-amber-500/30 backdrop-blur-md rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-[11px] text-amber-200/90 leading-relaxed">
          <span className="font-bold text-amber-300">QUANTITATIVE INTEGRITY MANDATE: </span>
          ZEHER AI is a market intelligence and trade signal platform. Signals are generated by deterministic algorithms (Volatility-Adjusted Donchian Breakout, EMA200, RSI14, Volume SMA20, ATR14). Signal Score measures statistical indicator confluence and is NOT a guaranteed win probability.
        </div>
      </div>

      {/* Dynamic Performance KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-neutral-400 uppercase font-semibold">Audited Signals</div>
          <div className="text-xl font-bold text-white mt-1">{metrics.totalSignals}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{metrics.evaluatedTrades} trades / {metrics.noTradeCount} held</div>
        </div>

        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">TP1 Hit Rate</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.tp1HitRatePct}%</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{metrics.tp1Hits} hits vs {metrics.invalidationCount} stops</div>
        </div>

        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Avg Realized R:R</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">1:{metrics.averageRealizedRR.toFixed(2)}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">TP2: {metrics.tp2Hits} | TP3: {metrics.tp3Hits}</div>
        </div>

        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-indigo-400 uppercase font-semibold">Profit Factor</div>
          <div className="text-xl font-bold text-indigo-300 mt-1">{metrics.profitFactor.toFixed(2)}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Gross Win / Loss R</div>
        </div>

        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Expectancy (R)</div>
          <div className="text-xl font-bold text-purple-300 mt-1">+{metrics.empiricalExpectancyR.toFixed(2)}R</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Statistical edge per setup</div>
        </div>

        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl">
          <div className="text-[10px] text-neutral-400 uppercase font-semibold">Avg Duration</div>
          <div className="text-xl font-bold text-neutral-200 mt-1">{metrics.avgDurationMinutes}m</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Time to target resolution</div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>EMPIRICAL AUDIT DIMENSIONS</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          {/* Asset Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Assets</option>
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
              <option value="SOL/USD">SOL/USD</option>
              <option value="AVAX/USD">AVAX/USD</option>
              <option value="BNB/USD">BNB/USD</option>
            </select>
          </div>

          {/* Timeframe Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All TFs</option>
              <option value="15m">15m</option>
              <option value="1h">1H</option>
              <option value="4h">4H</option>
              <option value="1d">1D</option>
            </select>
          </div>

          {/* Strategy Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none truncate"
            >
              <option value="ALL">All Strategies</option>
              <option value="Volatility-Adjusted Donchian Breakout">Donchian Breakout</option>
              <option value="Multi-EMA Trend Confluence & Pullback">EMA Ribbon Pullback</option>
              <option value="Institutional Liquidity Sweep & Reversal">Liquidity Sweep</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Direction</label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Directions</option>
              <option value="LONG">LONG (Buy)</option>
              <option value="SHORT">SHORT (Sell)</option>
              <option value="NO_TRADE">NO TRADE (Preservation)</option>
            </select>
          </div>

          {/* Signal Score Tier Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Score Tier</label>
            <select
              value={selectedScoreTier}
              onChange={(e) => setSelectedScoreTier(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Scores</option>
              <option value="VERY_HIGH">Very High (&gt;=85)</option>
              <option value="HIGH">High (70-84)</option>
              <option value="MODERATE">Moderate (55-69)</option>
              <option value="LOW">Low (&lt;55)</option>
            </select>
          </div>

          {/* Market Regime Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Market Regime</label>
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none truncate"
            >
              <option value="ALL">All Regimes</option>
              <option value="HIGH_VOLATILITY_EXPANSION">High Vol Expansion</option>
              <option value="TRENDING_BULLISH">Trending Bullish</option>
              <option value="TRENDING_BEARISH">Trending Bearish</option>
              <option value="COMPRESSION_SQUEEZE">Compression Squeeze</option>
              <option value="CHOPPY_NOISE">Choppy Noise</option>
            </select>
          </div>

          {/* Entry Type Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Entry Type</label>
            <select
              value={selectedEntryType}
              onChange={(e) => setSelectedEntryType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="BREAKOUT">Breakout</option>
              <option value="PULLBACK">Pullback</option>
              <option value="RANGE_BOUNCE">Range Bounce</option>
              <option value="LIQUIDITY_SWEEP">Liquidity Sweep</option>
            </select>
          </div>

          {/* Min R:R Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min R:R Ratio</label>
            <select
              value={minRR}
              onChange={(e) => setMinRR(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:border-cyan-500 outline-none"
            >
              <option value="0">All R:R</option>
              <option value="2.0">&gt;= 1:2.0</option>
              <option value="2.5">&gt;= 1:2.5</option>
              <option value="3.0">&gt;= 1:3.0</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Signal ID (e.g. SIG-BTC-15M), Asset, or technical reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-9 pr-4 py-2 rounded-lg focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Signal Performance Table */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Signal ID</th>
                <th className="py-3 px-4">Asset / TF</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Market Regime</th>
                <th className="py-3 px-4">Entry / SL / TP1</th>
                <th className="py-3 px-4">R:R</th>
                <th className="py-3 px-4">Audit Outcome</th>
                <th className="py-3 px-4">Realized R</th>
                <th className="py-3 px-4">Exchange Sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {allRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No empirical signal records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                allRecords.map((r) => {
                  const isLong = r.direction === 'LONG';
                  const isShort = r.direction === 'SHORT';
                  const isNoTrade = r.direction === 'NO_TRADE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-cyan-400 font-bold whitespace-nowrap">
                        {r.signalId}
                        <div className="text-[9px] text-slate-400 font-normal">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-white font-bold">{r.asset}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{r.timeframe} • {r.entryType}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLong && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <TrendingUp className="w-3 h-3" />
                            LONG
                          </span>
                        )}
                        {isShort && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <TrendingDown className="w-3 h-3" />
                            SHORT
                          </span>
                        )}
                        {isNoTrade && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Shield className="w-3 h-3" />
                            NO TRADE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              r.signalScore >= 85
                                ? 'text-emerald-400'
                                : r.signalScore >= 70
                                ? 'text-cyan-400'
                                : r.signalScore >= 55
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {r.signalScore}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {r.marketRegime.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isNoTrade ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : (
                          <div className="text-[11px]">
                            <div className="text-slate-200">${r.entryPrice.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              SL: <span className="text-rose-400">${r.stopLoss.toLocaleString()}</span> • TP1:{' '}
                              <span className="text-emerald-400">${r.tp1.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isNoTrade ? (
                          <span className="text-slate-400 text-[10px]">0:0</span>
                        ) : (
                          <span className="font-bold text-cyan-300">1:{r.riskReward.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.outcome === 'HIT_TP1' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            HIT TP1
                          </span>
                        )}
                        {r.outcome === 'HIT_TP2' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                            HIT TP2 (RUNNER)
                          </span>
                        )}
                        {r.outcome === 'HIT_TP3' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/25 text-emerald-100 border border-emerald-500/50">
                            HIT TP3 (EXPANSION)
                          </span>
                        )}
                        {r.outcome === 'INVALIDATED_SL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            STOPPED OUT
                          </span>
                        )}
                        {r.outcome === 'NO_TRADE_HELD' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            CAPITAL PRESERVED
                          </span>
                        )}
                        {r.outcome === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse">
                            MONITORING LIVE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.realizedRR > 0 ? (
                          <span className="text-emerald-400 font-bold">+{r.realizedRR.toFixed(2)}R</span>
                        ) : r.realizedRR < 0 ? (
                          <span className="text-rose-400 font-bold">{r.realizedRR.toFixed(2)}R</span>
                        ) : (
                          <span className="text-slate-400">0.00R</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {r.dataSources.slice(0, 3).map((ds) => (
                            <span
                              key={ds}
                              className="px-1.5 py-0.2 text-[9px] uppercase bg-slate-900 text-slate-400 border border-slate-800 rounded"
                            >
                              {ds}
                            </span>
                          ))}
                          {r.dataSources.length > 3 && (
                            <span className="text-[9px] text-slate-400">+{r.dataSources.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
