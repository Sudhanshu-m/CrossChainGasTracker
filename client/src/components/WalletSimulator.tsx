import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wallet, Calculator, TrendingUp, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { useGasStore } from '../store/gasStore';
import { useGasTracker } from '../hooks/useGasTracker';
import { CHAINS, TRANSACTION_TYPES } from '../lib/constants';
import { formatUsd, formatGwei, formatEth } from '../lib/blockchain';

export function WalletSimulator() {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState<string>('2.5');
  const [transactionType, setTransactionType] = useState('transfer');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  
  const { ethPrice, gasPrices } = useGasStore();
  const { simulateTransaction } = useGasTracker();

  // Generate a random wallet address for demo
  const generateDemoWallet = () => {
    const demoAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setWalletAddress(demoAddress);
    setBalance((Math.random() * 5 + 0.5).toFixed(3)); // Random balance between 0.5-5.5 ETH
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulation = async () => {
    if (!amount || !walletAddress) return;
    
    setIsSimulating(true);
    try {
      const gasLimit = TRANSACTION_TYPES[transactionType as keyof typeof TRANSACTION_TYPES]?.gasLimit || 21000;
      const results = await simulateTransaction(parseFloat(amount), gasLimit);
      setSimulationResults(results);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getBestChain = () => {
    if (!simulationResults) return null;
    
    const costs = Object.entries(simulationResults).map(([chain, result]: [string, any]) => ({
      chain,
      cost: result.costInUsd,
      gasPrice: result.gasCost
    }));
    
    costs.sort((a, b) => a.cost - b.cost);
    return costs[0];
  };

  const getGasStatus = (chain: string) => {
    const currentGas = gasPrices.find((gp: { chain: string; baseFee: number; priorityFee: number; }) => gp.chain === chain);
    if (!currentGas) return 'unknown';
    
    const totalGas = currentGas.baseFee + currentGas.priorityFee;
    
    if (totalGas < 20) return 'low';
    if (totalGas < 50) return 'medium';
    return 'high';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const bestChain = getBestChain();
  const remainingBalance = parseFloat(balance) - parseFloat(amount || '0');

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span>Wallet Simulator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-300">Wallet Address</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                />
                <Button 
                  onClick={generateDemoWallet}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Generate
                </Button>
                {walletAddress && (
                  <Button
                    onClick={() => copyToClipboard(walletAddress)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-300">Balance</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-900 border-slate-700 text-white font-mono"
                />
                <Badge className="bg-slate-700 text-slate-300 font-mono">ETH</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Simulation */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Calculator className="w-5 h-5 text-green-400" />
            <span>Transaction Simulation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-300">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {Object.entries(TRANSACTION_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-300">Amount</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  type="number"
                  className="bg-slate-900 border-slate-700 text-white font-mono"
                />
                <Badge className="bg-slate-700 text-slate-300">ETH</Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-300">Recipient</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="mt-1 bg-slate-900 border-slate-700 text-white font-mono text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleSimulation}
            disabled={isSimulating || !amount || !walletAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            {isSimulating ? 'Simulating...' : 'Simulate Transaction'}
          </Button>

          {/* Balance Check */}
          {amount && (
            <div className="flex items-center space-x-2 p-3 bg-slate-900 rounded-lg">
              {remainingBalance >= 0 ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-slate-300">
                Remaining balance: {formatEth(remainingBalance)} 
                {remainingBalance < 0 && (
                  <span className="text-red-400 font-semibold"> (Insufficient funds)</span>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {simulationResults && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span>Cross-Chain Cost Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(CHAINS).map(([key, chainInfo]) => {
                const result = simulationResults[key];
                const status = getGasStatus(key);
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 ${chainInfo.gradient} rounded-full`}></div>
                      <div>
                        <span className="text-white font-medium">{chainInfo.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                          <span className="text-xs text-slate-400 capitalize">{status} gas</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white font-semibold">
                        {result ? formatUsd(result.costInUsd) : '--'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {result ? formatGwei(result.gasCost) : '--'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {bestChain && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Best Option</span>
                </div>
                <p className="text-sm text-slate-300">
                  <strong>{CHAINS[bestChain.chain as keyof typeof CHAINS]?.name}</strong> offers the lowest gas costs at {formatUsd(bestChain.cost)}.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Current ETH price: {formatUsd(ethPrice)} | Gas: {formatGwei(bestChain.gasPrice)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}