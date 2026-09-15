import { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Clock,
  Radio,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getMacroNewsRadar } from '../utils/backtestNewsService';
import { MacroNewsEvent } from '../data/backtestAndNewsData';

interface MacroNewsRadarCardProps {
  ticker: string;
}

export function MacroNewsRadarCard({ ticker }: MacroNewsRadarCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const radarData = getMacroNewsRadar(ticker);
  const { events, hasImminentHighRisk, imminentEvent, overallStatus } = radarData;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        hasImminentHighRisk
          ? 'bg-[#150a0f] border-rose-600/70 shadow-lg shadow-rose-950/40'
          : overallStatus === 'CAUTION'
          ? 'bg-[#14100b] border-amber-500/40'
          : 'bg-[#0b101b] border-slate-800/90'
      } p-4 lg:p-5 font-mono shadow-xl`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              hasImminentHighRisk
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Macro Risk Radar & Liquidity Guardrails
              </h3>
              <span className="flex h-2 w-2 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    hasImminentHighRisk ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    hasImminentHighRisk ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                ></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Live Macro Liquidity Shock & Institutional Spread Guardrails
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {hasImminentHighRisk ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HIGH VOLATILITY RISK</span>
            </div>
          ) : overallStatus === 'CAUTION' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>MACRO EVENT &lt; 2H</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CLEAR EXECUTION WINDOW</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-[#07090e] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Toggle Calendar Details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* High-Risk Active Guardrail Banner (If event <= 60 mins) */}
      {hasImminentHighRisk && imminentEvent && (
        <div className="mt-3 bg-rose-950/80 border border-rose-600/70 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Flame className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-200 uppercase tracking-wide flex items-center gap-2">
                <span>HIGH VOLATILITY RISK: Spread widening likely</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900 border border-rose-500 text-rose-200">
                  {imminentEvent.timeLabel}
                </span>
              </div>
              <p className="text-[11px] text-rose-300/90 mt-0.5">
                {imminentEvent.title} release in {imminentEvent.timeOffsetMinutes} minutes. Expected spread spike:{' '}
                <span className="font-bold text-rose-100">{imminentEvent.spreadImpact}</span>. Slippage risk elevated.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 self-end sm:self-center">
            <span className="px-2.5 py-1 rounded bg-rose-900 border border-rose-500/80 text-rose-100 text-[11px] font-bold tracking-wider">
              {imminentEvent.recommendation === 'STAND_ASIDE' ? 'STAND ASIDE / DELAY ORDER' : 'REDUCE POSITION 50%'}
            </span>
          </div>
        </div>
      )}

      {/* Collapsible Economic Calendar Events List */}
      <div className={`mt-3 space-y-2 ${!isExpanded && !hasImminentHighRisk ? 'hidden sm:block' : ''}`}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Upcoming High-Impact Catalysts ({ticker})</span>
          <span className="text-slate-500 text-[9px]">UTC Synced • Tier-1 Institutional Feeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {events.map((evt: MacroNewsEvent) => {
            const isImminent = evt.timeOffsetMinutes <= 60 && evt.impact === 'HIGH';
            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-lg border flex flex-col justify-between text-xs ${
                  isImminent
                    ? 'bg-rose-950/40 border-rose-500/40'
                    : evt.impact === 'HIGH'
                    ? 'bg-[#07090e] border-slate-800'
                    : 'bg-[#07090e]/60 border-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evt.impact === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {evt.impact}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[170px]">
                      {evt.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isImminent ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                    }`}
                  >
                    {evt.timeLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    {evt.forecast && <span>Forecast: <strong className="text-slate-300">{evt.forecast}</strong></span>}
                    {evt.previous && <span>Prev: <strong className="text-slate-300">{evt.previous}</strong></span>}
                  </div>
                  <span className="text-slate-400 text-[9px]">{evt.spreadImpact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
