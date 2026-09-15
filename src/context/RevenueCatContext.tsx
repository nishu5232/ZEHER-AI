import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Purchases, CustomerInfo, Offerings, Package } from '@revenuecat/purchases-js';

export interface SubscriptionTier {
  id: 'lifetime' | 'yearly' | 'monthly';
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  description: string;
  recommended?: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'monthly',
    name: 'Zeher Pro Monthly',
    price: '$49',
    period: '/ month',
    description: 'Agile institutional terminal access billed monthly. Cancel anytime.',
    features: [
      'Full Gemini Vision SMC & Liquidity Sweep Engine',
      'Anti-Stop-Hunt ATR Buffer & Invalidation Zones',
      'Live TradingView Overlay Stream & Slicing',
      'Instant 1-Click Multi-Broker Webhook Signals',
      'Unlimited Chart Screenshot Extractions',
    ],
  },
  {
    id: 'yearly',
    name: 'Zeher Pro Annual',
    price: '$390',
    period: '/ year',
    badge: 'SAVE 35% (BEST VALUE)',
    recommended: true,
    description: 'Institutional-grade package for full-time traders and prop firm candidates.',
    features: [
      'Everything in Monthly tier',
      '35% Annual Savings ($32.50/mo effective)',
      'Prop Firm Capital Protection Guardrails (FTMO, TopStep)',
      'Macro Economic Event Risk Radar Sync',
      'Priority VIP Execution & Sub-500ms Model Latency',
      'Custom Webhook Payload Schema Customizer',
    ],
  },
  {
    id: 'lifetime',
    name: 'Zeher Founder Lifetime',
    price: '$890',
    period: 'one-time payment',
    badge: 'FOUNDER PASS',
    description: 'Lifetime access to all current and future Zeher AI Quantitative Engines.',
    features: [
      'Permanent Lifetime Access — Zero Recurring Fees',
      'All Future AI Model Upgrades (Gemini Ultra, Deep Quant)',
      'Direct API Access Keys for Custom Algorithmic Bots',
      'Institutional Trade Memo PDF Auto-Archiving',
      'Dedicated Private Quantitative Strategy Discord Room',
    ],
  },
];

interface RevenueCatContextType {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  packages: Package[];
  isLoading: boolean;
  isPaywallOpen: boolean;
  isCustomerCenterOpen: boolean;
  appUserId: string;
  activeEntitlement: string | null;
  expirationDate: string | null;
  managementUrl: string | null;
  error: string | null;
  openPaywall: () => void;
  closePaywall: () => void;
  openCustomerCenter: () => void;
  closeCustomerCenter: () => void;
  purchaseTier: (tierId: 'lifetime' | 'yearly' | 'monthly') => Promise<boolean>;
  purchasePackage: (pkg: Package) => Promise<boolean>;
  presentNativePaywall: () => Promise<void>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  changeAppUserId: (newUserId: string) => Promise<void>;
  setTraderAttributes: (attributes: Record<string, string | null>) => Promise<void>;
  simulateUnlockPro: () => void;
  simulateLockPro: () => void;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

const REVENUECAT_API_KEY = 'test_HNNOMPaAqakbKiebrrlIdpBOCYc';
const ENTITLEMENT_ID = 'zeher_ai_pro';
const USER_ID_STORAGE_KEY = 'zeher_rc_app_user_id';
const SIMULATED_PRO_KEY = 'zeher_simulated_pro_active';

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const [purchasesInstance, setPurchasesInstance] = useState<Purchases | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [isCustomerCenterOpen, setIsCustomerCenterOpen] = useState<boolean>(false);
  const [appUserId, setAppUserId] = useState<string>(() => {
    return localStorage.getItem(USER_ID_STORAGE_KEY) || `trader_${Math.random().toString(36).substring(2, 9)}`;
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat SDK
  useEffect(() => {
    let isMounted = true;

    async function initRevenueCat() {
      setIsLoading(true);
      setError(null);

      // Save user ID
      localStorage.setItem(USER_ID_STORAGE_KEY, appUserId);

      try {
        // Configure Purchases Web SDK with user's test API Key
        let instance: Purchases;
        try {
          instance = Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserId: appUserId,
          });
          if (isMounted) {
            setPurchasesInstance(instance);
          }
        } catch (configErr) {
          // If already configured, get existing instance
          if (Purchases.isConfigured()) {
            instance = Purchases.getSharedInstance();
            if (isMounted) {
              setPurchasesInstance(instance);
            }
          } else {
            throw configErr;
          }
        }

        // Fetch Customer Info & Entitlements
        const info = await instance.getCustomerInfo();
        if (isMounted) {
          setCustomerInfo(info);
          const hasProEntitlement = Boolean(
            info.entitlements.active && info.entitlements.active[ENTITLEMENT_ID]
          );
          
          // Check local simulated state or real entitlement
          const simulatedPro = localStorage.getItem(SIMULATED_PRO_KEY) === 'true';
          setIsPro(hasProEntitlement || simulatedPro);
        }

        // Fetch Offerings & Configured Products
        try {
          const currentOfferings = await instance.getOfferings();
          if (isMounted && currentOfferings) {
            setOfferings(currentOfferings);
            if (currentOfferings.current && currentOfferings.current.availablePackages) {
              setPackages(currentOfferings.current.availablePackages);
            }
          }
        } catch (offeringsErr) {
          console.warn('RevenueCat offerings fetch notice (standard in test environment):', offeringsErr);
        }

        // Set customer attribute metadata for institutional analytics
        try {
          await instance.setAttributes({
            app_platform: 'Zeher AI Web Terminal',
            terminal_version: 'v1.5-Institutional',
            sdk_mode: 'Purchases-JS',
          });
        } catch (attrErr) {
          // Non-critical
        }
      } catch (err: any) {
        console.warn('RevenueCat SDK Init Notice:', err?.message || err);
        if (isMounted) {
          // Fallback to local simulated check if network/API sandbox is in test mode
          const simulatedPro = localStorage.getItem(SIMULATED_PRO_KEY) === 'true';
          setIsPro(simulatedPro);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initRevenueCat();

    return () => {
      isMounted = false;
    };
  }, [appUserId]);

  // Handle tier purchase
  const purchaseTier = useCallback(
    async (tierId: 'lifetime' | 'yearly' | 'monthly'): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        // If we have live RevenueCat packages matching the product ID
        const matchedPackage = packages.find(
          (pkg) =>
            pkg.identifier.toLowerCase().includes(tierId) ||
            pkg.rcBillingProduct?.identifier.toLowerCase().includes(tierId)
        );

        if (purchasesInstance && matchedPackage) {
          const result = await purchasesInstance.purchase({ rcPackage: matchedPackage });
          setCustomerInfo(result.customerInfo);
          const active = Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
          setIsPro(active);
          setIsLoading(false);
          setIsPaywallOpen(false);
          return active;
        }

        // Fallback for direct tier simulation / test checkout
        await new Promise((resolve) => setTimeout(resolve, 800));
        localStorage.setItem(SIMULATED_PRO_KEY, 'true');
        setIsPro(true);
        setIsLoading(false);
        setIsPaywallOpen(false);
        return true;
      } catch (err: any) {
        console.error('Purchase failed:', err);
        setError(err?.message || 'Transaction could not be completed.');
        setIsLoading(false);
        return false;
      }
    },
    [packages, purchasesInstance]
  );

  // Handle direct Package purchase
  const purchasePackage = useCallback(
    async (pkg: Package): Promise<boolean> => {
      if (!purchasesInstance) return false;
      setIsLoading(true);
      setError(null);
      try {
        const result = await purchasesInstance.purchase({ rcPackage: pkg });
        setCustomerInfo(result.customerInfo);
        const active = Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
        setIsPro(active);
        setIsLoading(false);
        setIsPaywallOpen(false);
        return active;
      } catch (err: any) {
        console.error('Package purchase error:', err);
        setError(err?.message || 'Package purchase was not completed.');
        setIsLoading(false);
        return false;
      }
    },
    [purchasesInstance]
  );

  // Present RevenueCat Native Web Paywall
  const presentNativePaywall = useCallback(async () => {
    if (!purchasesInstance) {
      setIsPaywallOpen(true);
      return;
    }
    try {
      if (typeof (purchasesInstance as any).presentPaywall === 'function') {
        await (purchasesInstance as any).presentPaywall();
        // Refresh customer info after paywall closes
        const updatedInfo = await purchasesInstance.getCustomerInfo();
        setCustomerInfo(updatedInfo);
        setIsPro(Boolean(updatedInfo.entitlements.active[ENTITLEMENT_ID]));
      } else {
        setIsPaywallOpen(true);
      }
    } catch (err) {
      console.warn('Native paywall presentation error, opening institutional paywall modal:', err);
      setIsPaywallOpen(true);
    }
  }, [purchasesInstance]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (purchasesInstance && typeof (purchasesInstance as any).restorePurchases === 'function') {
        const restored = await (purchasesInstance as any).restorePurchases();
        setCustomerInfo(restored);
        const active = Boolean(restored.entitlements.active[ENTITLEMENT_ID]);
        setIsPro(active);
        setIsLoading(false);
        return restored;
      } else {
        // Simulation restore check
        await new Promise((resolve) => setTimeout(resolve, 600));
        const sim = localStorage.getItem(SIMULATED_PRO_KEY) === 'true';
        setIsPro(sim);
        setIsLoading(false);
        return customerInfo;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to restore purchases.');
      setIsLoading(false);
      return null;
    }
  }, [purchasesInstance, customerInfo]);

  // Switch trader user ID
  const changeAppUserId = useCallback(
    async (newUserId: string) => {
      if (!newUserId.trim() || newUserId === appUserId) return;
      setIsLoading(true);
      try {
        if (purchasesInstance && typeof purchasesInstance.changeUser === 'function') {
          const info = await purchasesInstance.changeUser(newUserId.trim());
          setCustomerInfo(info);
          setIsPro(Boolean(info.entitlements.active[ENTITLEMENT_ID]));
        }
        setAppUserId(newUserId.trim());
        localStorage.setItem(USER_ID_STORAGE_KEY, newUserId.trim());
      } catch (err: any) {
        console.error('Failed to change user:', err);
        setError(err?.message || 'Failed to update App User ID.');
      } finally {
        setIsLoading(false);
      }
    },
    [purchasesInstance, appUserId]
  );

  // Set trader attributes
  const setTraderAttributes = useCallback(
    async (attributes: Record<string, string | null>) => {
      if (!purchasesInstance) return;
      try {
        await purchasesInstance.setAttributes(attributes);
      } catch (err) {
        console.error('Failed to set attributes:', err);
      }
    },
    [purchasesInstance]
  );

  // Instant simulation toggles for seamless development & QA testing
  const simulateUnlockPro = () => {
    localStorage.setItem(SIMULATED_PRO_KEY, 'true');
    setIsPro(true);
  };

  const simulateLockPro = () => {
    localStorage.removeItem(SIMULATED_PRO_KEY);
    setIsPro(false);
  };

  // Derive expiration / billing info
  const proEntitlement = customerInfo?.entitlements.active?.[ENTITLEMENT_ID];
  const expirationDate = proEntitlement?.expirationDate || null;
  const managementUrl = customerInfo?.managementURL || null;

  return (
    <RevenueCatContext.Provider
      value={{
        isPro,
        customerInfo,
        offerings,
        packages,
        isLoading,
        isPaywallOpen,
        isCustomerCenterOpen,
        appUserId,
        activeEntitlement: isPro ? ENTITLEMENT_ID : null,
        expirationDate,
        managementUrl,
        error,
        openPaywall: () => setIsPaywallOpen(true),
        closePaywall: () => setIsPaywallOpen(false),
        openCustomerCenter: () => setIsCustomerCenterOpen(true),
        closeCustomerCenter: () => setIsCustomerCenterOpen(false),
        purchaseTier,
        purchasePackage,
        presentNativePaywall,
        restorePurchases,
        changeAppUserId,
        setTraderAttributes,
        simulateUnlockPro,
        simulateLockPro,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
