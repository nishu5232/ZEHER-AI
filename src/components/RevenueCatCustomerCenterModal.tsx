import React, { useState } from 'react';
import {
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  CreditCard,
  Sliders,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Key,
} from 'lucide-react';
import { useRevenueCat } from '../context/RevenueCatContext';

export function RevenueCatCustomerCenterModal() {
  const {
    isCustomerCenterOpen,
    closeCustomerCenter,
    isPro,
    customerInfo,
    appUserId,
    activeEntitlement,
    expirationDate,
    managementUrl,
    changeAppUserId,
    restorePurchases,
    setTraderAttributes,
    openPaywall,
    simulateUnlockPro,
    simulateLockPro,
    isLoading,
  } = useRevenueCat();

  const [inputUserId, setInputUserId] = useState(appUserId);
  const [traderTier, setTraderTier] = useState('Institutional');
  const [preferredBroker, setPreferredBroker] = useState('Interactive Brokers');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isCustomerCenterOpen) return null;

  const handleUpdateUserId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUserId.trim()) return;
    setIsUpdatingUser(true);
    try {
      await changeAppUserId(inputUserId.trim());
      setStatusMessage('Trader ID successfully updated and synced with RevenueCat.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleSaveAttributes = async () => {
    try {
      await setTraderAttributes({
        trader_tier: traderTier,
        preferred_broker: preferredBroker,
        last_sync: new Date().toISOString(),
      });
      setStatusMessage('Trader attributes saved to RevenueCat customer profile.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to save attributes.');
    }
  };

  const handleRestore = async () => {
    setStatusMessage('Syncing with RevenueCat servers...');
    const result = await restorePurchases();
    if (result) {
      setStatusMessage('Entitlements restored successfully.');
    } else {
      setStatusMessage('No previous active purchases found.');
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border-2 border-indigo-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 relative flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#07090e] p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  REVENUECAT CUSTOMER CENTER
                </h2>
                <span className="px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-mono font-bold">
                  SDK v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Subscription Management & Account Entitlements
              </p>
            </div>
          </div>

          <button
            onClick={closeCustomerCenter}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {statusMessage && (
            <div className="bg-cyan-950/80 border border-cyan-500 text-cyan-300 p-3 rounded-xl text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Active Status Card */}
          <div className="bg-[#07090e] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  isPro
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {isPro ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">
                    {isPro ? 'ZEHER AI PRO SUBSCRIBER' : 'FREE TIER (LIMITED ACCESS)'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                      isPro
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isPro ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Entitlement: <span className="text-cyan-300">zeher_ai_pro</span>
                </div>
                {expirationDate && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Next renewal / expiry: {new Date(expirationDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div>
              {isPro ? (
                managementUrl ? (
                  <a
                    href={managementUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Manage Billing</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold">
                    ✓ Full Entitlement Active
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeCustomerCenter();
                    openPaywall();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-extrabold shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </div>

          {/* User ID Synchronizer */}
          <div className="bg-[#07090e] border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              RevenueCat App User ID
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Switch trader identifier or log in to sync entitlements across web terminals.
            </p>

            <form onSubmit={handleUpdateUserId} className="flex gap-2">
              <input
                type="text"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono flex-1 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. trader_john_doe"
              />
              <button
                type="submit"
                disabled={isUpdatingUser || !inputUserId.trim() || inputUserId === appUserId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-mono text-xs font-bold rounded-lg transition-colors"
              >
                {isUpdatingUser ? 'Syncing...' : 'Switch ID'}
              </button>
            </form>
          </div>

          {/* Trader Profile Attributes */}
          <div className="bg-[#07090e] border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Trader Attributes & Metadata
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Store custom metadata on your RevenueCat customer record.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  TRADER TIER
                </label>
                <select
                  value={traderTier}
                  onChange={(e) => setTraderTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="Retail">Retail Scalper</option>
                  <option value="PropFirm">Prop Firm Funded Trader</option>
                  <option value="Institutional">Institutional Asset Manager</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  PREFERRED BROKER
                </label>
                <select
                  value={preferredBroker}
                  onChange={(e) => setPreferredBroker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="Interactive Brokers">Interactive Brokers (IBKR)</option>
                  <option value="Binance">Binance Futures</option>
                  <option value="MetaTrader5">MetaTrader 5 (MT5)</option>
                  <option value="Alpaca">Alpaca Markets</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAttributes}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-xs font-bold rounded-lg transition-colors"
            >
              Save Attributes to RevenueCat
            </button>
          </div>

          {/* Sandbox / Testing Tools (Quick simulation switches) */}
          <div className="bg-[#07090e] border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                QA Sandbox & Development Controls
              </span>
              <button
                type="button"
                onClick={handleRestore}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Restore Purchases
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 font-mono">
              Quickly toggle Pro entitlement state to test UI behavior for subscriber vs non-subscriber modes.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={simulateUnlockPro}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 font-mono text-xs rounded-lg transition-colors"
              >
                <Unlock className="w-3 h-3" />
                <span>Simulate Pro Active</span>
              </button>
              <button
                type="button"
                onClick={simulateLockPro}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600/40 text-rose-300 font-mono text-xs rounded-lg transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Simulate Free Tier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#07090e] px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>API Key: test_HNNOMPaAq...</span>
          <button
            onClick={closeCustomerCenter}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
