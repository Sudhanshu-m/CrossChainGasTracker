import { ethers } from "ethers";
import { storage } from "../storage";

export class PriceOracle {
  private provider: ethers.JsonRpcProvider | null = null;
  private uniswapV3Pool: ethers.Contract | null = null;
  private isRunning: boolean = false;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  // Uniswap V3 ETH/USDC pool address
  private readonly POOL_ADDRESS = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';
  
  // Pool ABI for Swap events
  private readonly POOL_ABI = [
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
  ];

  constructor() {}

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting price oracle...');

    // Since demo endpoints are rate limited, we'll simulate ETH/USD price updates
    console.log('Using simulated ETH/USD prices due to demo endpoint rate limits');
    
    this.startPriceSimulation();
  }

  private startPriceSimulation(): void {
    // Generate initial price
    this.generateEthPrice();
    
    // Set up interval for regular price updates (every 30 seconds)
    this.priceUpdateInterval = setInterval(() => {
      this.generateEthPrice();
    }, 30000);
  }

  private generateEthPrice(): void {
    // Generate realistic ETH/USD price around $2500-$4000
    const basePrice = 3000;
    const volatility = 500; // Price can vary by ±$500
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const price = basePrice + (volatility * randomFactor);
    
    // Ensure price stays within reasonable bounds
    const finalPrice = Math.max(1000, Math.min(6000, price));
    
    this.handlePriceUpdate(finalPrice);
  }

  private async handlePriceUpdate(price: number): Promise<void> {
    try {
      await storage.saveEthPrice({ price });
      this.emitPriceUpdate(price);
      
      console.log(`ETH/USD price updated: $${price.toFixed(2)}`);
    } catch (error) {
      console.error('Error handling price update:', error);
    }
  }



  private emitPriceUpdate(price: number): void {
    // This will be used by the WebSocket server to broadcast updates
    global.priceUpdateEmitter?.emit('priceUpdate', price);
  }

  async getLatestPrice(): Promise<number> {
    const latestPrice = await storage.getLatestEthPrice();
    return latestPrice?.price || 2500; // Fallback price
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.uniswapV3Pool) {
      this.uniswapV3Pool.removeAllListeners();
    }
    
    if (this.provider) {
      this.provider.removeAllListeners();
      await this.provider.destroy();
    }
    
    this.provider = null;
    this.uniswapV3Pool = null;
    
    console.log('Price oracle stopped');
  }
}

export const priceOracle = new PriceOracle();
