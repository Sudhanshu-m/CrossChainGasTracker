import { ethers } from "ethers";
import { storage } from "../storage";

export class PriceOracle {
  private provider: ethers.JsonRpcProvider | null = null;
  private uniswapV3Pool: ethers.Contract | null = null;
  private isRunning: boolean = false;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  // Uniswap V3 ETH/USDC pool address
  private readonly POOL_ADDRESS = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';
  
  // Pool ABI for Swap events and slot0 function
  private readonly POOL_ABI = [
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
  ];

  constructor() {}

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting price oracle...');

    try {
      // Try to connect to Uniswap V3 first
      await this.connectToUniswap();
    } catch (error) {
      console.log('Failed to connect to Uniswap V3, using simulated prices:', error.message);
      this.startPriceSimulation();
    }
  }

  private async connectToUniswap(): Promise<void> {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test connection
    await this.provider.getNetwork();
    console.log('Connected to Ethereum network');
    
    this.uniswapV3Pool = new ethers.Contract(
      this.POOL_ADDRESS,
      this.POOL_ABI,
      this.provider
    );

    // Get current price from pool
    const slot0 = await this.uniswapV3Pool.slot0();
    const initialPrice = this.calculatePriceFromSqrtPriceX96(slot0.sqrtPriceX96);
    
    await storage.saveEthPrice({ price: initialPrice });
    this.emitPriceUpdate(initialPrice);
    
    console.log(`Initial ETH/USD price from Uniswap V3: $${initialPrice.toFixed(2)}`);
    
    // Set up polling for price updates (every 30 seconds)
    this.priceUpdateInterval = setInterval(() => {
      this.fetchCurrentPrice();
    }, 30000);
  }

  private async fetchCurrentPrice(): Promise<void> {
    try {
      if (!this.uniswapV3Pool) return;
      
      const slot0 = await this.uniswapV3Pool.slot0();
      const price = this.calculatePriceFromSqrtPriceX96(slot0.sqrtPriceX96);
      
      await storage.saveEthPrice({ price });
      this.emitPriceUpdate(price);
      
      console.log(`ETH/USD price updated from Uniswap V3: $${price.toFixed(2)}`);
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  }

  private calculatePriceFromSqrtPriceX96(sqrtPriceX96: any): number {
    try {
      // Convert sqrtPriceX96 to price
      // For ETH/USDC pool, we need to calculate: (sqrtPriceX96 / 2^96)^2 * 10^12
      const sqrtPrice = Number(sqrtPriceX96) / Math.pow(2, 96);
      const price = Math.pow(sqrtPrice, 2) * Math.pow(10, 12);
      
      // Ensure reasonable price bounds
      return Math.max(100, Math.min(10000, price));
    } catch (error) {
      console.error('Error calculating price from sqrtPriceX96:', error);
      return 2500; // Fallback price
    }
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
