import {
  Activity,
  Code,
  Cpu,
  Eye,
  FileJson,
  Sparkles,
  Send,
  Shield,
  Radio,
  Printer,
  FileSpreadsheet,
  Zap,
  User,
  Crown,
  Target,
  Database,
} from 'lucide-react';
import { WorkspaceTab } from '../types';
import { useRevenueCat } from '../context/RevenueCatContext';

interface HeaderProps {
  currentTab: WorkspaceTab;
  setCurrentTab: (tab: WorkspaceTab) => void;
  viewMode: 'split' | 'visual' | 'json';
  setViewMode: (mode: 'split' | 'visual' | 'json') => void;
  onOpenApiDocs: () => void;
  onOpenWebhookModal?: () => void;
  onOpenTradeMemoModal?: () => void;
  onOpenExecutionModal?: () => void;
  hasAnalysis: boolean;
}

export function Header({
  currentTab,
  setCurrentTab,
  viewMode,
  setViewMode,
  onOpenApiDocs,
  onOpenWebhookModal,
  onOpenTradeMemoModal,
  onOpenExecutionModal,
  hasAnalysis,
}: HeaderProps) {
  const { isPro, openPaywall, openCustomerCenter } = useRevenueCat();

  return (
    <header className="border-b border-slate-800 bg-[#07090e]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top Tier: Branding & Status */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#07090e] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white font-mono">ZEHER AI</h1>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                    v1.5 ENGINE
                  </span>
                  {isPro ? (
                    <button
                      onClick={openCustomerCenter}
                      className="px-2 py-0.2 text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                      title="RevenueCat Pro Entitlement Active"
                    >
                      <Crown className="w-2.5 h-2.5 text-emerald-400" />
                      <span>PRO PASS</span>
                    </button>
                  ) : (
                    <button
                      onClick={openPaywall}
                      className="px-2 py-0.2 text-[9px] font-mono font-bold uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded flex items-center gap-1 hover:brightness-110 shadow-sm"
                      title="Upgrade to Zeher Pro with RevenueCat"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      <span>UPGRADE</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Institutional Financial Chart Vision & Technical Analysis Engine
                </p>
              </div>
            </div>

            {/* Mobile Quick Action */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={openCustomerCenter}
                className="p-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded-md"
                title="Customer Center"
              >
                <User className="w-4 h-4" />
              </button>
              {hasAnalysis && onOpenTradeMemoModal && (
                <button
                  onClick={onOpenTradeMemoModal}
                  className="p-1.5 text-xs text-slate-950 font-bold bg-cyan-400 rounded-md"
                  title="Trade Sheet"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Engine Specs & Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400 border-r border-slate-800 pr-3">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini 2.5 Flash Vision</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400">Zero-Latency Sync</span>
              </div>
            </div>

            {/* RevenueCat Customer Center Trigger */}
            <button
              onClick={openCustomerCenter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-[#0b101b] hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-lg transition-all shadow-sm"
              title="RevenueCat Subscription & Account Management"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Account & Billing</span>
            </button>

            {/* Upgrade to Pro Button if not Pro */}
            {!isPro && (
              <button
                onClick={openPaywall}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock Pro</span>
              </button>
            )}

            {/* Export Trade Memo / Sheet Button */}
            {hasAnalysis && onOpenTradeMemoModal && (
              <button
                onClick={onOpenTradeMemoModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-200 hover:text-white bg-[#0b101b] hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Trade Sheet</span>
              </button>
            )}

            {/* Inspect Signal Ticket Quick Button */}
            {hasAnalysis && onOpenExecutionModal && (
              <button
                onClick={onOpenExecutionModal}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
              >
                <Target className="w-3.5 h-3.5 text-slate-950" />
                <span>Signal Ticket</span>
              </button>
            )}

            {/* Webhook Button */}
            {hasAnalysis && onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white bg-[#0b101b] hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg transition-all"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Signal Webhook</span>
              </button>
            )}

            {/* View Mode Controls (when on workspace) */}
            {currentTab === 'workspace' && (
              <div className="flex items-center bg-[#0b101b] border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    viewMode === 'split' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Split</span>
                </button>
                <button
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    viewMode === 'visual' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span className="hidden sm:inline">Terminal</span>
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    viewMode === 'json' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileJson className="w-3 h-3" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tier: Institutional Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-slate-800/80 font-mono text-xs">
          <button
            onClick={() => setCurrentTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'workspace'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Workspace</span>
          </button>

          <button
            onClick={() => setCurrentTab('compliance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'compliance'
                ? 'bg-neutral-900/80 text-emerald-300 border border-emerald-500/40 font-bold backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Risk & Portfolio Compliance</span>
          </button>

          <button
            onClick={() => setCurrentTab('signal_data')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'signal_data' || currentTab === 'signal_audit' || (currentTab as string) === 'webhook_logs'
                ? 'bg-neutral-900/80 text-cyan-300 border border-cyan-500/40 font-bold backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Signal Data</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('api_docs');
              onOpenApiDocs();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'api_docs'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Institutional API Docs</span>
          </button>
        </div>
      </div>
    </header>
  );
}

