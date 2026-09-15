import { SampleChart } from '../types';

// Utility to generate realistic institutional candlestick chart images as Data URLs
export function generateSyntheticChartImage(config: {
  ticker: string;
  timeframe: string;
  category: 'Crypto' | 'Forex' | 'Stocks' | 'Indices' | 'Commodities';
  trend: 'bullish' | 'bearish' | 'range';
  basePrice: number;
  priceStep: number;
  decimals: number;
  candlesCount: number;
  patternLabel?: string;
  hasCroppedText?: boolean;
}): string {
  const width = 1200;
  const height = 675;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0a0d14');
  bgGradient.addColorStop(1, '#0e131d');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Grid layout parameters
  const chartLeft = 50;
  const chartRight = width - 110;
  const chartTop = 60;
  const chartBottom = height - 70;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const horizontalGridSteps = 8;
  for (let i = 0; i <= horizontalGridSteps; i++) {
    const y = chartTop + (chartHeight / horizontalGridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
  }

  const verticalGridSteps = 10;
  for (let i = 0; i <= verticalGridSteps; i++) {
    const x = chartLeft + (chartWidth / verticalGridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(x, chartTop);
    ctx.lineTo(x, chartBottom);
    ctx.stroke();
  }

  // Generate Candlestick Data
  const candles: { open: number; high: number; low: number; close: number; vol: number }[] = [];
  let currentPrice = config.basePrice;
  const count = config.candlesCount || 48;
  const step = config.priceStep;

  // Deterministic seed simulation
  for (let i = 0; i < count; i++) {
    let bias = 0;
    if (config.trend === 'bullish') {
      bias = i > count * 0.6 ? 0.8 : 0.2;
    } else if (config.trend === 'bearish') {
      bias = i > count * 0.6 ? -0.8 : -0.2;
    } else {
      bias = Math.sin(i * 0.3) * 0.5;
    }

    const change = (Math.random() - 0.48 + bias * 0.4) * step;
    const open = currentPrice;
    let close = open + change;
    let high = Math.max(open, close) + Math.random() * (step * 0.7);
    let low = Math.min(open, close) - Math.random() * (step * 0.7);

    // Key structural inflection near end
    if (i === Math.floor(count * 0.75) && config.trend === 'bullish') {
      // Bullish breaker / Order block tap
      low = open - step * 1.5;
      close = open + step * 1.8;
      high = close + step * 0.3;
    } else if (i === Math.floor(count * 0.75) && config.trend === 'bearish') {
      // Bearish CHoCH
      high = open + step * 1.5;
      close = open - step * 1.8;
      low = close - step * 0.3;
    }

    currentPrice = close;
    const vol = Math.random() * 80 + 20;
    candles.push({ open, high, low, close, vol });
  }

  // Calculate Price Range
  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.996;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.004;
  const priceRange = maxPrice - minPrice;

  const getCanvasY = (price: number) => {
    return chartBottom - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Draw Moving Averages (EMA 20 & EMA 50)
  const ema20Points: { x: number; y: number }[] = [];
  const ema50Points: { x: number; y: number }[] = [];
  let prevEma20 = candles[0].close;
  let prevEma50 = candles[0].close;
  const candleSpacing = chartWidth / count;

  candles.forEach((c, idx) => {
    const k20 = 2 / (20 + 1);
    const k50 = 2 / (50 + 1);
    prevEma20 = c.close * k20 + prevEma20 * (1 - k20);
    prevEma50 = c.close * k50 + prevEma50 * (1 - k50);
    const x = chartLeft + (idx + 0.5) * candleSpacing;
    ema20Points.push({ x, y: getCanvasY(prevEma20) });
    ema50Points.push({ x, y: getCanvasY(prevEma50) });
  });

  // Render EMA 50 (Blue)
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ema50Points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Render EMA 20 (Orange)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ema20Points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Draw Candlesticks and Volume
  candles.forEach((c, idx) => {
    const x = chartLeft + idx * candleSpacing;
    const centerX = x + candleSpacing * 0.5;
    const isGreen = c.close >= c.open;
    const bodyTop = getCanvasY(Math.max(c.open, c.close));
    const bodyBottom = getCanvasY(Math.min(c.open, c.close));
    const bodyHeight = Math.max(2, bodyBottom - bodyTop);
    const wickTop = getCanvasY(c.high);
    const wickBottom = getCanvasY(c.low);

    const candleWidth = Math.max(3, candleSpacing * 0.7);

    // Wick
    ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(centerX, wickTop);
    ctx.lineTo(centerX, wickBottom);
    ctx.stroke();

    // Body
    ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
    ctx.fillRect(centerX - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

    // Volume bar at bottom
    const volHeight = (c.vol / 100) * 45;
    ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(centerX - candleWidth / 2, chartBottom - volHeight, candleWidth, volHeight);
  });

  // Draw Price Scale on Right
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= horizontalGridSteps; i++) {
    const y = chartTop + (chartHeight / horizontalGridSteps) * i;
    const price = maxPrice - (i / horizontalGridSteps) * priceRange;
    ctx.fillText(price.toFixed(config.decimals), chartRight + 10, y);
  }

  // Draw current price tag
  const lastClose = candles[candles.length - 1].close;
  const lastY = getCanvasY(lastClose);
  const isUp = candles[candles.length - 1].close >= candles[candles.length - 1].open;
  ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
  ctx.fillRect(chartRight + 2, lastY - 10, 95, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText(lastClose.toFixed(config.decimals), chartRight + 10, lastY);

  // Draw Time Scale at Bottom
  ctx.fillStyle = '#64748b';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const times = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '00:00', '04:00'];
  for (let i = 0; i < times.length; i++) {
    const x = chartLeft + (chartWidth / (times.length - 1)) * i;
    ctx.fillText(times[i], x, chartBottom + 12);
  }

  // Draw Chart Header / Watermark
  if (!config.hasCroppedText) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillText(`${config.ticker}`, chartLeft, 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(` • ${config.timeframe} • ${config.category.toUpperCase()}`, chartLeft + ctx.measureText(config.ticker).width + 6, 21);

    // Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.font = 'bold 64px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.ticker, width / 2, height / 2 - 20);
  } else {
    // Watermark only
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.font = 'bold 50px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNKNOWN ASSET (CROPPED TEST)', width / 2, height / 2);
  }

  // Pattern / Structure visual annotations if provided
  if (config.patternLabel) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const tagX = chartLeft + chartWidth * 0.75;
    const tagY = chartTop + 40;
    ctx.strokeRect(tagX - 60, tagY - 12, 120, 24);
    ctx.fillRect(tagX - 60, tagY - 12, 120, 24);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(config.patternLabel, tagX, tagY);
  }

  return canvas.toDataURL('image/png');
}

export function getSampleCharts(): SampleChart[] {
  // Pre-generate rich high-resolution charts across all 5 asset classes + edge case
  const btcChart = generateSyntheticChartImage({
    ticker: 'BTC/USD',
    timeframe: '4H',
    category: 'Crypto',
    trend: 'bullish',
    basePrice: 78200,
    priceStep: 550,
    decimals: 2,
    candlesCount: 48,
    patternLabel: 'BOS + Order Block',
  });

  const eurusdChart = generateSyntheticChartImage({
    ticker: 'EUR/USD',
    timeframe: '1H',
    category: 'Forex',
    trend: 'bearish',
    basePrice: 1.0850,
    priceStep: 0.0014,
    decimals: 5,
    candlesCount: 44,
    patternLabel: 'CHoCH + FVG Tap',
  });

  const nvdaChart = generateSyntheticChartImage({
    ticker: 'NVDA',
    timeframe: '1D',
    category: 'Stocks',
    trend: 'bullish',
    basePrice: 132.5,
    priceStep: 1.8,
    decimals: 2,
    candlesCount: 46,
    patternLabel: 'Bull Flag Retest',
  });

  const us30Chart = generateSyntheticChartImage({
    ticker: 'US30',
    timeframe: '15m',
    category: 'Indices',
    trend: 'bullish',
    basePrice: 43850,
    priceStep: 85,
    decimals: 1,
    candlesCount: 52,
    patternLabel: 'Liquidity Sweep (SMC)',
  });

  const goldChart = generateSyntheticChartImage({
    ticker: 'XAU/USD',
    timeframe: '4H',
    category: 'Commodities',
    trend: 'bullish',
    basePrice: 2750,
    priceStep: 9.5,
    decimals: 2,
    candlesCount: 45,
    patternLabel: 'Ascending Triangle',
  });

  const unlabelledChart = generateSyntheticChartImage({
    ticker: 'UNKNOWN',
    timeframe: 'UNKNOWN',
    category: 'Crypto',
    trend: 'bearish',
    basePrice: 3580,
    priceStep: 35,
    decimals: 2,
    candlesCount: 40,
    hasCroppedText: true,
  });

  return [
    {
      id: 'btc-4h',
      name: 'Bitcoin (BTC/USD) - 4H Breakout & Order Block Retest',
      category: 'Crypto',
      ticker: 'BTC/USD',
      timeframe: '4H',
      description: 'Bullish Break of Structure (BOS) with clean demand order block tap at $78.2k.',
      imageDataUrl: btcChart,
    },
    {
      id: 'eurusd-1h',
      name: 'Euro / US Dollar (EUR/USD) - 1H CHoCH & Fair Value Gap',
      category: 'Forex',
      ticker: 'EUR/USD',
      timeframe: '1H',
      description: 'Bearish Change of Character (CHoCH) rejection into supply imbalance zone.',
      imageDataUrl: eurusdChart,
    },
    {
      id: 'nvda-1d',
      name: 'NVIDIA (NVDA) - 1D Institutional Bull Flag & High Volume Node',
      category: 'Stocks',
      ticker: 'NVDA',
      timeframe: '1D',
      description: 'Daily trend continuation flag following volume expansion above key resistance.',
      imageDataUrl: nvdaChart,
    },
    {
      id: 'us30-15m',
      name: 'Dow Jones (US30) - 15m Asian Low Liquidity Sweep',
      category: 'Indices',
      ticker: 'US30',
      timeframe: '15m',
      description: 'Institutional liquidity grab below key support followed by rapid V-reversal.',
      imageDataUrl: us30Chart,
    },
    {
      id: 'xauusd-4h',
      name: 'Gold (XAU/USD) - 4H Ascending Triangle & ATH Compression',
      category: 'Commodities',
      ticker: 'XAU/USD',
      timeframe: '4H',
      description: 'Commodity multi-week compression against major psychological barrier with rising lows.',
      imageDataUrl: goldChart,
    },
    {
      id: 'unlabelled-edge',
      name: 'Cropped / Unlabelled Chart (Strict Schema Edge Case Test)',
      category: 'Crypto',
      ticker: 'UNKNOWN',
      timeframe: 'UNKNOWN',
      description: 'Validates strict fallback to UNKNOWN for ticker/timeframe while inferring numerical levels.',
      imageDataUrl: unlabelledChart,
    },
  ];
}
