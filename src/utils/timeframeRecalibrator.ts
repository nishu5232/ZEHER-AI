import { ChartAnalysisResult, Coordinates } from '../types';

/**
 * Maps standard and custom timeframes to their approximate horizon multiplier in minutes.
 */
function getTimeframeMinuteScale(timeframe: string): number {
  const tf = timeframe.trim().toLowerCase();
  if (tf.endsWith('m')) {
    const num = parseInt(tf, 10);
    return isNaN(num) ? 15 : num;
  }
  if (tf.endsWith('h')) {
    const num = parseInt(tf, 10);
    return isNaN(num) ? 60 : num * 60;
  }
  if (tf.endsWith('d')) {
    const num = parseInt(tf, 10);
    return isNaN(num) ? 1440 : num * 1440;
  }
  if (tf.endsWith('w')) {
    const num = parseInt(tf, 10);
    return isNaN(num) ? 10080 : num * 10080;
  }
  return 15;
}

/**
 * Re-calibrates entry, stop loss, and take-profit targets when the user changes timeframe.
 * Scalp timeframes (1m-15m) calibrate tighter Stop-Loss distances and tighter liquid TP targets.
 * Swing timeframes (4H-1D-1W) calibrate wider structural Stop-Loss room and extended liquidity runs.
 */
export function recalculateCoordinatesForTimeframe(
  currentResult: ChartAnalysisResult,
  targetTimeframe: string
): ChartAnalysisResult {
  const oldScale = getTimeframeMinuteScale(currentResult.timeframe || '15m');
  const newScale = getTimeframeMinuteScale(targetTimeframe);

  // Compute scale ratio with bounded dampening
  const rawRatio = Math.sqrt(newScale / Math.max(1, oldScale));
  // Bound the distance adjustment between 0.35x (micro scalp) and 2.4x (macro swing)
  const distanceMultiplier = Math.max(0.35, Math.min(2.4, rawRatio));

  const coords = currentResult.coordinates;
  const isLong = currentResult.bias === 'BULLISH';
  const entryMid = (coords.entry_zone.low + coords.entry_zone.high) / 2;
  const baseEntryWidth = Math.abs(coords.entry_zone.high - coords.entry_zone.low);

  // Re-scale entry zone width to reflect candle size on new timeframe
  const newEntryWidthHalf = Math.max(
    entryMid * 0.0008,
    (baseEntryWidth / 2) * Math.max(0.4, Math.min(1.8, distanceMultiplier))
  );

  const newEntryZone = {
    low: Number((entryMid - newEntryWidthHalf).toFixed(4)),
    high: Number((entryMid + newEntryWidthHalf).toFixed(4)),
  };

  // Base raw risk distance from mid entry to SL
  const rawSlDist = Math.abs(entryMid - coords.stop_loss) || entryMid * 0.01;
  const calibratedSlDist = Math.max(entryMid * 0.0015, rawSlDist * distanceMultiplier);

  // Calculate new calibrated Stop-Loss
  const newStopLoss = isLong
    ? Number((newEntryZone.low - calibratedSlDist).toFixed(4))
    : Number((newEntryZone.high + calibratedSlDist).toFixed(4));

  // Determine strict institutional R:R multipliers (TP1 = 2.05R minimum, TP2 = 3.25R, TP3 = 4.80R)
  const isScalp = ['1m', '3m', '5m', '15m'].includes(targetTimeframe.toLowerCase());
  const r1 = isScalp ? 2.05 : 2.20;
  const r2 = isScalp ? 3.25 : 3.50;
  const r3 = isScalp ? 4.80 : 5.20;

  const newTp1 = isLong
    ? Number((newEntryZone.high + calibratedSlDist * r1).toFixed(4))
    : Number((newEntryZone.low - calibratedSlDist * r1).toFixed(4));

  const newTp2 = isLong
    ? Number((newEntryZone.high + calibratedSlDist * r2).toFixed(4))
    : Number((newEntryZone.low - calibratedSlDist * r2).toFixed(4));

  const newTp3 = isLong
    ? Number((newEntryZone.high + calibratedSlDist * r3).toFixed(4))
    : Number((newEntryZone.low - calibratedSlDist * r3).toFixed(4));

  const newCoordinates: Coordinates = {
    entry_zone: newEntryZone,
    stop_loss: newStopLoss,
    take_profit_1: newTp1,
    take_profit_2: newTp2,
    take_profit_3: newTp3,
    invalidation_buffer: currentResult.invalidation_buffer
      ? {
          ...currentResult.invalidation_buffer,
          buffer_zone_low: Math.min(newStopLoss, currentResult.invalidation_buffer.raw_swing_level),
          buffer_zone_high: Math.max(newStopLoss, currentResult.invalidation_buffer.raw_swing_level),
        }
      : undefined,
  };

  const updatedResult: ChartAnalysisResult = {
    ...currentResult,
    timeframe: targetTimeframe,
    coordinates: newCoordinates,
    invalidation_buffer: newCoordinates.invalidation_buffer,
    trend_alignment: currentResult.trend_alignment
      ? {
          ...currentResult.trend_alignment,
          confluence_summary: `Execution timeframe calibrated to ${targetTimeframe}. HTF benchmark is ${currentResult.trend_alignment.htf_timeframe} (${currentResult.trend_alignment.htf_bias}).`,
        }
      : undefined,
    original_coordinates: currentResult.original_coordinates || { ...currentResult.coordinates },
    rationale: currentResult.rationale.replace(
      /timeframe:?\s*\[?[a-zA-Z0-9]+\]?/gi,
      `timeframe: [${targetTimeframe}]`
    ),
  };

  return updatedResult;
}
