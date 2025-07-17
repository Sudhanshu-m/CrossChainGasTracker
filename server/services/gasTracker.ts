import { ethers } from "ethers";
import { storage } from "../storage";

export interface GasData {
  chain: string;
  baseFee: number;
  priorityFee: number;
  gasLimit: number;
}

export class GasTracker {
  private providers: Map<string, ethers.JsonRpcProvider>;
  private chains: Map<string, string>;
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.providers = new Map();
    this.chains = new Map([
      ['ethereum', process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'],
      ['polygon', process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo'],
      ['arbitrum', process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo']
    ]);
  }

  private async initializeProvider(chain: string, url: string): Promise<ethers.JsonRpcProvider> {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      
      // Test connection
      await provider.getNetwork();
      
      return provider;
    } catch (error) {
      console.error(`Failed to initialize provider for ${chain}:`, error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting gas tracker...');

    // Since demo endpoints are rate limited, we'll simulate real-time gas prices
    // In production, you would provide your own RPC endpoints
    console.log('Using simulated gas prices due to demo endpoint rate limits');
    
    // Start polling for gas prices
    this.startPolling();
  }

  private startPolling(): void {
    // Initial gas price generation
    this.generateGasPrices();
    
    // Set up interval for regular updates (every 15 seconds)
    this.pollingInterval = setInterval(() => {
      this.generateGasPrices();
    }, 15000);
  }

  private generateGasPrices(): void {
    const chains = ['ethereum', 'polygon', 'arbitrum'];
    
    for (const chain of chains) {
      const gasData = this.generateGasDataForChain(chain);
      this.handleGasData(gasData);
    }
  }

  private generateGasDataForChain(chain: string): GasData {
    // Generate realistic gas prices based on chain characteristics
    let baseFee: number;
    let priorityFee: number;
    
    switch (chain) {
      case 'ethereum':
        baseFee = 15 + Math.random() * 50; // 15-65 gwei
        priorityFee = 1 + Math.random() * 5; // 1-6 gwei
        break;
      case 'polygon':
        baseFee = 20 + Math.random() * 100; // 20-120 gwei
        priorityFee = 30 + Math.random() * 20; // 30-50 gwei
        break;
      case 'arbitrum':
        baseFee = 0.1 + Math.random() * 0.5; // 0.1-0.6 gwei
        priorityFee = 0.01 + Math.random() * 0.1; // 0.01-0.11 gwei
        break;
      default:
        baseFee = 10;
        priorityFee = 2;
    }
    
    return {
      chain,
      baseFee,
      priorityFee,
      gasLimit: 21000
    };
  }

  private async handleGasData(gasData: GasData): Promise<void> {
    try {
      await storage.saveGasPrice(gasData);
      
      // Emit to WebSocket clients
      this.emitGasUpdate(gasData);
      
      console.log(`Gas prices updated for ${gasData.chain}: ${gasData.baseFee.toFixed(2)} + ${gasData.priorityFee.toFixed(2)} gwei`);
    } catch (error) {
      console.error(`Error handling gas data for ${gasData.chain}:`, error);
    }
  }

  private async handleNewBlock(chain: string, provider: ethers.WebSocketProvider, blockNumber: number): Promise<void> {
    try {
      const block = await provider.getBlock(blockNumber);
      
      if (!block) return;

      let baseFee = 0;
      let priorityFee = 2; // Default priority fee in gwei
      
      if (block.baseFeePerGas) {
        baseFee = parseFloat(ethers.utils.formatUnits(block.baseFeePerGas, 'gwei'));
      }

      // For Arbitrum, handle L1 fees differently
      if (chain === 'arbitrum') {
        baseFee = 0.1; // Arbitrum L2 base fee is typically very low
        priorityFee = 0.01;
      }

      const gasData: GasData = {
        chain,
        baseFee,
        priorityFee,
        gasLimit: 21000, // Standard transfer
      };

      await storage.saveGasPrice(gasData);
      
      // Emit to WebSocket clients
      this.emitGasUpdate(gasData);
      
    } catch (error) {
      console.error(`Error handling block for ${chain}:`, error);
    }
  }

  private emitGasUpdate(gasData: GasData): void {
    // This will be used by the WebSocket server to broadcast updates
    global.gasUpdateEmitter?.emit('gasUpdate', gasData);
  }

  async getLatestGasPrices(): Promise<GasData[]> {
    const prices = await storage.getLatestGasPrices();
    return prices.map(price => ({
      chain: price.chain,
      baseFee: price.baseFee,
      priorityFee: price.priorityFee,
      gasLimit: price.gasLimit,
    }));
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    for (const [chain, provider] of this.providers) {
      try {
        provider.removeAllListeners();
        await provider.destroy();
        console.log(`Gas tracker stopped for ${chain}`);
      } catch (error) {
        console.error(`Error stopping gas tracker for ${chain}:`, error);
      }
    }
    
    this.providers.clear();
  }
}

export const gasTracker = new GasTracker();
