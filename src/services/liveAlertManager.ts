import { LivePriceAlert, AlertType, ChartAnalysisResult } from '../types';
import { soundEngine } from './soundAlertService';

// Storage keys
const ORDER_LEDGER_STORAGE_KEY = 'zeher_live_order_ledger';

export interface AlertTriggerTracker {
  entryZoneTriggered: boolean;
  stopLossTriggered: boolean;
  tp1Triggered: boolean;
  tp2Triggered: boolean;
  tp3Triggered: boolean;
  lastCheckedPrice: number | null;
}

export function createInitialTracker(): AlertTriggerTracker {
  return {
    entryZoneTriggered: false,
    stopLossTriggered: false,
    tp1Triggered: false,
    tp2Triggered: false,
    tp3Triggered: false,
    lastCheckedPrice: null,
  };
}

/**
 * Evaluates live incoming price tick against active chart analysis coordinates
 * and returns new alerts if triggered
 */
export function evaluatePriceTickForAlerts(
  currentPrice: number,
  analysis: ChartAnalysisResult | null,
  tracker: AlertTriggerTracker
): { newAlerts: LivePriceAlert[]; updatedTracker: AlertTriggerTracker } {
  if (!analysis || !analysis.coordinates) {
    return { newAlerts: [], updatedTracker: tracker };
  }

  const { coordinates, bias, ticker } = analysis;
  const isLong = bias !== 'BEARISH';
  const newAlerts: LivePriceAlert[] = [];
  const updatedTracker = { ...tracker, lastCheckedPrice: currentPrice };

  const entryLow = Math.min(coordinates.entry_zone.low, coordinates.entry_zone.high);
  const entryHigh = Math.max(coordinates.entry_zone.low, coordinates.entry_zone.high);
  const sl = coordinates.stop_loss;
  const tp1 = coordinates.take_profit_1;
  const tp2 = coordinates.take_profit_2;
  const tp3 = coordinates.take_profit_3;

  // 1. Entry Zone Check
  const isInEntryZone = currentPrice >= entryLow && currentPrice <= entryHigh;
  if (isInEntryZone && !tracker.entryZoneTriggered) {
    updatedTracker.entryZoneTriggered = true;
    soundEngine.playEntryZoneAlert();
    newAlerts.push({
      id: `alert-entry-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'ENTRY_ZONE',
      ticker,
      price: currentPrice,
      message: `ENTRY ZONE REACHED: Live price $${currentPrice.toLocaleString()} is within execution band [${entryLow} - ${entryHigh}]. Ready to execute!`,
      severity: 'info',
    });
  }

  // 2. Stop Loss (Structural Invalidation) Check
  const isSlBreached = isLong ? currentPrice <= sl : currentPrice >= sl;
  if (isSlBreached && !tracker.stopLossTriggered) {
    updatedTracker.stopLossTriggered = true;
    soundEngine.playStopLossBreachedAlert();
    newAlerts.push({
      id: `alert-sl-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'STOP_LOSS',
      ticker,
      price: currentPrice,
      message: `STOP LOSS HIT: Live price $${currentPrice.toLocaleString()} breached structural invalidation ($${sl}). Setup Invalidated!`,
      severity: 'danger',
    });
  }

  // 3. Take Profit 1 Check
  const isTp1Reached = isLong ? currentPrice >= tp1 : currentPrice <= tp1;
  if (isTp1Reached && !tracker.tp1Triggered && tp1) {
    updatedTracker.tp1Triggered = true;
    soundEngine.playTargetSmashedAlert(1);
    newAlerts.push({
      id: `alert-tp1-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'TP1',
      ticker,
      price: currentPrice,
      message: `TARGET TP1 SMASHED: Live price $${currentPrice.toLocaleString()} hit first milestone ($${tp1}). Lock in 50% profits (+1.5R)!`,
      severity: 'success',
    });
  }

  // 4. Take Profit 2 Check
  if (tp2) {
    const isTp2Reached = isLong ? currentPrice >= tp2 : currentPrice <= tp2;
    if (isTp2Reached && !tracker.tp2Triggered) {
      updatedTracker.tp2Triggered = true;
      soundEngine.playTargetSmashedAlert(2);
      newAlerts.push({
        id: `alert-tp2-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'TP2',
        ticker,
        price: currentPrice,
        message: `TARGET TP2 SMASHED: Live price $${currentPrice.toLocaleString()} reached secondary objective ($${tp2}). Scale out runners (+2.5R)!`,
        severity: 'success',
      });
    }
  }

  // 5. Take Profit 3 Check
  if (tp3) {
    const isTp3Reached = isLong ? currentPrice >= tp3 : currentPrice <= tp3;
    if (isTp3Reached && !tracker.tp3Triggered) {
      updatedTracker.tp3Triggered = true;
      soundEngine.playTargetSmashedAlert(3);
      newAlerts.push({
        id: `alert-tp3-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'TP3',
        ticker,
        price: currentPrice,
        message: `TARGET TP3 SMASHED: Live price $${currentPrice.toLocaleString()} reached terminal objective ($${tp3}). Maximum Take Profit (+3.5R)!`,
        severity: 'success',
      });
    }
  }

  return { newAlerts, updatedTracker };
}

/**
 * Storage helpers for Live Order Ledger
 */
export function getSavedOrderLedger(): any[] {
  try {
    const data = localStorage.getItem(ORDER_LEDGER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOrderToLedger(order: any) {
  try {
    const current = getSavedOrderLedger();
    const updated = [order, ...current.slice(0, 49)];
    localStorage.setItem(ORDER_LEDGER_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch local custom event for cross-component re-renders
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zeher_order_ledger_updated', { detail: order }));
    }
  } catch (e) {
    console.warn('Failed to persist order ledger:', e);
  }
}
