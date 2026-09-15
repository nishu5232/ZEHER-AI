import { QuantitativeSignal, ExchangeId } from '../../types';
import { IndicatorCandle } from '../indicators';

export interface StrategyEvaluationContext {
  asset: string;
  timeframe: string;
  candles: IndicatorCandle[];
  htfCandles?: IndicatorCandle[]; // Higher timeframe candles (e.g. 4H or 1D)
  dataSources: ExchangeId[];
  timestamp?: string;
  customParams?: Record<string, any>;
}

export interface StrategyPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  evaluate: (ctx: StrategyEvaluationContext) => QuantitativeSignal;
}
