import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGasStore } from '../store/gasStore';
import { useGasTracker } from '../hooks/useGasTracker';
import { formatGwei, formatUsd, formatTime } from '../lib/blockchain';
import { Download, RefreshCw } from 'lucide-react';

export function HistoricalDataTable() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { ethPrice } = useGasStore();
  const { getGasHistory } = useGasTracker();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [ethHistory, polygonHistory, arbitrumHistory] = await Promise.all([
        getGasHistory('ethereum', 24),
        getGasHistory('polygon', 24),
        getGasHistory('arbitrum', 24)
      ]);

      // Combine and sort by timestamp
      const combined = [];
      const maxLength = Math.max(ethHistory.length, polygonHistory.length, arbitrumHistory.length);
      
      for (let i = 0; i < Math.min(maxLength, 20); i++) {
        const eth = ethHistory[ethHistory.length - 1 - i];
        const polygon = polygonHistory[polygonHistory.length - 1 - i];
        const arbitrum = arbitrumHistory[arbitrumHistory.length - 1 - i];
        
        if (eth || polygon || arbitrum) {
          combined.push({
            timestamp: (eth?.timestamp || polygon?.timestamp || arbitrum?.timestamp),
            ethereum: eth,
            polygon: polygon,
            arbitrum: arbitrum
          });
        }
      }
      
      setHistory(combined);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const exportCSV = () => {
    const headers = ['Time', 'Ethereum', 'Polygon', 'Arbitrum', 'ETH/USD'];
    const rows = history.map(entry => [
      formatTime(new Date(entry.timestamp).getTime()),
      entry.ethereum ? formatGwei(entry.ethereum.baseFee + entry.ethereum.priorityFee) : '--',
      entry.polygon ? formatGwei(entry.polygon.baseFee + entry.polygon.priorityFee) : '--',
      entry.arbitrum ? formatGwei(entry.arbitrum.baseFee + entry.arbitrum.priorityFee) : '--',
      formatUsd(ethPrice)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gas-price-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Gas Price History</h2>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportCSV}
              className="border-slate-600 text-slate-400 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchHistory}
              disabled={loading}
              className="border-slate-600 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ethereum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Polygon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Arbitrum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  ETH/USD
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
                    No historical data available
                  </td>
                </tr>
              ) : (
                history.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                      {formatTime(new Date(entry.timestamp).getTime())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {entry.ethereum ? formatGwei(entry.ethereum.baseFee + entry.ethereum.priorityFee) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {entry.polygon ? formatGwei(entry.polygon.baseFee + entry.polygon.priorityFee) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {entry.arbitrum ? formatGwei(entry.arbitrum.baseFee + entry.arbitrum.priorityFee) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-mono">
                      {formatUsd(ethPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
