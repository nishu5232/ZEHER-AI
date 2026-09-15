import { QuantitativeSignal } from '../types';

/**
 * Generates an institutional natural language explanation for an already-calculated signal.
 * CRITICAL DIRECTIVE: LLMs must NEVER independently decide LONG, SHORT, or NO TRADE.
 * The quantitative engine calculates the signal; the AI layer strictly explains it.
 */
export async function explainSignalWithAI(
  signal: QuantitativeSignal,
  customPromptContext?: string
): Promise<string> {
  // If the signal already has an AI explanation or is NO_TRADE, we can formulate an immediate fallback or query server
  try {
    const response = await fetch('/api/explain-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signal,
        context: customPromptContext,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.explanation && typeof data.explanation === 'string' && data.explanation.trim()) {
        return data.explanation;
      }
    }
  } catch (err) {
    console.warn('AI explanation server endpoint unavailable; using deterministic explainability engine', err);
  }

  // High-fidelity fallback explanation if network is offline
  return generateDeterministicExplanation(signal);
}

export function generateDeterministicExplanation(signal: QuantitativeSignal): string {
  if (signal.direction === 'NO_TRADE') {
    return `ZEHER Quantitative Engine issued a NO-TRADE state for ${signal.asset} on the ${signal.timeframe} timeframe. Capital preservation protocols are enforced: ${signal.technicalReasons.join('. ')}. Market regime is currently ${signal.marketRegime.replace(/_/g, ' ')}. Traders are advised to wait for a high-confluence volatility-expansion breakout before committing capital.`;
  }

  const isLong = signal.direction === 'LONG';
  return `ZEHER Quantitative Engine identified an institutional ${signal.direction} trade setup for ${signal.asset} [${signal.timeframe}]. The trade is triggered by a ${signal.strategyName} with confirming EMA200 structural trend alignment and sustained momentum. Stop-Loss is fixed at $${signal.stopLoss.toLocaleString()} with anti-stop-hunt ATR volatility padding beyond local swing structure, delivering a minimum 1:${signal.riskReward.toFixed(2)} Risk-to-Reward ratio to TP1 ($${signal.tp1.toLocaleString()}). Multi-timeframe confluence on 4H confirms directional alignment (${signal.multiTimeframeConfirmation.notes}). Quantitative Confluence Score is rated ${signal.signalScore}/100 (${signal.signalStrength}). Note: Signal Score reflects objective indicator confluence, not a guaranteed win probability.`;
}
