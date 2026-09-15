import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Shield,
  Zap,
  Lock,
  Star,
  RefreshCw,
  X,
  CreditCard,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Radio,
  Tag,
} from 'lucide-react';
import { useRevenueCat, SUBSCRIPTION_TIERS, SubscriptionTier } from '../context/RevenueCatContext';

export function RevenueCatPaywallModal() {
  const {
    isPaywallOpen,
    closePaywall,
    purchaseTier,
    presentNativePaywall,
    restorePurchases,
    isLoading,
    isPro,
    error,
    appUserId,
  } = useRevenueCat();

  const [selectedTierId, setSelectedTierId] = useState<'lifetime' | 'yearly' | 'monthly'>('yearly');
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoDiscountPct, setPromoDiscountPct] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  if (!isPaywallOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'ZEHERVIP' || clean === 'PROTRADER' || clean === 'SMC2026') {
      setIsPromoApplied(true);
      setPromoDiscountPct(20);
    } else if (clean === 'ALPHA50') {
      setIsPromoApplied(true);
      setPromoDiscountPct(50);
    } else {
      alert('Invalid or expired institutional coupon code.');
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    setPurchaseSuccess(false);
    try {
      const success = await purchaseTier(selectedTierId);
      if (success) {
        setPurchaseSuccess(true);
        setTimeout(() => {
          closePaywall();
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTier = SUBSCRIPTION_TIERS.find((t) => t.id === selectedTierId) || SUBSCRIPTION_TIERS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border-2 border-cyan-500/50 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#07090e] via-[#0e1628] to-[#07090e] p-6 border-b border-slate-800 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                  ZEHER AI PRO TERMINAL
                </h2>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase">
                  RevenueCat Web SDK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Unlock full institutional smart money order flow analysis, Anti-Stop-Hunt ATR buffers, and zero-latency multi-broker webhook execution.
              </p>
            </div>
          </div>

          <button
            onClick={closePaywall}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors z-10"
            title="Close Paywall"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Success Banner */}
          {purchaseSuccess && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
              <Check className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="font-bold text-sm">Entitlement Activated: zeher_ai_pro</div>
                <div className="text-xs text-emerald-400">Welcome to Zeher AI Pro. All features unlocked!</div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-500 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3 Tier Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUBSCRIPTION_TIERS.map((tier) => {
              const isSelected = selectedTierId === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#101b33] to-[#0a1020] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                      : 'bg-[#07090e] border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  {tier.badge && (
                    <span
                      className={`absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase shadow-md ${
                        tier.id === 'yearly'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white font-mono">{tier.name}</h3>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-2xl font-extrabold text-white font-mono">
                        {isPromoApplied ? (
                          <>
                            <span className="line-through text-slate-500 text-lg mr-1.5">{tier.price}</span>
                            <span>
                              $
                              {(
                                parseFloat(tier.price.replace('$', '')) *
                                (1 - promoDiscountPct / 100)
                              ).toFixed(0)}
                            </span>
                          </>
                        ) : (
                          tier.price
                        )}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{tier.period}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{tier.description}</p>

                    <div className="space-y-2 border-t border-slate-800/80 pt-3">
                      {tier.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Coupon / Promo Code Field */}
          <div className="bg-[#07090e] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono w-full sm:w-auto">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span>Have an institutional trader access code?</span>
            </div>

            <form onSubmit={handleApplyPromo} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="e.g. ZEHERVIP"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={isPromoApplied}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-cyan-500 flex-1 sm:w-36"
              />
              <button
                type="submit"
                disabled={isPromoApplied || !promoCode.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 font-mono text-xs font-bold rounded-lg transition-colors"
              >
                {isPromoApplied ? `✓ -${promoDiscountPct}% Applied` : 'Apply Code'}
              </button>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono flex flex-col gap-1 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted 256-bit RevenueCat Web Billing</span>
              </div>
              <span className="text-[10px] text-slate-500">App User ID: {appUserId}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={presentNativePaywall}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5"
                title="Trigger RevenueCat Web Native Paywall Component"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>RevenueCat Paywall</span>
              </button>

              <button
                type="button"
                onClick={handlePurchase}
                disabled={isProcessing || isLoading}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold font-mono text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Unlock {selectedTier.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#07090e] px-6 py-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>Entitlement: zeher_ai_pro</span>
            <span>•</span>
            <button
              onClick={restorePurchases}
              className="text-cyan-400 hover:underline"
            >
              Restore Purchases
            </button>
          </div>

          <div>Auto-renewing subscription. Cancel anytime from Customer Center.</div>
        </div>
      </div>
    </div>
  );
}
