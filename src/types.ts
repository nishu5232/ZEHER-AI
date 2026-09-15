export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type SignalDirection = 'LONG' | 'SHORT' | 'NO_TRADE';

export type SignalStrength = 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'INVALID';

export type MarketRegime =
  | 'HIGH_VOLATILITY_EXPANSION'
  | 'TRENDING_BULLISH'
  | 'TRENDING_BEARISH'
  | 'RANGE_BOUND_ACCUMULATION'
  | 'COMPRESSION_SQUEEZE'
  | 'CHOPPY_NOISE';

export type ExchangeId =
  | 'binance'
  | 'bybit'
  | 'okx'
  | 'coinbase'
  | 'kraken'
  | 'gateio'
  | 'bitget'
  | 'kucoin'
  | 'mexc'
  | 'hyperliquid';

export interface ExchangeSourceInfo {
  id: ExchangeId;
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  lastPrice: number;
  spreadBps: number;
  weight: number;
}

export interface MultiTimeframeConfirmation {
  htfTimeframe: string; // e.g. '4H' or '1D'
  htfDirection: SignalDirection;
  isConfirmed: boolean;
  alignment: 'CONFLUENT_TREND' | 'COUNTER_TREND_SCALP' | 'RANGE_EXPANSION' | 'CHOP_ZONE';
  notes: string;
}

/**
 * 19 Mandated Signal Parameters for ZEHER AI Quantitative Intelligence
 */
export interface QuantitativeSignal {
  // 1. Direction: LONG / SHORT / NO TRADE
  direction: SignalDirection;
  // 2. Entry price or entry zone
  entryPrice: number;
  entryZone: {
    low: number;
    high: number;
  };
  // 3. Stop Loss
  stopLoss: number;
  // 4. TP1
  tp1: number;
  // 5. TP2
  tp2: number;
  // 6. TP3
  tp3: number;
  // 7. Risk/Reward
  riskReward: number; // e.g. 2.15
  riskRewardFormatted: string; // e.g. "1:2.15"
  // 8. Signal Score from 0–100 (Quantitative Confluence Quality Score - NOT win probability)
  signalScore: number;
  // 9. Signal Strength
  signalStrength: SignalStrength;
  // 10. Market Regime
  marketRegime: MarketRegime;
  // 11. Signal Invalidation Level
  invalidationLevel: number;
  // 12. Technical reasons supporting the setup
  technicalReasons: string[];
  // 13. Multi-timeframe confirmation
  multiTimeframeConfirmation: MultiTimeframeConfirmation;
  // 14. Liquidity status
  liquidityStatus: string;
  // 15. Volatility status
  volatilityStatus: string;
  // 16. Volume confirmation
  volumeConfirmation: string;
  // 17. Timestamp
  timestamp: string; // ISO 8601
  // 18. Exchange/data sources
  dataSources: ExchangeId[];
  // 19. Signal ID
  signalId: string;

  // Metadata & Extensibility
  asset: string;
  timeframe: string;
  strategyId: string;
  strategyName: string;
  aiExplanation?: string;
}

export type SignalOutcome =
  | 'ACTIVE'
  | 'HIT_TP1'
  | 'HIT_TP2'
  | 'HIT_TP3'
  | 'INVALIDATED_SL'
  | 'NO_TRADE_HELD'
  | 'EXPIRED';

export type SignalEntryType = 'BREAKOUT' | 'PULLBACK' | 'RANGE_BOUNCE' | 'LIQUIDITY_SWEEP';

/**
 * Historical Signal Performance Record for Empirical Measurement & Audits
 */
export interface SignalHistoryRecord {
  id: string;
  signalId: string;
  timestamp: string;
  asset: string;
  timeframe: string;
  strategy: string;
  direction: SignalDirection;
  signalScore: number;
  marketRegime: MarketRegime;
  entryType: SignalEntryType;
  riskReward: number;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  invalidationLevel: number;
  outcome: SignalOutcome;
  realizedRR: number;
  exitPrice?: number;
  exitTime?: string;
  maxFavorableExcursionR: number;
  maxAdverseExcursionR: number;
  durationMinutes: number;
  dataSources: ExchangeId[];
  technicalSummary: string;
}

export type WorkspaceTab = 'workspace' | 'signal_data' | 'signal_audit' | 'compliance' | 'api_docs';

export type PropFirmPreset = 'ftmo' | 'funding_pips' | 'topstep' | 'custom' | 'off';

export interface PropFirmRule {
  name: string;
  maxDailyLossPct: number;
  maxTotalLossPct: number;
  maxRiskPerTradePct: number;
  profitTargetPct: number;
}

export interface EntryZone {
  low: number;
  high: number;
}

export interface InvalidationBuffer {
  buffer_type: string; // e.g. 'CRYPTO_ATR_PADDING' | 'FOREX_PIP_BUFFER'
  buffer_amount: string; // e.g. '+0.85% ATR' or '+12.5 pips'
  buffer_zone_low: number;
  buffer_zone_high: number;
  raw_swing_level: number;
  anti_stop_hunt_note: string;
}

export interface TrendAlignmentCheck {
  is_aligned: boolean;
  htf_timeframe: string; // e.g. '4H' or '1D'
  htf_bias: MarketBias;
  alignment_status: 'CONFLUENT_TREND' | 'COUNTER_TREND_SCALP' | 'RANGE_EXPANSION' | 'CHOP_ZONE';
  risk_rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'INVALID';
  confluence_summary: string;
}

export interface StructureAudit {
  sweep_type: 'TRUE_BOS' | 'WICK_SWEEP_REVERSAL' | 'EQUAL_HIGHS_LOWS' | 'CONSOLIDATION';
  candle_confirmation: string; // e.g. 'Wick liquidity sweep confirmed - no 15m body close above swing high'
  setup_quality: 'PRIME_INSTITUTIONAL' | 'VALID_SETUP' | 'INVALID_SETUP_POOR_LOCATION' | 'SUB_OPTIMAL_RR';
  risk_to_reward_valid: boolean;
}

export interface Coordinates {
  entry_zone: EntryZone;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  invalidation_buffer?: InvalidationBuffer;
}

export interface KeyLevels {
  support: number[];
  resistance: number[];
}

export interface ChartAnalysisResult {
  ticker: string;
  timeframe: string;
  bias: MarketBias;
  confidence_score: number;
  coordinates: Coordinates;
  key_levels: KeyLevels;
  identified_structures: string[];
  rationale: string;
  invalidation_buffer?: InvalidationBuffer;
  trend_alignment?: TrendAlignmentCheck;
  structure_audit?: StructureAudit;
  original_coordinates?: Coordinates; // Keeps reference to original AI extraction
  quantitativeSignal?: QuantitativeSignal;
}

export interface PositionSizingConfig {
  accountBalance: number;
  riskPercentage: number;
  assetType: 'crypto' | 'forex' | 'stock' | 'indices' | 'commodities';
  leverage: number;
  propFirmMode?: PropFirmPreset;
  customMaxRiskPct?: number;
}

export interface PositionSizingResult {
  riskAmount: number;
  entryPrice: number;
  stopLossPrice: number;
  slDistance: number;
  slPercentage: number;
  positionUnits: number;
  positionNotional: number;
  formattedUnits: string;
  unitLabel: string;
  tp1Profit: number;
  tp2Profit: number;
  tp3Profit: number;
  tp1RR: number;
  tp2RR: number;
  tp3RR: number;
  winProbability: number;
  // Quantitative metrics
  sharpeRatio?: number;
  sortinoRatio?: number;
  valueAtRisk95?: string;
  isPropFirmCompliant?: boolean;
  propFirmWarnings?: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: ChartAnalysisResult | null;
  rawJson: string | null;
  executionTimeMs: number | null;
}

export interface SampleChart {
  id: string;
  name: string;
  category: 'Crypto' | 'Forex' | 'Stocks' | 'Indices' | 'Commodities';
  ticker: string;
  timeframe: string;
  description: string;
  imageDataUrl: string;
}

export type AlertType = 'ENTRY_ZONE' | 'STOP_LOSS' | 'TP1' | 'TP2' | 'TP3';

export interface LivePriceAlert {
  id: string;
  timestamp: string;
  type: AlertType;
  ticker: string;
  price: number;
  message: string;
  severity: 'info' | 'success' | 'danger' | 'warning';
  acknowledged?: boolean;
}

export interface OrderSliceDetail {
  percent: number;
  units: number;
  targetPrice: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
}

export interface LiveOrderTicket {
  id: string;
  timestamp: string;
  ticker: string;
  bias: MarketBias;
  broker: 'ccxt' | 'metatrader' | 'alpaca' | 'interactive_brokers';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
  entryPrice: number;
  stopLoss: number;
  totalQuantity: number;
  notionalValue: number;
  status: 'SUBMITTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  slices: {
    tp1: OrderSliceDetail;
    tp2: OrderSliceDetail;
    tp3: OrderSliceDetail;
  };
  latencyMs: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  slippagePct: number;
  rawPayload: any;
}

