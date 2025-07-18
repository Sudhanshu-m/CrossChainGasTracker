import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGasStore } from '../store/gasStore';
import { useGasTracker } from '../hooks/useGasTracker';
import { CHAINS, TRANSACTION_TYPES } from '../lib/constants';
import { formatUsd } from '../lib/blockchain';
import { Calculator, Lightbulb } from 'lucide-react';

export function TransactionSimulator() {
  const [transactionType, setTransactionType] = useState('transfer');
  const [loading, setLoading] = useState(false);
  
  const { 
    simulationValue, 
    simulationResults, 
    setSimulationValue, 
    setSimulationGasLimit 
  } = useGasStore();
  
  const { simulateTransaction } = useGasTracker();

  const handleCalculate = async () => {
    if (!simulationValue || simulationValue <= 0) return;
    
    setLoading(true);
    try {
      const gasLimit = TRANSACTION_TYPES[transactionType as keyof typeof TRANSACTION_TYPES]?.gasLimit || 21000;
      setSimulationGasLimit(gasLimit);
      await simulateTransaction(simulationValue, gasLimit);
    } catch (error) {
      console.error('Error calculating gas costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBestChain = () => {
    if (!simulationResults) return null;
    
    const costs = Object.entries(simulationResults).map(([chain, result]) => ({
      chain,
      cost: result.costInUsd
    }));
    
    costs.sort((a, b) => a.cost - b.cost);
    return costs[0];
  };

  const getSavings = () => {
    if (!simulationResults) return 0;
    
    const costs = Object.values(simulationResults).map(r => r.costInUsd);
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return max - min;
  };

  const bestChain = getBestChain();
  const savings = getSavings();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Transaction Simulator</h2>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Estimate gas costs</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="value" className="text-sm font-medium text-slate-300 mb-2">
                Transaction Value
              </Label>
              <div className="relative">
                <Input
                  id="value"
                  type="number"
                  placeholder="0.5"
                  value={simulationValue}
                  onChange={(e) => setSimulationValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border-slate-700 text-white font-mono text-lg pr-16"
                />
                <div className="absolute right-3 top-3">
                  <span className="text-slate-400 text-sm">ETH</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-slate-300 mb-2">
                Transaction Type
              </Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {Object.entries(TRANSACTION_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {type.name} ({type.gasLimit.toLocaleString()} gas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleCalculate}
              disabled={loading || !simulationValue || simulationValue <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            >
              {loading ? 'Calculating...' : 'Calculate Gas Costs'}
            </Button>
          </div>
          
          {/* Results Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cost Comparison</h3>
            
            <div className="space-y-3">
              {Object.entries(CHAINS).map(([key, chainInfo]) => {
                const result = simulationResults?.[key as keyof typeof simulationResults];
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 ${chainInfo.gradient} rounded-full`}></div>
                      <span className="text-white font-medium">{chainInfo.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white font-semibold">
                        {result && typeof result === 'object' && 'costInUsd' in result ? formatUsd(result.costInUsd) : '--'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {result && typeof result === 'object' && 'gasCost' in result ? `${result.gasCost.toFixed(1)} gwei` : '--'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {bestChain && simulationResults && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Recommendation</span>
                </div>
                <p className="text-sm text-slate-300">
                  Use <strong>{CHAINS[bestChain.chain as keyof typeof CHAINS]?.name}</strong> for the lowest gas costs.
                  {savings > 0 && (
                    <span className="text-green-400 font-semibold"> You'll save {formatUsd(savings)} compared to the most expensive option.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
