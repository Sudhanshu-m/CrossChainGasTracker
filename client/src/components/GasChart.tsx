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
  
  const { chartInterval, selectedChains, setChartInterval, toggleChainSelection } = useGasStore();
  const { getGasHistory } = useGasTracker();

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    const initChart = async () => {
      try {
        // Dynamic import of lightweight-charts
        const { createChart, ColorType } = await import('lightweight-charts');
        
        const newChart = createChart(chartRef.current!, {
          width: chartRef.current!.clientWidth,
          height: 400,
          layout: {
            background: { type: ColorType.Solid, color: '#1e293b' },
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

        const candlestickSeries = newChart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickUpColor: '#10b981',
        });

        setChart(newChart);
        setSeries(candlestickSeries);

        // Handle resize
        const handleResize = () => {
          if (newChart && chartRef.current) {
            newChart.applyOptions({
              width: chartRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    initChart();
  }, []);

  // Update chart data
  useEffect(() => {
    if (!chart || !series || selectedChains.length === 0) return;

    const updateChartData = async () => {
      setLoading(true);
      try {
        const intervalValue = CHART_INTERVALS[chartInterval as keyof typeof CHART_INTERVALS]?.value || 15;
        
        // For now, use the first selected chain
        const primaryChain = selectedChains[0];
        const history = await getGasHistory(primaryChain, 24);
        
        const candleData = aggregateToCandles(history, intervalValue);
        series.setData(candleData);
      } catch (error) {
        console.error('Error updating chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    updateChartData();
  }, [chart, series, chartInterval, selectedChains]);

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
      </CardContent>
    </Card>
  );
}
