import { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Server } from 'lucide-react';

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiDocumentationModal({ isOpen, onClose }: ApiDocumentationModalProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const curlCode = `curl -X POST https://ais-dev-nabcmhqmgcnh37ix6fsh4m-667156366472.asia-east1.run.app/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "mimeType": "image/png"
  }'`;

  const jsCode = `// Institutional Chart Analysis Query
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64ChartDataUrl, // base64 or data:image/png;base64,...
    mimeType: 'image/png'
  })
});

const { data, raw_json, execution_time_ms } = await response.json();
console.log("Ticker:", data.ticker);
console.log("Bias:", data.bias);
console.log("Entry Zone:", data.coordinates.entry_zone);
console.log("Stop Loss:", data.coordinates.stop_loss);
console.log("Take Profit 1:", data.coordinates.take_profit_1);`;

  const pythonCode = `import requests
import base64

# Read chart image file
with open("chart.png", "rb") as img_file:
    b64_str = base64.b64encode(img_file.read()).decode("utf-8")

payload = {
    "image": f"data:image/png;base64,{b64_str}",
    "mimeType": "image/png"
}

res = requests.post("https://ais-dev-nabcmhqmgcnh37ix6fsh4m-667156366472.asia-east1.run.app/api/analyze", json=payload)
result = res.json()

trade_data = result["data"]
print(f"Asset: {trade_data['ticker']} ({trade_data['timeframe']})")
print(f"Bias: {trade_data['bias']} | Confidence: {trade_data['confidence_score']}%")
print(f"SL: {trade_data['coordinates']['stop_loss']} | TP1: {trade_data['coordinates']['take_profit_1']}")`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'curl':
        return curlCode;
      case 'javascript':
        return jsCode;
      case 'python':
        return pythonCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold font-mono text-white">Zeher AI Engine API</h2>
              <p className="text-[11px] text-slate-400">Institutional REST Endpoint Specifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                POST
              </span>
              <span className="font-semibold text-white">/api/analyze</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Processes chart image and returns trade coordinates according to the strict JSON schema.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'curl'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveTab('javascript')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'javascript'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TypeScript / JS
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'python'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Block */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto">
            <pre>
              <code>{getActiveCode()}</code>
            </pre>
          </div>

          {/* Schema Requirements */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="font-bold text-slate-200 uppercase text-[11px] text-cyan-400">
              Guaranteed Output Schema
            </div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li><code className="text-slate-200">ticker</code>: Symbol string or "UNKNOWN"</li>
              <li><code className="text-slate-200">timeframe</code>: Chart timeframe or "UNKNOWN"</li>
              <li><code className="text-slate-200">bias</code>: "BULLISH" | "BEARISH" | "NEUTRAL"</li>
              <li><code className="text-slate-200">confidence_score</code>: Integer 0-100</li>
              <li><code className="text-slate-200">coordinates</code>: entry_zone, stop_loss, take_profit_1..3</li>
              <li><code className="text-slate-200">key_levels</code>: support and resistance float arrays</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
