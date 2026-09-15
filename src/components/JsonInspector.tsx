import { useState } from 'react';
import { Copy, Check, Download, FileJson, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ChartAnalysisResult } from '../types';

interface JsonInspectorProps {
  rawJson: string | null;
  result: ChartAnalysisResult | null;
}

export function JsonInspector({ rawJson, result }: JsonInspectorProps) {
  const [copied, setCopied] = useState(false);

  const formattedJson = result ? JSON.stringify(result, null, 2) : rawJson || '{}';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ticker = result?.ticker ? result.ticker.replace(/[^a-zA-Z0-9]/g, '_') : 'analysis';
    const filename = `zeher_${ticker}_${Date.now()}.json`;
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            Strict Output Format JSON
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
            <ShieldCheck className="w-3 h-3" />
            Schema Validated
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="p-4 bg-[#090d16] flex-1 overflow-auto max-h-[650px]">
        {result || rawJson ? (
          <pre className="font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre">
            <code>{formattedJson}</code>
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 h-64 text-center">
            <FileJson className="w-10 h-10 text-slate-700 mb-2" />
            <p className="font-mono text-xs text-slate-400">No JSON Generated Yet</p>
            <p className="font-mono text-[11px] text-slate-600 mt-0.5">
              Execute the vision engine to inspect the raw structured JSON payload.
            </p>
          </div>
        )}
      </div>

      {/* Schema Verification Footer */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>Required: ticker, timeframe, bias, confidence_score, coordinates, key_levels</span>
        <span className="text-emerald-400">Type.OBJECT Strict</span>
      </div>
    </div>
  );
}
