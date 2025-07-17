import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGasStore } from '../store/gasStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { GasPriceCard } from '../components/GasPriceCard';
import { GasChart } from '../components/GasChart';
import { TransactionSimulator } from '../components/TransactionSimulator';
import { WalletSimulator } from '../components/WalletSimulator';
import { HistoricalDataTable } from '../components/HistoricalDataTable';
import { formatUsd, formatTime } from '../lib/blockchain';
import { TrendingUp, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { 
    mode, 
    chains, 
    ethPrice, 
    lastUpdate, 
    connected, 
    setMode 
  } = useGasStore();
  
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl font-bold text-white">Gas Tracker</h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 ml-8">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 ${connected ? 'bg-green-500' : 'bg-red-500'} rounded-full ${connected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-sm text-slate-400">{connected ? 'Live' : 'Offline'}</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-sm text-slate-400">
                  Last update: <span className="font-mono">{lastUpdate ? formatTime(lastUpdate) : '--'}</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Mode Toggle */}
              <div className="flex items-center space-x-2 bg-slate-900 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={mode === 'live' ? 'default' : 'ghost'}
                  onClick={() => setMode('live')}
                  className={mode === 'live' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
                >
                  Live
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'simulation' ? 'default' : 'ghost'}
                  onClick={() => setMode('simulation')}
                  className={mode === 'simulation' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
                >
                  Simulate
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">ETH/USD:</span>
                <span className="font-mono text-lg font-semibold text-green-400">
                  {formatUsd(ethPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Gas Price Cards */}
          <div className="lg:col-span-1 space-y-4">
            {Object.entries(chains).map(([chain, data]) => (
              <GasPriceCard key={chain} chain={chain} data={data} />
            ))}
          </div>

          {/* Chart and Simulator */}
          <div className="lg:col-span-3 space-y-6">
            <GasChart />
            {mode === 'live' ? <TransactionSimulator /> : <WalletSimulator />}
          </div>
        </div>
        
        {/* Historical Data Table */}
        <div className="mt-8">
          <HistoricalDataTable />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Connection Status</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(chains).map(([chain, data]) => (
                  <div key={chain} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${data.connected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                    <span className="text-slate-400 capitalize">{chain} RPC</span>
                    <span className={data.connected ? 'text-green-400' : 'text-red-400'}>
                      {data.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Technical Info</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div>Update Interval: 6 seconds</div>
                <div>Chart Intervals: 15 minutes</div>
                <div>Data Source: Native RPC</div>
                <div>Price Feed: Uniswap V3</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">About</h3>
              <p className="text-sm text-slate-400">
                Real-time cross-chain gas price tracker with wallet simulation. 
                Built with React, ethers.js, and lightweight-charts.
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-6 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                © 2024 Gas Tracker. Data updates every 6 seconds.
              </p>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-slate-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
