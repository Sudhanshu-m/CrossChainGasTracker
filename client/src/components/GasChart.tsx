
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGasStore } from '../store/gasStore';
import { useGasTracker } from '../hooks/useGasTracker';
import { CHAINS, CHART_INTERVALS } from '../lib/constants';
import { aggregateToCandles } from '../lib/blockchain';

export function GasChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  
  const { chartInterval, selectedChains, setChartInterval, toggleChainSelection } = useGasStore();
  const { getGasHistory } = useGasTracker();

  // Initialize chart
  useEffect(() => {
    let mounted = true;
    
    const initChart = async () => {
      if (!chartRef.current || !mounted) return;

      try {
        // Import lightweight-charts
        const LightweightCharts = await import('lightweight-charts');
        
        const containerWidth = chartRef.current.clientWidth || 800;
        
        const newChart = LightweightCharts.createChart(chartRef.current, {
          width: containerWidth,
          height: 400,
          layout: {
            background: { type: LightweightCharts.ColorType.Solid, color: '#1e293b' },
            textColor: '#f8fafc',
          },
          grid: {
            vertLines: { color: '#334155' },
            horzLines: { color: '#334155' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: '#475569',
          },
          rightPriceScale: {
            borderColor: '#475569',
          },
        });

        console.log('Chart created successfully');

        // Create candlestick series
        let candlestickSeries;
        try {
          candlestickSeries = newChart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
          });
        } catch (error) {
          console.log('Candlestick series not available, creating line series instead');
          candlestickSeries = newChart.addLineSeries({
            color: '#10b981',
            lineWidth: 2,
          });
        }

        console.log('Candlestick series created successfully');

        if (mounted) {
          setChart(newChart);
          setSeries(candlestickSeries);
          setChartReady(true);
        }

        // Handle resize
        const handleResize = () => {
          if (newChart && chartRef.current) {
            newChart.applyOptions({
              width: chartRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (newChart) {
            newChart.remove();
          }
        };
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    initChart();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!chartReady || !chart || !series || selectedChains.length === 0) return;

    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const updateChartData = async () => {
      if (!isActive) return;
      
      setLoading(true);
      try {
        const intervalValue = CHART_INTERVALS[chartInterval as keyof typeof CHART_INTERVALS]?.value || 15;
        
        // Use the first selected chain
        const primaryChain = selectedChains[0];
        const history = await getGasHistory(primaryChain, 24);
        
        if (!isActive) return; // Check if component is still mounted
        
        console.log('Fetched history:', history?.length, 'records for', primaryChain);
        
        if (history && history.length > 0) {
          // Try candlestick data first, fall back to line data
          const candleData = aggregateToCandles(history, intervalValue);
          console.log('Generated candlestick data:', candleData.length, 'candles');
          
          if (candleData.length > 0 && isActive) {
            try {
              series.setData(candleData);
              console.log('Chart data updated successfully with candlesticks');
            } catch (error) {
              console.log('Candlestick data failed, converting to line data');
              // Convert to line series data format
              const lineData = candleData.map(candle => ({
                time: candle.time,
                value: candle.close
              }));
              if (isActive) {
                series.setData(lineData);
                console.log('Chart data updated successfully with line series');
              }
            }
          } else {
            console.log('No candle data generated from history');
          }
        } else {
          console.log('No history data available for', primaryChain);
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    // Initial load
    updateChartData();
    
    // Set up interval to refresh chart data every 60 seconds (reduced frequency)
    intervalId = setInterval(() => {
      if (isActive) {
        updateChartData();
      }
    }, 60000);
    
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [chartReady, chartInterval, selectedChains]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Gas Price Volatility</h2>
          <div className="flex items-center space-x-4">
            <Select value={chartInterval} onValueChange={setChartInterval}>
              <SelectTrigger className="w-20 bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {Object.entries(CHART_INTERVALS).map(([key, interval]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              {Object.entries(CHAINS).map(([key, chainInfo]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedChains.includes(key) ? "default" : "outline"}
                  onClick={() => toggleChainSelection(key)}
                  className={`text-xs ${selectedChains.includes(key) ? chainInfo.gradient : 'border-slate-600'}`}
                >
                  {chainInfo.symbol}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          )}
          <div ref={chartRef} className="h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg" />
        </div>
        
        <div className="mt-4 text-sm text-slate-400 text-center">
          Chart updates every 60 seconds • Gas prices refresh every 15 seconds
        </div>
      </CardContent>
    </Card>
  );
}
