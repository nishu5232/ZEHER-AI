import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChartUploader } from './components/ChartUploader';
import { ChartOverlayStage } from './components/ChartOverlayStage';
import { AnalysisResultsDashboard } from './components/AnalysisResultsDashboard';
import { JsonInspector } from './components/JsonInspector';
import { ApiDocumentationModal } from './components/ApiDocumentationModal';
import { BrokerWebhookModal } from './components/BrokerWebhookModal';
import { TradeMemoReportModal } from './components/TradeMemoReportModal';
import { RiskComplianceView } from './components/RiskComplianceView';
import { SignalHistoryAuditView } from './components/SignalHistoryAuditView';
import { BrokerWebhookLogsView } from './components/BrokerWebhookLogsView';
import { LivePriceAlertBanner } from './components/LivePriceAlertBanner';
import { LiveExecutionTicketModal } from './components/LiveExecutionTicketModal';
import { RevenueCatProvider } from './context/RevenueCatContext';
import { RevenueCatPaywallModal } from './components/RevenueCatPaywallModal';
import { RevenueCatCustomerCenterModal } from './components/RevenueCatCustomerCenterModal';
import {
  ChartAnalysisResult,
  SampleChart,
  AnalysisState,
  Coordinates,
  WorkspaceTab,
  LivePriceAlert,
  LiveOrderTicket,
} from './types';
import { getSampleCharts } from './utils/chartGenerator';
import { captureTradingViewLiveSnapshot } from './utils/liveChartCapture';
import { recalculateCoordinatesForTimeframe } from './utils/timeframeRecalibrator';
import { generateFallbackAnalysisResult } from './utils/fallbackAnalysisGenerator';
import { analyzeChartWithFastAPI } from './services/liveChartService';
import {
  evaluatePriceTickForAlerts,
  createInitialTracker,
  AlertTriggerTracker,
} from './services/liveAlertManager';
import { ShieldAlert } from 'lucide-react';

function ZeherAppContent() {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('workspace');
  const [viewMode, setViewMode] = useState<'split' | 'visual' | 'json'>('split');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [sampleCharts, setSampleCharts] = useState<SampleChart[]>([]);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isTradeMemoModalOpen, setIsTradeMemoModalOpen] = useState(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Timeframe execution filter state (default 15m)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const [selectedTicker, setSelectedTicker] = useState<string>('BTC/USD');

  // Real-time Invalidation & Target Alerts state
  const [alerts, setAlerts] = useState<LivePriceAlert[]>([]);
  const [alertTracker, setAlertTracker] = useState<AlertTriggerTracker>(createInitialTracker());
  const [currentLivePrice, setCurrentLivePrice] = useState<number | null>(null);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
    rawJson: null,
    executionTimeMs: null,
  });

  // Handle incoming live price tick
  const handlePriceTick = (price: number) => {
    setCurrentLivePrice(price);
    if (analysisState.result) {
      const { newAlerts, updatedTracker } = evaluatePriceTickForAlerts(
        price,
        analysisState.result,
        alertTracker
      );
      setAlertTracker(updatedTracker);
      if (newAlerts.length > 0) {
        setAlerts((prev) => [...newAlerts, ...prev]);
      }
    }
  };

  // Handle dynamic timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);

    setAnalysisState((prev) => {
      if (!prev.result) return prev;

      const recalibrated = recalculateCoordinatesForTimeframe(prev.result, timeframe);
      return {
        ...prev,
        result: recalibrated,
        rawJson: JSON.stringify(recalibrated, null, 2),
      };
    });
  };

  // Initialize sample charts on client mount
  useEffect(() => {
    const samples = getSampleCharts();
    setSampleCharts(samples);
    if (samples.length > 0) {
      setSelectedImage(samples[0].imageDataUrl);
      setImageName(samples[0].name);
      setSelectedSampleId(samples[0].id);
      setSelectedTimeframe(samples[0].timeframe || '15m');
      if (samples[0].ticker) {
        setSelectedTicker(samples[0].ticker);
      }
    }
  }, []);

  const handleSelectSample = (sample: SampleChart) => {
    setSelectedSampleId(sample.id);
    setSelectedImage(sample.imageDataUrl);
    setImageName(sample.name);
    if (sample.timeframe) {
      setSelectedTimeframe(sample.timeframe);
    }
    if (sample.ticker) {
      setSelectedTicker(sample.ticker);
    }
    // Instantly reset previous analysis state and alerts tracker to prevent cross-asset visual artifacts
    setAlertTracker(createInitialTracker());
    setAlerts([]);
    setAnalysisState({
      isLoading: false,
      error: null,
      result: null,
      rawJson: null,
      executionTimeMs: null,
    });
  };

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker);
    setAlertTracker(createInitialTracker());
    setAlerts([]);
    setAnalysisState({
      isLoading: false,
      error: null,
      result: null,
      rawJson: null,
      executionTimeMs: null,
    });
  };

  const handleImageSelected = (dataUrl: string, name?: string) => {
    setSelectedImage(dataUrl);
    setImageName(name || 'Custom Uploaded Chart');
    setSelectedSampleId(null);
    setAlertTracker(createInitialTracker());
    setAlerts([]);
    setAnalysisState({
      isLoading: false,
      error: null,
      result: null,
      rawJson: null,
      executionTimeMs: null,
    });
  };

  // Run Vision & Technical Analysis Engine
  const handleRunAnalysis = async () => {
    // Reset alert tracking on fresh analysis run
    setAlertTracker(createInitialTracker());
    setAlerts([]);

    let imageToAnalyze = selectedImage;
    if (!imageToAnalyze) {
      imageToAnalyze = captureTradingViewLiveSnapshot(selectedTicker, selectedTimeframe);
      setSelectedImage(imageToAnalyze);
      setImageName(`Live TradingView [${selectedTicker}]`);
    }

    setAnalysisState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Safety guardrail 3-second AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    const startTime = Date.now();

    try {
      const fastApiResponse = await analyzeChartWithFastAPI({
        image: imageToAnalyze,
        mimeType: imageToAnalyze.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        timeframe: selectedTimeframe,
        ticker: selectedTicker,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const resultData = fastApiResponse.data as ChartAnalysisResult;

      // Update active ticker state if detected
      if (resultData.ticker && resultData.ticker !== 'UNKNOWN') {
        setSelectedTicker(resultData.ticker);
      }

      setAnalysisState({
        isLoading: false,
        error: null,
        result: resultData,
        rawJson: fastApiResponse.raw_json,
        executionTimeMs: fastApiResponse.execution_time_ms || (Date.now() - startTime),
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Vision analysis notice, activating 3s fallback safety guardrail:', err);

      // Immediately generate fallback structured analysis coordinates anchored to live price so the UI renders without hanging
      const fallbackResult = generateFallbackAnalysisResult(
        selectedTicker,
        selectedTimeframe,
        currentLivePrice || undefined
      );

      setAnalysisState({
        isLoading: false,
        error: null,
        result: fallbackResult,
        rawJson: JSON.stringify(fallbackResult, null, 2),
        executionTimeMs: Math.min(Date.now() - startTime, 3000),
      });
    } finally {
      clearTimeout(timeoutId);
      // Guaranteed state reset to unmount all loading spinners instantly
      setAnalysisState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  // Drag-to-Adjust Real-Time Coordinate Update Handler
  const handleUpdateCoordinates = (newCoords: Coordinates) => {
    setAnalysisState((prev) => {
      if (!prev.result) return prev;

      const originalCoords = prev.result.original_coordinates || { ...prev.result.coordinates };
      const updatedResult: ChartAnalysisResult = {
        ...prev.result,
        coordinates: newCoords,
        original_coordinates: originalCoords,
      };

      return {
        ...prev,
        result: updatedResult,
        rawJson: JSON.stringify(updatedResult, null, 2),
      };
    });
  };

  // Reset coordinates back to AI vision model coordinates
  const handleResetCoordinates = () => {
    setAnalysisState((prev) => {
      if (!prev.result || !prev.result.original_coordinates) return prev;

      const restoredResult: ChartAnalysisResult = {
        ...prev.result,
        coordinates: { ...prev.result.original_coordinates },
        original_coordinates: undefined,
      };

      return {
        ...prev,
        result: restoredResult,
        rawJson: JSON.stringify(restoredResult, null, 2),
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Institutional Header with Navigation Tabs */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        onOpenTradeMemoModal={() => setIsTradeMemoModalOpen(true)}
        onOpenExecutionModal={() => setIsExecutionModalOpen(true)}
        hasAnalysis={!!analysisState.result}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* Real-Time Price Invalidation & Target Alerts Banner HUD */}
        {analysisState.result && (
          <LivePriceAlertBanner
            alerts={alerts}
            currentPrice={currentLivePrice}
            analysis={analysisState.result}
            onClearAlerts={() => setAlerts([])}
            onDismissAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
          />
        )}

        {/* Error Banner */}
        {analysisState.error && (
          <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-4 flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-mono">
              <div className="font-bold text-rose-300 uppercase tracking-wider mb-0.5">
                Analysis Engine Exception
              </div>
              <div className="text-rose-200">{analysisState.error}</div>
            </div>
          </div>
        )}

        {/* TAB 1: LIVE WORKSPACE */}
        {currentTab === 'workspace' && (
          <>
            {/* Input & Chart Selector Component */}
            <ChartUploader
              onImageSelected={handleImageSelected}
              onAnalyze={handleRunAnalysis}
              selectedImage={selectedImage}
              imageName={imageName}
              isLoading={analysisState.isLoading}
              sampleCharts={sampleCharts}
              onSelectSample={handleSelectSample}
              selectedSampleId={selectedSampleId}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
            />

            {/* Workspace Display Mode */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Visual Chart Stage with Drag-to-Adjust Overlay */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <ChartOverlayStage
                    imageSrc={selectedImage}
                    analysis={analysisState.result}
                    isLoading={analysisState.isLoading}
                    onUpdateCoordinates={handleUpdateCoordinates}
                    onResetCoordinates={handleResetCoordinates}
                    selectedTicker={selectedTicker}
                    selectedTimeframe={selectedTimeframe}
                    onPriceTick={handlePriceTick}
                    currentLivePrice={currentLivePrice}
                  />
                </div>

                {/* Right Column: Institutional Terminal Dashboard & JSON Inspector Tabs */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <AnalysisResultsDashboard
                    result={analysisState.result}
                    executionTimeMs={analysisState.executionTimeMs}
                    isLoading={analysisState.isLoading}
                    onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
                    onOpenTradeMemoModal={() => setIsTradeMemoModalOpen(true)}
                    onOpenExecutionTicketModal={() => setIsExecutionModalOpen(true)}
                  />

                  {analysisState.result && (
                    <div className="mt-2">
                      <JsonInspector
                        rawJson={analysisState.rawJson}
                        result={analysisState.result}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'visual' && (
              <div className="w-full">
                <ChartOverlayStage
                  imageSrc={selectedImage}
                  analysis={analysisState.result}
                  isLoading={analysisState.isLoading}
                  onUpdateCoordinates={handleUpdateCoordinates}
                  onResetCoordinates={handleResetCoordinates}
                  selectedTicker={selectedTicker}
                  selectedTimeframe={selectedTimeframe}
                  onPriceTick={handlePriceTick}
                  currentLivePrice={currentLivePrice}
                />
              </div>
            )}

            {viewMode === 'json' && (
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                <AnalysisResultsDashboard
                  result={analysisState.result}
                  executionTimeMs={analysisState.executionTimeMs}
                  isLoading={analysisState.isLoading}
                  onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
                  onOpenTradeMemoModal={() => setIsTradeMemoModalOpen(true)}
                  onOpenExecutionTicketModal={() => setIsExecutionModalOpen(true)}
                />

                {analysisState.result && (
                  <JsonInspector
                    rawJson={analysisState.rawJson}
                    result={analysisState.result}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* TAB 2: RISK & COMPLIANCE VIEW */}
        {currentTab === 'compliance' && (
          <RiskComplianceView
            activeResult={analysisState.result}
            onOpenTradeMemoModal={() => setIsTradeMemoModalOpen(true)}
          />
        )}

        {/* TAB 3: SIGNAL DATABASE & HISTORICAL AUDIT VIEW */}
        {(currentTab === 'signal_audit' || (currentTab as string) === 'webhook_logs') && (
          <SignalHistoryAuditView
            activeResult={analysisState.result}
            onOpenSignalModal={() => setIsExecutionModalOpen(true)}
          />
        )}
      </main>

      {/* API Documentation Modal */}
      <ApiDocumentationModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />

      {/* Webhook Dispatch Modal */}
      {analysisState.result && (
        <BrokerWebhookModal
          isOpen={isWebhookModalOpen}
          onClose={() => setIsWebhookModalOpen(false)}
          result={analysisState.result}
        />
      )}

      {/* Live Interactive Execution Ticket Modal */}
      {analysisState.result && (
        <LiveExecutionTicketModal
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          result={analysisState.result}
        />
      )}

      {/* Trade Memo Modal */}
      {analysisState.result && (
        <TradeMemoReportModal
          isOpen={isTradeMemoModalOpen}
          onClose={() => setIsTradeMemoModalOpen(false)}
          result={analysisState.result}
          imageSrc={selectedImage}
        />
      )}

      {/* RevenueCat Paywall Modal */}
      <RevenueCatPaywallModal />

      {/* RevenueCat Customer Center Modal */}
      <RevenueCatCustomerCenterModal />
    </div>
  );
}

export function App() {
  return (
    <RevenueCatProvider>
      <ZeherAppContent />
    </RevenueCatProvider>
  );
}

export default App;
