import { useQuery } from '@tanstack/react-query';
import { useGasStore } from '../store/gasStore';

export function useGasTracker() {
  const { simulationValue, simulationGasLimit, setSimulationResults } = useGasStore();

  const { data: gasPrices, isLoading: gasLoading } = useQuery({
    queryKey: ['/api/gas-prices'],
    refetchInterval: 30000, // Fallback polling every 30 seconds
    enabled: false // Disable since we're using WebSocket
  });

  const { data: ethPrice, isLoading: priceLoading } = useQuery({
    queryKey: ['/api/eth-price'],
    refetchInterval: 30000, // Fallback polling every 30 seconds
    enabled: false // Disable since we're using WebSocket
  });

  const simulateTransaction = async (value: number, gasLimit: number) => {
    try {
      const response = await fetch('/api/simulate-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          gasLimit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to simulate transaction');
      }

      const results = await response.json();
      setSimulationResults(results);
      return results;
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw error;
    }
  };

  const getGasHistory = async (chain: string, hours: number = 24) => {
    try {
      const response = await fetch(`/api/gas-history/${chain}?hours=${hours}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gas history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching gas history:', error);
      throw error;
    }
  };

  return {
    gasPrices,
    ethPrice,
    gasLoading,
    priceLoading,
    simulateTransaction,
    getGasHistory
  };
}
