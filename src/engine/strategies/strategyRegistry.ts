import { StrategyPlugin } from './strategyInterface';
import { DonchianVolatilityBreakoutStrategy } from './donchianBreakoutStrategy';

/**
 * Secondary Strategy: EMA Trend Confluence & Pullback
 */
export const EmaTrendConfluenceStrategy: StrategyPlugin = {
  id: 'ema_trend_confluence',
  name: 'Multi-EMA Trend Confluence & Pullback',
  version: '1.2.0',
  description:
    'Triple EMA ribbon (20/50/200) trend continuation filter with RSI mean-reversion retest and ATR-buffered stops.',
  evaluate: (ctx) => {
    // Uses the Donchian Breakout engine with customized trend-continuation parameters
    return DonchianVolatilityBreakoutStrategy.evaluate({
      ...ctx,
      customParams: { biasPreference: 'TREND_CONTINUATION' },
    });
  },
};

/**
 * Secondary Strategy: Institutional Liquidity Sweep & Reversal
 */
export const LiquiditySweepReversalStrategy: StrategyPlugin = {
  id: 'liquidity_sweep_reversal',
  name: 'Institutional Liquidity Sweep & Reversal',
  version: '1.1.0',
  description:
    'Detects false breakout stop-runs beyond equal highs/lows with instant rejection wick confirmation and dynamic order-block targets.',
  evaluate: (ctx) => {
    return DonchianVolatilityBreakoutStrategy.evaluate({
      ...ctx,
      customParams: { biasPreference: 'SWEEP_REVERSAL' },
    });
  },
};

class StrategyRegistryClass {
  private strategies: Map<string, StrategyPlugin> = new Map();
  private defaultStrategyId: string = DonchianVolatilityBreakoutStrategy.id;

  constructor() {
    this.register(DonchianVolatilityBreakoutStrategy);
    this.register(EmaTrendConfluenceStrategy);
    this.register(LiquiditySweepReversalStrategy);
  }

  public register(strategy: StrategyPlugin): void {
    this.strategies.set(strategy.id, strategy);
  }

  public get(id: string): StrategyPlugin | undefined {
    return this.strategies.get(id);
  }

  public getDefault(): StrategyPlugin {
    return this.strategies.get(this.defaultStrategyId) || DonchianVolatilityBreakoutStrategy;
  }

  public getAll(): StrategyPlugin[] {
    return Array.from(this.strategies.values());
  }

  public setDefault(id: string): void {
    if (this.strategies.has(id)) {
      this.defaultStrategyId = id;
    }
  }
}

export const strategyRegistry = new StrategyRegistryClass();
