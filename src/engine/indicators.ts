import { MarketRegime } from '../types';

export interface IndicatorCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(values.length);

  // Initial SMA for first period elements
  let sum = 0;
  const initialPeriod = Math.min(period, values.length);
  for (let i = 0; i < initialPeriod; i++) {
    sum += values[i];
  }
  let currentEma = sum / initialPeriod;
  emaArray[initialPeriod - 1] = currentEma;

  // Compute EMA for the rest
  for (let i = initialPeriod; i < values.length; i++) {
    currentEma = values[i] * k + currentEma * (1 - k);
    emaArray[i] = currentEma;
  }

  // Fill preceding undefined values with initial EMA for continuity
  for (let i = 0; i < initialPeriod - 1; i++) {
    emaArray[i] = values[i];
  }

  return emaArray;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(values: number[], period: number): number[] {
  if (values.length === 0 || period <= 0) return [];
  const smaArray: number[] = new Array(values.length);

  let windowSum = 0;
  for (let i = 0; i < values.length; i++) {
    windowSum += values[i];
    if (i >= period) {
      windowSum -= values[i - period];
      smaArray[i] = windowSum / period;
    } else {
      smaArray[i] = windowSum / (i + 1);
    }
  }

  return smaArray;
}

/**
 * Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  if (closes.length <= 1) return [];
  const rsiArray: number[] = new Array(closes.length).fill(50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= Math.min(period, closes.length - 1); i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsiArray[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsiArray[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsiArray[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiArray[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsiArray;
}

/**
 * Average True Range (ATR 14)
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number[] {
  const len = closes.length;
  if (len === 0) return [];
  const tr: number[] = new Array(len);
  tr[0] = highs[0] - lows[0];

  for (let i = 1; i < len; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }

  return calculateSMA(tr, period);
}

/**
 * Donchian Channels (Upper, Lower, Middle, Width %)
 */
export interface DonchianResult {
  upper: number[];
  lower: number[];
  middle: number[];
  widthPct: number[];
}

export function calculateDonchianChannels(
  highs: number[],
  lows: number[],
  period = 20
): DonchianResult {
  const len = highs.length;
  const upper: number[] = new Array(len);
  const lower: number[] = new Array(len);
  const middle: number[] = new Array(len);
  const widthPct: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const start = Math.max(0, i - period + 1);
    let maxHigh = -Infinity;
    let minLow = Infinity;

    for (let j = start; j <= i; j++) {
      if (highs[j] > maxHigh) maxHigh = highs[j];
      if (lows[j] < minLow) minLow = lows[j];
    }

    upper[i] = maxHigh;
    lower[i] = minLow;
    middle[i] = (maxHigh + minLow) / 2;
    const mid = middle[i];
    widthPct[i] = mid > 0 ? ((maxHigh - minLow) / mid) * 100 : 0;
  }

  return { upper, lower, middle, widthPct };
}

/**
 * Detect Order Flow Liquidity Pools & Sweeps
 */
export function detectLiquidityPockets(candles: IndicatorCandle[]): {
  buySideLiquidity: number;
  sellSideLiquidity: number;
  liquidityStatus: string;
  poolsSwept: boolean;
} {
  if (candles.length < 10) {
    return {
      buySideLiquidity: 0,
      sellSideLiquidity: 0,
      liquidityStatus: 'INSUFFICIENT_BARS',
      poolsSwept: false,
    };
  }

  const recent = candles.slice(-15);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);
  const current = recent[recent.length - 1];

  const highestHigh = Math.max(...highs.slice(0, -1));
  const lowestLow = Math.min(...lows.slice(0, -1));

  const sweptHigh = current.high > highestHigh && current.close < highestHigh;
  const sweptLow = current.low < lowestLow && current.close > lowestLow;

  let liquidityStatus = 'BALANCED_LIQUIDITY_DEPTH';
  if (sweptHigh) {
    liquidityStatus = 'BUY_SIDE_LIQUIDITY_SWEPT (Bearish Reversal Trap)';
  } else if (sweptLow) {
    liquidityStatus = 'SELL_SIDE_LIQUIDITY_SWEPT (Bullish Reversal Trap)';
  } else if (current.high >= highestHigh) {
    liquidityStatus = 'BREAKOUT_LIQUIDITY_EXPANSION';
  } else {
    liquidityStatus = 'INTERNAL_RANGE_LIQUIDITY';
  }

  return {
    buySideLiquidity: highestHigh,
    sellSideLiquidity: lowestLow,
    liquidityStatus,
    poolsSwept: sweptHigh || sweptLow,
  };
}

/**
 * Classify Market Regime deterministically
 */
export function classifyMarketRegime(
  candles: IndicatorCandle[],
  currentAtr: number,
  avgAtr: number,
  ema200: number,
  rsi14: number
): MarketRegime {
  if (candles.length === 0) return 'CHOPPY_NOISE';
  const currentPrice = candles[candles.length - 1].close;

  const isVolatilityExpanding = avgAtr > 0 && currentAtr > avgAtr * 1.25;
  const isVolatilityCompressed = avgAtr > 0 && currentAtr < avgAtr * 0.75;

  if (isVolatilityExpanding && (rsi14 > 68 || rsi14 < 32)) {
    return 'HIGH_VOLATILITY_EXPANSION';
  }

  if (isVolatilityCompressed) {
    return 'COMPRESSION_SQUEEZE';
  }

  if (currentPrice > ema200 && rsi14 > 54) {
    return 'TRENDING_BULLISH';
  }

  if (currentPrice < ema200 && rsi14 < 46) {
    return 'TRENDING_BEARISH';
  }

  if (Math.abs(rsi14 - 50) <= 5) {
    return 'CHOPPY_NOISE';
  }

  return 'RANGE_BOUND_ACCUMULATION';
}
