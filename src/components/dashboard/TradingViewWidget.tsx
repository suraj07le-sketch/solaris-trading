"use client";

import { useEffect, useRef, memo } from 'react';

// Use a unique ID generator if needed, but for simplicity here we assume one instance or manage it.
// To support multiple, we'd need unique IDs.

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  autosize?: boolean;
  interval?: string;
  className?: string;
  style?: React.CSSProperties;
}

const TradingViewWidget = memo(({ 
  symbol, 
  theme = 'dark', 
  autosize = true, 
  interval = 'D',
  className,
  style
}: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous widget
    container.innerHTML = '';

    // Create a wrapper div for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      backgroundColor: "rgba(0, 0, 0, 1)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com"
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme, interval]); // Re-run if these props change

  return (
    <div 
      className={`tradingview-widget-container overflow-hidden rounded-xl border border-white/10 shadow-2xl ${className}`} 
      ref={containerRef} 
      style={{ height: '500px', width: '100%', ...style }} // Default height
    >
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';
export default TradingViewWidget;
