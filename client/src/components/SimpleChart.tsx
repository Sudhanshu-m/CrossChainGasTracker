import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function SimpleChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChart = async () => {
      try {
        const { createChart } = await import('lightweight-charts');
        
        if (!chartRef.current) return;

        const chart = createChart(chartRef.current, {
          width: 400,
          height: 300,
        });

        console.log('Simple chart created:', chart);
        console.log('Available methods:', Object.keys(chart));

        // Add a simple line series to test
        const lineSeries = chart.addLineSeries({
          color: '#2563eb',
          lineWidth: 2,
        });

        // Add some test data
        const testData = [
          { time: '2024-01-01', value: 30 },
          { time: '2024-01-02', value: 35 },
          { time: '2024-01-03', value: 25 },
          { time: '2024-01-04', value: 40 },
          { time: '2024-01-05', value: 45 },
        ];

        lineSeries.setData(testData);
        console.log('Test data set successfully');

      } catch (error) {
        console.error('Simple chart error:', error);
      }
    };

    initChart();
  }, []);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <h3 className="text-white mb-4">Chart Test</h3>
        <div ref={chartRef} className="h-[300px] bg-slate-900 rounded" />
      </CardContent>
    </Card>
  );
}