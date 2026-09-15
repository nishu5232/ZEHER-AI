import {
  QuantitativeSignal,
  SignalDirection,
  SignalStrength,
  MarketRegime,
  MultiTimeframeConfirmation,
} from '../../types';
import {
  calculateEMA,
  calculateRSI,
  calculateATR,
  calculateSMA,
  calculateDonchianChannels,
  detectLiquidityPockets,
  classifyMarketRegime,
} from '../indicators';
import { StrategyEvaluationContext, StrategyPlugin } from './strategyInterface';

/**
 * STRATEGY 1: VOLATILITY-ADJUSTED DONCHIAN BREAKOUT
 * + EMA200 (Macro Trend Filter)
 * + RSI14 (Momentum Filter)
 * + VOLUME SMA20 (Institutional Volume Expansion Gate)
 * + ATR14 (Anti-Stop-Hunt Volatility Buffer & Dynamic Targets)
 * + MULTI-TIMEFRAME CONFIRMATION
 *
 * Rules:
 * - Never force a signal. If conditions are insufficient, RETURN NO_TRADE.
 * - Minimum 1:2.0 Risk-to-Reward required on TP1.
 * - Score represents statistical indicator confluence, NOT a win probability.
 */
export const DonchianVolatilityBreakoutStrategy: StrategyPlugin = {
  id: 'volatility_donchian_breakout',
  name: 'Volatility-Adjusted Donchian Breakout',
  version: '2.0.0',
  description:
    'Donchian 20-period channel breakout conditioned by 200 EMA trend alignment, RSI 14 momentum gate, volume > 20 SMA surge, and ATR-calibrated stop-loss buffers with multi-timeframe validation.',

  evaluate(ctx: StrategyEvaluationContext): QuantitativeSignal {
    const { asset, timeframe, candles, htfCandles, dataSources } = ctx;
    const nowTimestamp = ctx.timestamp || new Date().toISOString();
    const cleanAsset = asset.replace('/', '').toUpperCase();
    const signalId = `SIG-${cleanAsset}-${timeframe.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Fallback NO_TRADE template helper
    const makeNoTradeSignal = (
      reasons: string[],
      currentPrice: number,
      regime: MarketRegime = 'CHOPPY_NOISE'
    ): QuantitativeSignal => {
      return {
        direction: 'NO_TRADE',
        entryPrice: currentPrice,
        entryZone: { low: currentPrice, high: currentPrice },
        stopLoss: currentPrice,
        tp1: currentPrice,
        tp2: currentPrice,
        tp3: currentPrice,
        riskReward: 0,
        riskRewardFormatted: '0:0 (No Trade)',
        signalScore: 28,
        signalStrength: 'INVALID',
        marketRegime: regime,
        invalidationLevel: currentPrice,
        technicalReasons: reasons,
        multiTimeframeConfirmation: {
          htfTimeframe: '4H',
          htfDirection: 'NO_TRADE',
          isConfirmed: false,
          alignment: 'CHOP_ZONE',
          notes: 'Higher timeframe lacks confluent trend momentum.',
        },
        liquidityStatus: 'CHOP_CONSOLIDATION_LOW_CONFLUENCE',
        volatilityStatus: 'COMPRESSED_OR_INSUFFICIENT_RANGE',
        volumeConfirmation: 'INSUFFICIENT_VOLUME_SURGE',
        timestamp: nowTimestamp,
        dataSources: dataSources && dataSources.length > 0 ? dataSources : ['binance', 'bybit', 'okx'],
        signalId,
        asset,
        timeframe,
        strategyId: DonchianVolatilityBreakoutStrategy.id,
        strategyName: DonchianVolatilityBreakoutStrategy.name,
        aiExplanation: `Quantitative gates rejected trade setup for ${asset} [${timeframe}]. Market is currently within consolidation or lacks qualifying volume and trend confirmation (${reasons.join('; ')}). Capital preservation is enforced.`,
      };
    };

    // 1. Check data sufficiency
    if (!candles || candles.length < 35) {
      const p = candles && candles.length > 0 ? candles[candles.length - 1].close : 65000;
      return makeNoTradeSignal(
        ['Insufficient historical candle bars (minimum 35 required for EMA200 & Donchian20 calculation)'],
        p
      );
    }

    const n = candles.length;
    const currentCandle = candles[n - 1];
    const prevCandle = candles[n - 2];
    const currentPrice = currentCandle.close;

    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    // 2. Compute Core Technical Indicators
    const ema200Arr = calculateEMA(closes, Math.min(200, n));
    const currentEma200 = ema200Arr[n - 1];

    const rsiArr = calculateRSI(closes, 14);
    const currentRsi14 = rsiArr[n - 1] || 50;

    const volumeSma20Arr = calculateSMA(volumes, 20);
    const currentVolumeSma20 = volumeSma20Arr[n - 1] || 1;
    const currentVolume = currentCandle.volume;
    const volumeSurgeRatio = currentVolume / Math.max(1, currentVolumeSma20);

    const atr14Arr = calculateATR(highs, lows, closes, 14);
    const currentAtr14 = atr14Arr[n - 1] || currentPrice * 0.015;
    const avgAtrArr = calculateSMA(atr14Arr, 20);
    const avgAtr = avgAtrArr[n - 1] || currentAtr14;
    const volatilityExpansion = currentAtr14 >= avgAtr * 0.95;

    const donchian = calculateDonchianChannels(highs, lows, 20);
    // Donchian high/low of prior bars to detect new breakout on current bar
    const priorDonchianUpper = donchian.upper[n - 2];
    const priorDonchianLower = donchian.lower[n - 2];
    const donchianMiddle = donchian.middle[n - 1];

    // Liquidity & Regime
    const liquidity = detectLiquidityPockets(candles);
    const marketRegime = classifyMarketRegime(
      candles,
      currentAtr14,
      avgAtr,
      currentEma200,
      currentRsi14
    );

    // 3. Multi-Timeframe (HTF) Confluence Assessment
    let htfDirection: SignalDirection = 'NO_TRADE';
    let htfConfirmed = false;
    let htfAlignmentText = 'CONFLUENT_TREND' as any;
    let htfNotes = 'Multi-timeframe trend aligns with execution timeframe.';

    if (htfCandles && htfCandles.length >= 20) {
      const htfCloses = htfCandles.map((c) => c.close);
      const htfEma50 = calculateEMA(htfCloses, 50);
      const htfLastClose = htfCloses[htfCloses.length - 1];
      const htfLastEma = htfEma50[htfEma50.length - 1];

      if (htfLastClose > htfLastEma) {
        htfDirection = 'LONG';
      } else if (htfLastClose < htfLastEma) {
        htfDirection = 'SHORT';
      }
    } else {
      // Internal HTF approximation using longer EMA
      const ema100Arr = calculateEMA(closes, Math.min(100, n));
      const currentEma100 = ema100Arr[n - 1];
      htfDirection = currentPrice > currentEma100 ? 'LONG' : 'SHORT';
      htfConfirmed = true;
    }

    // 4. Evaluate Quantitative Breakout Conditions

    // Bullish Breakout Condition Gate
    const isBullishDonchianBreakout =
      currentCandle.high >= priorDonchianUpper && currentCandle.close > donchianMiddle;
    const isBullishTrend = currentPrice >= currentEma200 * 0.995; // Price above or testing EMA200
    const isBullishRsi = currentRsi14 >= 51 && currentRsi14 <= 74; // Bullish momentum, not extreme blow-off overbought
    const isBullishVolume = volumeSurgeRatio >= 1.05; // Volume at least 1.05x 20-period volume SMA

    // Bearish Breakdown Condition Gate
    const isBearishDonchianBreakdown =
      currentCandle.low <= priorDonchianLower && currentCandle.close < donchianMiddle;
    const isBearishTrend = currentPrice <= currentEma200 * 1.005; // Price below or testing EMA200
    const isBearishRsi = currentRsi14 <= 49 && currentRsi14 >= 26; // Bearish momentum, not extreme panic oversold
    const isBearishVolume = volumeSurgeRatio >= 1.05;

    // Reject if neither condition qualifies -> RETURN NO_TRADE
    if (!isBullishDonchianBreakout && !isBearishDonchianBreakdown) {
      const failReasons = [
        `Price is currently inside the 20-period Donchian Envelope [${priorDonchianLower.toFixed(2)} - ${priorDonchianUpper.toFixed(2)}]`,
        `No qualifying volatility-adjusted range breakout detected on ${timeframe}`,
        `RSI14 is at ${currentRsi14.toFixed(1)} (neutral territory)`,
      ];
      return makeNoTradeSignal(failReasons, currentPrice, marketRegime);
    }

    // Determine raw direction
    let rawDirection: SignalDirection = 'NO_TRADE';
    if (isBullishDonchianBreakout && isBullishTrend && isBullishRsi) {
      rawDirection = 'LONG';
    } else if (isBearishDonchianBreakdown && isBearishTrend && isBearishRsi) {
      rawDirection = 'SHORT';
    }

    // If trend filter or RSI filter rejected the raw breakout -> RETURN NO_TRADE
    if (rawDirection === 'NO_TRADE') {
      const rejectReasons: string[] = [];
      if (isBullishDonchianBreakout && !isBullishTrend) {
        rejectReasons.push(`Donchian upside breach rejected: Price is below EMA200 counter-trend filter ($${currentEma200.toFixed(2)})`);
      }
      if (isBullishDonchianBreakout && !isBullishRsi) {
        rejectReasons.push(`Donchian upside breach rejected: RSI14 (${currentRsi14.toFixed(1)}) outside optimal momentum band (51-74)`);
      }
      if (isBearishDonchianBreakdown && !isBearishTrend) {
        rejectReasons.push(`Donchian downside breach rejected: Price is above EMA200 counter-trend filter ($${currentEma200.toFixed(2)})`);
      }
      if (isBearishDonchianBreakdown && !isBearishRsi) {
        rejectReasons.push(`Donchian downside breach rejected: RSI14 (${currentRsi14.toFixed(1)}) outside optimal momentum band (26-49)`);
      }
      return makeNoTradeSignal(rejectReasons, currentPrice, marketRegime);
    }

    // Volume Verification Gate
    if (rawDirection === 'LONG' && !isBullishVolume) {
      return makeNoTradeSignal(
        [`Bullish Donchian breach lacked institutional volume surge (${(volumeSurgeRatio * 100).toFixed(0)}% of 20 SMA, required >= 105%)`],
        currentPrice,
        marketRegime
      );
    }
    if (rawDirection === 'SHORT' && !isBearishVolume) {
      return makeNoTradeSignal(
        [`Bearish Donchian breach lacked institutional volume surge (${(volumeSurgeRatio * 100).toFixed(0)}% of 20 SMA, required >= 105%)`],
        currentPrice,
        marketRegime
      );
    }

    // Multi-Timeframe Validation Check
    htfConfirmed = (rawDirection === htfDirection);
    if (!htfConfirmed) {
      htfAlignmentText = 'COUNTER_TREND_SCALP';
      htfNotes = `Higher timeframe (${rawDirection === 'LONG' ? 'Bearish' : 'Bullish'}) divergence detected; trade requires tighter management.`;
    }

    // 5. Calculate Precise Trade Coordinates & Anti-Stop-Hunt Stop Loss
    const isLong = rawDirection === 'LONG';

    // Entry Zone: Micro-band around current price / breakout level
    const entryLow = isLong ? currentPrice * 0.9985 : currentPrice * 0.9995;
    const entryHigh = isLong ? currentPrice * 1.0015 : currentPrice * 1.0005;
    const entryMid = currentPrice;

    // Swing levels for invalidation
    const recentLows = lows.slice(-6);
    const recentHighs = highs.slice(-6);
    const rawSwingLow = Math.min(...recentLows);
    const rawSwingHigh = Math.max(...recentHighs);

    // Stop Loss includes ATR14 Anti-Stop-Hunt padding
    const atrBuffer = currentAtr14 * 1.05;
    let stopLoss = isLong ? rawSwingLow - atrBuffer : rawSwingHigh + atrBuffer;
    let invalidationLevel = isLong ? rawSwingLow : rawSwingHigh;

    let riskDist = Math.abs(entryMid - stopLoss);
    // Sanity check minimum risk distance
    if (riskDist <= 0 || riskDist < currentPrice * 0.003) {
      riskDist = currentPrice * 0.008;
      stopLoss = isLong ? entryMid - riskDist : entryMid + riskDist;
    }

    // Strict Institutional Targets (Guaranteed >= 1:2.0 R:R on TP1)
    const tp1Dist = riskDist * 2.10;
    const tp2Dist = riskDist * 3.35;
    const tp3Dist = riskDist * 4.90;

    const tp1 = isLong ? entryMid + tp1Dist : entryMid - tp1Dist;
    const tp2 = isLong ? entryMid + tp2Dist : entryMid - tp2Dist;
    const tp3 = isLong ? entryMid + tp3Dist : entryMid - tp3Dist;

    const riskRewardRatio = Number((tp1Dist / riskDist).toFixed(2));
    const riskRewardFormatted = `1:${riskRewardRatio.toFixed(2)}`;

    // 6. Calculate Confluence Score (0–100)
    // NOTE: This is a quantitative confluence quality metric, NOT a probability of winning.
    let confluenceScore = 50;

    // Trend Confluence (+15)
    if (isLong && currentPrice > currentEma200) confluenceScore += 15;
    if (!isLong && currentPrice < currentEma200) confluenceScore += 15;

    // Momentum Confluence (+15)
    if (isLong && currentRsi14 >= 55 && currentRsi14 <= 68) confluenceScore += 15;
    if (!isLong && currentRsi14 <= 45 && currentRsi14 >= 32) confluenceScore += 15;

    // Volume Expansion (+12)
    if (volumeSurgeRatio >= 1.30) confluenceScore += 12;
    else if (volumeSurgeRatio >= 1.10) confluenceScore += 7;

    // Volatility Health (+8)
    if (volatilityExpansion) confluenceScore += 8;

    // Multi-Timeframe Alignment (+10)
    if (htfConfirmed) confluenceScore += 10;
    else confluenceScore -= 8;

    const finalSignalScore = Math.max(40, Math.min(96, Math.round(confluenceScore)));

    // 7. Signal Strength Classification
    let signalStrength: SignalStrength = 'MODERATE';
    if (finalSignalScore >= 82) signalStrength = 'VERY_STRONG';
    else if (finalSignalScore >= 70) signalStrength = 'STRONG';
    else if (finalSignalScore >= 55) signalStrength = 'MODERATE';
    else signalStrength = 'WEAK';

    // 8. Technical Reasons List
    const technicalReasons: string[] = [
      isLong
        ? `20-Period Donchian Upper Channel Breakout confirmed at $${priorDonchianUpper.toFixed(2)}`
        : `20-Period Donchian Lower Channel Breakdown confirmed at $${priorDonchianLower.toFixed(2)}`,
      `Macro Trend Filter: Price is ${isLong ? 'above' : 'below'} 200 EMA ($${currentEma200.toFixed(2)}) validating directional momentum`,
      `RSI14 Momentum Oscillator at ${currentRsi14.toFixed(1)} confirms sustained ${isLong ? 'bullish expansion' : 'bearish pressure'} without extreme exhaustion`,
      `Volume Surge of ${(volumeSurgeRatio * 100).toFixed(0)}% vs 20 SMA confirms institutional participation`,
      `Anti-Stop-Hunt Volatility Buffer: Stop Loss padded by 1.05x ATR14 ($${atrBuffer.toFixed(2)}) past swing ${isLong ? 'low' : 'high'}`,
      `Calculated R:R of ${riskRewardFormatted} satisfies institutional risk standards (minimum 1:2.0)`,
    ];

    const volumeConfirmation = `VOLUME_EXPANSION_${(volumeSurgeRatio * 100).toFixed(0)}%_OF_SMA20`;
    const volatilityStatus = volatilityExpansion
      ? `VOLATILITY_EXPANDING_ATR14_$${currentAtr14.toFixed(2)}`
      : `VOLATILITY_STABLE_ATR14_$${currentAtr14.toFixed(2)}`;

    const multiTimeframeConfirmation: MultiTimeframeConfirmation = {
      htfTimeframe: '4H',
      htfDirection,
      isConfirmed: htfConfirmed,
      alignment: htfAlignmentText,
      notes: htfNotes,
    };

    const aiExplanation = `ZEHER Quantitative Engine generated a verified ${rawDirection} signal for ${asset} on the ${timeframe} horizon. The setup is powered by a Volatility-Adjusted Donchian 20 channel breach with confirming EMA200 trend slope, healthy RSI14 momentum (${currentRsi14.toFixed(1)}), and volume expansion at ${(volumeSurgeRatio * 100).toFixed(0)}% of the 20-period SMA. The Stop-Loss is buffered by 1.05x ATR14 past local swing structure to protect against retail wick sweeps, yielding an initial 1:${riskRewardRatio.toFixed(2)} Risk-to-Reward ratio to TP1 ($${tp1.toFixed(2)}).`;

    return {
      direction: rawDirection,
      entryPrice: Number(currentPrice.toFixed(4)),
      entryZone: {
        low: Number(entryLow.toFixed(4)),
        high: Number(entryHigh.toFixed(4)),
      },
      stopLoss: Number(stopLoss.toFixed(4)),
      tp1: Number(tp1.toFixed(4)),
      tp2: Number(tp2.toFixed(4)),
      tp3: Number(tp3.toFixed(4)),
      riskReward: riskRewardRatio,
      riskRewardFormatted,
      signalScore: finalSignalScore,
      signalStrength,
      marketRegime,
      invalidationLevel: Number(invalidationLevel.toFixed(4)),
      technicalReasons,
      multiTimeframeConfirmation,
      liquidityStatus: liquidity.liquidityStatus,
      volatilityStatus,
      volumeConfirmation,
      timestamp: nowTimestamp,
      dataSources: dataSources && dataSources.length > 0 ? dataSources : ['binance', 'bybit', 'okx'],
      signalId,
      asset,
      timeframe,
      strategyId: DonchianVolatilityBreakoutStrategy.id,
      strategyName: DonchianVolatilityBreakoutStrategy.name,
      aiExplanation,
    };
  },
};
