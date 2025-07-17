import { create } from 'zustand';
import { ChainData, GasPoint, SimulationResult } from '@shared/schema';

interface GasStore {
  // State
  mode: 'live' | 'simulation';
  chains: Record<string, ChainData>;
  ethPrice: number;
  lastUpdate: number;
  connected: boolean;
  simulationValue: number;
  simulationGasLimit: number;
  simulationResults: SimulationResult | null;
  chartInterval: string;
  selectedChains: string[];
  
  // Actions
  setMode: (mode: 'live' | 'simulation') => void;
  updateChainData: (chain: string, data: Partial<ChainData>) => void;
  updateEthPrice: (price: number) => void;
  setConnected: (connected: boolean) => void;
  setSimulationValue: (value: number) => void;
  setSimulationGasLimit: (gasLimit: number) => void;
  setSimulationResults: (results: SimulationResult) => void;
  setChartInterval: (interval: string) => void;
  toggleChainSelection: (chain: string) => void;
  setLastUpdate: (timestamp: number) => void;
}

export const useGasStore = create<GasStore>((set, get) => ({
  // Initial state
  mode: 'live',
  chains: {
    ethereum: {
      chain: 'ethereum',
      baseFee: 0,
      priorityFee: 0,
      totalCost: 0,
      connected: false
    },
    polygon: {
      chain: 'polygon',
      baseFee: 0,
      priorityFee: 0,
      totalCost: 0,
      connected: false
    },
    arbitrum: {
      chain: 'arbitrum',
      baseFee: 0,
      priorityFee: 0,
      l1Fee: 0,
      totalCost: 0,
      connected: false
    }
  },
  ethPrice: 0,
  lastUpdate: 0,
  connected: false,
  simulationValue: 0.5,
  simulationGasLimit: 21000,
  simulationResults: null,
  chartInterval: '15m',
  selectedChains: ['ethereum', 'polygon', 'arbitrum'],
  
  // Actions
  setMode: (mode) => set({ mode }),
  
  updateChainData: (chain, data) => set((state) => ({
    chains: {
      ...state.chains,
      [chain]: {
        ...state.chains[chain],
        ...data
      }
    },
    lastUpdate: Date.now()
  })),
  
  updateEthPrice: (price) => set({ ethPrice: price, lastUpdate: Date.now() }),
  
  setConnected: (connected) => set({ connected }),
  
  setSimulationValue: (value) => set({ simulationValue: value }),
  
  setSimulationGasLimit: (gasLimit) => set({ simulationGasLimit: gasLimit }),
  
  setSimulationResults: (results) => set({ simulationResults: results }),
  
  setChartInterval: (interval) => set({ chartInterval: interval }),
  
  toggleChainSelection: (chain) => set((state) => ({
    selectedChains: state.selectedChains.includes(chain)
      ? state.selectedChains.filter(c => c !== chain)
      : [...state.selectedChains, chain]
  })),
  
  setLastUpdate: (timestamp) => set({ lastUpdate: timestamp })
}));
