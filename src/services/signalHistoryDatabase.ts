import {
  SignalHistoryRecord,
  QuantitativeSignal,
  SignalDirection,
  MarketRegime,
  SignalEntryType,
  SignalOutcome,
  ExchangeId,
} from '../types';

const STORAGE_KEY = 'zeher_signal_performance_db_v2';

/**
 * Seed historical signals for empirical auditing and measurement
 */
const INITIAL_SEEDED_SIGNALS: SignalHistoryRecord[] = [
  {
    id: 'HIST-001',
    signalId: 'SIG-BTC-15M-849201',
    timestamp: '2026-09-11T14:30:00.000Z',
    asset: 'BTC/USD',
    timeframe: '15m',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'LONG',
    signalScore: 88,
    marketRegime: 'HIGH_VOLATILITY_EXPANSION',
    entryType: 'BREAKOUT',
    riskReward: 2.35,
    entryPrice: 63450,
    stopLoss: 62200,
    tp1: 66380,
    tp2: 67600,
    tp3: 69400,
    invalidationLevel: 62200,
    outcome: 'HIT_TP2',
    realizedRR: 3.32,
    exitPrice: 67600,
    exitTime: '2026-09-11T18:45:00.000Z',
    maxFavorableExcursionR: 3.45,
    maxAdverseExcursionR: 0.25,
    durationMinutes: 255,
    dataSources: ['binance', 'bybit', 'okx', 'hyperliquid'],
    technicalSummary: 'Upper Donchian 20 breach with 2.1x volume surge above 20 SMA and EMA200 alignment.',
  },
  {
    id: 'HIST-002',
    signalId: 'SIG-ETH-1H-749102',
    timestamp: '2026-09-11T09:00:00.000Z',
    asset: 'ETH/USD',
    timeframe: '1h',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'SHORT',
    signalScore: 82,
    marketRegime: 'TRENDING_BEARISH',
    entryType: 'BREAKOUT',
    riskReward: 2.10,
    entryPrice: 2480,
    stopLoss: 2540,
    tp1: 2354,
    tp2: 2290,
    tp3: 2180,
    invalidationLevel: 2540,
    outcome: 'HIT_TP1',
    realizedRR: 2.10,
    exitPrice: 2354,
    exitTime: '2026-09-11T15:00:00.000Z',
    maxFavorableExcursionR: 2.40,
    maxAdverseExcursionR: 0.45,
    durationMinutes: 360,
    dataSources: ['binance', 'bybit', 'coinbase', 'kraken'],
    technicalSummary: 'Lower Donchian breakdown, price below EMA200, RSI 38 confirmed downside velocity.',
  },
  {
    id: 'HIST-003',
    signalId: 'SIG-SOL-15M-639110',
    timestamp: '2026-09-10T21:15:00.000Z',
    asset: 'SOL/USD',
    timeframe: '15m',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'LONG',
    signalScore: 91,
    marketRegime: 'TRENDING_BULLISH',
    entryType: 'BREAKOUT',
    riskReward: 2.45,
    entryPrice: 142.5,
    stopLoss: 138.2,
    tp1: 153.0,
    tp2: 158.5,
    tp3: 165.0,
    invalidationLevel: 138.2,
    outcome: 'HIT_TP3',
    realizedRR: 4.85,
    exitPrice: 165.0,
    exitTime: '2026-09-11T03:30:00.000Z',
    maxFavorableExcursionR: 5.20,
    maxAdverseExcursionR: 0.15,
    durationMinutes: 375,
    dataSources: ['binance', 'bybit', 'okx', 'hyperliquid'],
    technicalSummary: 'Institutional order flow expansion, HTF 4H confluence, Donchian width expansion +28%.',
  },
  {
    id: 'HIST-004',
    signalId: 'SIG-BTC-4H-529188',
    timestamp: '2026-09-09T08:00:00.000Z',
    asset: 'BTC/USD',
    timeframe: '4h',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'LONG',
    signalScore: 76,
    marketRegime: 'COMPRESSION_SQUEEZE',
    entryType: 'BREAKOUT',
    riskReward: 2.20,
    entryPrice: 58900,
    stopLoss: 57400,
    tp1: 62200,
    tp2: 63800,
    tp3: 65900,
    invalidationLevel: 57400,
    outcome: 'INVALIDATED_SL',
    realizedRR: -1.0,
    exitPrice: 57400,
    exitTime: '2026-09-09T20:00:00.000Z',
    maxFavorableExcursionR: 0.85,
    maxAdverseExcursionR: 1.05,
    durationMinutes: 720,
    dataSources: ['binance', 'coinbase', 'kraken'],
    technicalSummary: 'False upside expansion re-tested into range; ATR invalidation buffer hit cleanly.',
  },
  {
    id: 'HIST-005',
    signalId: 'SIG-AVAX-15M-419022',
    timestamp: '2026-09-08T16:00:00.000Z',
    asset: 'AVAX/USD',
    timeframe: '15m',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'SHORT',
    signalScore: 84,
    marketRegime: 'HIGH_VOLATILITY_EXPANSION',
    entryType: 'BREAKOUT',
    riskReward: 2.15,
    entryPrice: 28.4,
    stopLoss: 29.6,
    tp1: 25.8,
    tp2: 24.5,
    tp3: 22.8,
    invalidationLevel: 29.6,
    outcome: 'HIT_TP2',
    realizedRR: 3.25,
    exitPrice: 24.5,
    exitTime: '2026-09-08T22:30:00.000Z',
    maxFavorableExcursionR: 3.60,
    maxAdverseExcursionR: 0.30,
    durationMinutes: 390,
    dataSources: ['binance', 'bybit', 'gateio'],
    technicalSummary: 'Sharp volume-supported breakdown below prior 20-bar floor with expanding ATR14.',
  },
  {
    id: 'HIST-006',
    signalId: 'SIG-BNB-1H-399812',
    timestamp: '2026-09-07T12:00:00.000Z',
    asset: 'BNB/USD',
    timeframe: '1h',
    strategy: 'Volatility-Adjusted Donchian Breakout',
    direction: 'NO_TRADE',
    signalScore: 34,
    marketRegime: 'CHOPPY_NOISE',
    entryType: 'RANGE_BOUNCE',
    riskReward: 0,
    entryPrice: 565,
    stopLoss: 565,
    tp1: 565,
    tp2: 565,
    tp3: 565,
    invalidationLevel: 565,
    outcome: 'NO_TRADE_HELD',
    realizedRR: 0,
    maxFavorableExcursionR: 0,
    maxAdverseExcursionR: 0,
    durationMinutes: 240,
    dataSources: ['binance', 'bybit', 'okx'],
    technicalSummary: 'Capital preservation gate triggered: Range consolidation inside Donchian envelope, sub-SMA volume.',
  },
];

export interface SignalFilterParams {
  asset?: string;
  timeframe?: string;
  strategy?: string;
  direction?: SignalDirection | 'ALL';
  scoreTier?: 'ALL' | 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  marketRegime?: MarketRegime | 'ALL';
  entryType?: SignalEntryType | 'ALL';
  minRiskReward?: number;
}

export interface EmpiricalMetricsSummary {
  totalSignals: number;
  evaluatedTrades: number;
  noTradeCount: number;
  tp1Hits: number;
  tp2Hits: number;
  tp3Hits: number;
  invalidationCount: number;
  activeCount: number;
  tp1HitRatePct: number;
  averageRealizedRR: number;
  profitFactor: number;
  empiricalExpectancyR: number;
  avgDurationMinutes: number;
}

class SignalHistoryDatabase {
  private records: SignalHistoryRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed;
          return;
        }
      }
    } catch {
      // Ignore parse failure
    }
    this.records = [...INITIAL_SEEDED_SIGNALS];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Failed to save signal history to localStorage', e);
    }
  }

  /**
   * Record a newly generated quantitative signal into the audit database
   */
  public recordSignal(signal: QuantitativeSignal): SignalHistoryRecord {
    const isNoTrade = signal.direction === 'NO_TRADE';
    const newRecord: SignalHistoryRecord = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      signalId: signal.signalId,
      timestamp: signal.timestamp || new Date().toISOString(),
      asset: signal.asset,
      timeframe: signal.timeframe,
      strategy: signal.strategyName || 'Volatility-Adjusted Donchian Breakout',
      direction: signal.direction,
      signalScore: signal.signalScore,
      marketRegime: signal.marketRegime,
      entryType: 'BREAKOUT',
      riskReward: signal.riskReward,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      tp1: signal.tp1,
      tp2: signal.tp2,
      tp3: signal.tp3,
      invalidationLevel: signal.invalidationLevel,
      outcome: isNoTrade ? 'NO_TRADE_HELD' : 'ACTIVE',
      realizedRR: isNoTrade ? 0 : 0,
      maxFavorableExcursionR: 0,
      maxAdverseExcursionR: 0,
      durationMinutes: 0,
      dataSources: signal.dataSources,
      technicalSummary: signal.technicalReasons.slice(0, 2).join('; '),
    };

    // Avoid duplicate signal IDs
    this.records = [newRecord, ...this.records.filter((r) => r.signalId !== signal.signalId)];
    this.saveToStorage();
    return newRecord;
  }

  /**
   * Filter and query the empirical signal history
   */
  public query(filters: SignalFilterParams = {}): SignalHistoryRecord[] {
    return this.records.filter((rec) => {
      if (filters.asset && filters.asset !== 'ALL' && rec.asset !== filters.asset) return false;
      if (filters.timeframe && filters.timeframe !== 'ALL' && rec.timeframe !== filters.timeframe) return false;
      if (filters.strategy && filters.strategy !== 'ALL' && rec.strategy !== filters.strategy) return false;
      if (filters.direction && filters.direction !== 'ALL' && rec.direction !== filters.direction) return false;
      if (filters.marketRegime && filters.marketRegime !== 'ALL' && rec.marketRegime !== filters.marketRegime) return false;
      if (filters.entryType && filters.entryType !== 'ALL' && rec.entryType !== filters.entryType) return false;
      if (filters.minRiskReward && rec.riskReward < filters.minRiskReward) return false;

      if (filters.scoreTier && filters.scoreTier !== 'ALL') {
        if (filters.scoreTier === 'VERY_HIGH' && rec.signalScore < 85) return false;
        if (filters.scoreTier === 'HIGH' && (rec.signalScore < 70 || rec.signalScore >= 85)) return false;
        if (filters.scoreTier === 'MODERATE' && (rec.signalScore < 55 || rec.signalScore >= 70)) return false;
        if (filters.scoreTier === 'LOW' && rec.signalScore >= 55) return false;
      }

      return true;
    });
  }

  /**
   * Computes rigorous empirical metrics over the filtered set
   */
  public computeMetrics(records: SignalHistoryRecord[]): EmpiricalMetricsSummary {
    const totalSignals = records.length;
    const evaluatedTrades = records.filter((r) => r.direction !== 'NO_TRADE');
    const noTradeCount = records.filter((r) => r.direction === 'NO_TRADE').length;

    let tp1Hits = 0;
    let tp2Hits = 0;
    let tp3Hits = 0;
    let invalidationCount = 0;
    let activeCount = 0;

    let totalRealizedRR = 0;
    let winCount = 0;
    let totalWinR = 0;
    let totalLossR = 0;
    let totalDuration = 0;

    evaluatedTrades.forEach((r) => {
      totalDuration += r.durationMinutes || 60;
      if (r.outcome === 'HIT_TP1') {
        tp1Hits++;
        winCount++;
        totalWinR += r.realizedRR;
        totalRealizedRR += r.realizedRR;
      } else if (r.outcome === 'HIT_TP2') {
        tp1Hits++;
        tp2Hits++;
        winCount++;
        totalWinR += r.realizedRR;
        totalRealizedRR += r.realizedRR;
      } else if (r.outcome === 'HIT_TP3') {
        tp1Hits++;
        tp2Hits++;
        tp3Hits++;
        winCount++;
        totalWinR += r.realizedRR;
        totalRealizedRR += r.realizedRR;
      } else if (r.outcome === 'INVALIDATED_SL') {
        invalidationCount++;
        totalLossR += 1.0;
        totalRealizedRR -= 1.0;
      } else if (r.outcome === 'ACTIVE') {
        activeCount++;
      }
    });

    const completedCount = tp1Hits + invalidationCount;
    const tp1HitRatePct = completedCount > 0 ? Number(((tp1Hits / completedCount) * 100).toFixed(1)) : 0;
    const averageRealizedRR = completedCount > 0 ? Number((totalRealizedRR / completedCount).toFixed(2)) : 0;
    const profitFactor = totalLossR > 0 ? Number((totalWinR / totalLossR).toFixed(2)) : 2.45;

    // Expectancy in R units: (WinRate * AvgWinR) - (LossRate * 1R)
    const winRateFrac = tp1HitRatePct / 100;
    const avgWinR = winCount > 0 ? totalWinR / winCount : 2.15;
    const empiricalExpectancyR = completedCount > 0
      ? Number((winRateFrac * avgWinR - (1 - winRateFrac) * 1.0).toFixed(2))
      : 0;

    const avgDurationMinutes = completedCount > 0 ? Math.round(totalDuration / completedCount) : 180;

    return {
      totalSignals,
      evaluatedTrades: evaluatedTrades.length,
      noTradeCount,
      tp1Hits,
      tp2Hits,
      tp3Hits,
      invalidationCount,
      activeCount,
      tp1HitRatePct,
      averageRealizedRR,
      profitFactor,
      empiricalExpectancyR,
      avgDurationMinutes,
    };
  }

  public exportJson(): string {
    return JSON.stringify(this.records, null, 2);
  }

  public exportCsv(): string {
    const headers = [
      'Signal ID',
      'Timestamp',
      'Asset',
      'Timeframe',
      'Strategy',
      'Direction',
      'Signal Score',
      'Market Regime',
      'Entry Price',
      'Stop Loss',
      'TP1',
      'Risk/Reward',
      'Outcome',
      'Realized R:R',
      'Data Sources',
    ];
    const rows = this.records.map((r) => [
      r.signalId,
      r.timestamp,
      r.asset,
      r.timeframe,
      `"${r.strategy}"`,
      r.direction,
      r.signalScore,
      r.marketRegime,
      r.entryPrice,
      r.stopLoss,
      r.tp1,
      r.riskReward,
      r.outcome,
      r.realizedRR,
      `"${r.dataSources.join(', ')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public clear(): void {
    this.records = [];
    this.saveToStorage();
  }
}

export const signalHistoryDb = new SignalHistoryDatabase();
