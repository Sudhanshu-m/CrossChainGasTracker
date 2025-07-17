import { Card, CardContent } from '@/components/ui/card';
import { CHAINS } from '../lib/constants';
import { formatGwei, formatUsd } from '../lib/blockchain';
import { ChainData } from '@shared/schema';

interface GasPriceCardProps {
  chain: string;
  data: ChainData;
}

export function GasPriceCard({ chain, data }: GasPriceCardProps) {
  const chainInfo = CHAINS[chain as keyof typeof CHAINS];
  
  if (!chainInfo) return null;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${chainInfo.gradient} rounded-full flex items-center justify-center`}>
              <i className={`${chainInfo.icon} text-white text-sm`}></i>
            </div>
            <div>
              <h3 className="font-semibold text-white">{chainInfo.name}</h3>
              <p className="text-xs text-slate-400">{chainInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 ${data.connected ? 'bg-green-500' : 'bg-red-500'} rounded-full ${data.connected ? 'animate-pulse' : ''}`}></div>
            <span className="text-xs text-slate-400">{data.connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Base Fee</span>
            <span className="font-mono text-white font-semibold">{formatGwei(data.baseFee)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Priority Fee</span>
            <span className="font-mono text-white font-semibold">{formatGwei(data.priorityFee)}</span>
          </div>
          {data.l1Fee !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">L1 Fee</span>
              <span className="font-mono text-white font-semibold">{formatGwei(data.l1Fee)}</span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Cost</span>
              <span className="font-mono text-green-400 font-bold">{formatUsd(data.totalCost)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
