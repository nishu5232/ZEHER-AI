export interface HistoricalBacktestResult {
  patternName: string;
  ticker: string;
  timeframe: string;
  lookbackDays: number;
  sampleSize: number;
  winRate: number; // e.g. 68.4
  profitFactor: number; // e.g. 2.14
  avgRiskReward: string; // e.g. "1:2.8"
  maxConsecutiveWins: number;
  maxDrawdownPct: number;
  expectancyR: number; // e.g. +0.82R per trade
  sharpeRatio: number; // e.g. 2.45
  sortinoRatio: number; // e.g. 3.18
  valueAtRisk95: string; // e.g. "-1.42% Daily VaR"
  holdTimeLabel?: string; // e.g. "4m - 12m" or "2 - 6 Days"
  recentDistribution: {
    tp1Hits: number;
    tp2Hits: number;
    tp3Hits: number;
    slHits: number;
  };
}

export interface MacroNewsEvent {
  id: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
  timeOffsetMinutes: number; // Negative if past, positive if upcoming (e.g., +28 min)
  timeLabel: string; // e.g. "In 28 mins" or "14:30 GMT"
  forecast?: string;
  previous?: string;
  description: string;
  spreadImpact: string; // e.g., "+350% Spread Widening"
  recommendation: 'STAND_ASIDE' | 'REDUCE_SIZE' | 'CLEAR_TO_EXECUTE';
}
