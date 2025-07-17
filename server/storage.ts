import { gasPrices, ethPrices, users, type GasPrice, type EthPrice, type User, type InsertGasPrice, type InsertEthPrice, type InsertUser, type ChainData, type GasPoint } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveGasPrice(gasPrice: InsertGasPrice): Promise<GasPrice>;
  saveEthPrice(ethPrice: InsertEthPrice): Promise<EthPrice>;
  getLatestGasPrices(): Promise<GasPrice[]>;
  getLatestEthPrice(): Promise<EthPrice | undefined>;
  getGasPriceHistory(chain: string, hours: number): Promise<GasPrice[]>;
  getEthPriceHistory(hours: number): Promise<EthPrice[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gasPrices: GasPrice[];
  private ethPrices: EthPrice[];
  private currentId: number;
  private gasPriceId: number;
  private ethPriceId: number;

  constructor() {
    this.users = new Map();
    this.gasPrices = [];
    this.ethPrices = [];
    this.currentId = 1;
    this.gasPriceId = 1;
    this.ethPriceId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveGasPrice(gasPrice: InsertGasPrice): Promise<GasPrice> {
    const id = this.gasPriceId++;
    const newGasPrice: GasPrice = {
      ...gasPrice,
      id,
      timestamp: new Date(),
    };
    this.gasPrices.push(newGasPrice);
    
    // Keep only last 1000 entries per chain
    const chainPrices = this.gasPrices.filter(gp => gp.chain === gasPrice.chain);
    if (chainPrices.length > 1000) {
      const toRemove = chainPrices.slice(0, chainPrices.length - 1000);
      this.gasPrices = this.gasPrices.filter(gp => !toRemove.includes(gp));
    }
    
    return newGasPrice;
  }

  async saveEthPrice(ethPrice: InsertEthPrice): Promise<EthPrice> {
    const id = this.ethPriceId++;
    const newEthPrice: EthPrice = {
      ...ethPrice,
      id,
      timestamp: new Date(),
    };
    this.ethPrices.push(newEthPrice);
    
    // Keep only last 1000 entries
    if (this.ethPrices.length > 1000) {
      this.ethPrices = this.ethPrices.slice(-1000);
    }
    
    return newEthPrice;
  }

  async getLatestGasPrices(): Promise<GasPrice[]> {
    const chains = ['ethereum', 'polygon', 'arbitrum'];
    return chains.map(chain => {
      const chainPrices = this.gasPrices.filter(gp => gp.chain === chain);
      return chainPrices[chainPrices.length - 1];
    }).filter(Boolean);
  }

  async getLatestEthPrice(): Promise<EthPrice | undefined> {
    return this.ethPrices[this.ethPrices.length - 1];
  }

  async getGasPriceHistory(chain: string, hours: number): Promise<GasPrice[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.gasPrices
      .filter(gp => gp.chain === chain && gp.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getEthPriceHistory(hours: number): Promise<EthPrice[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.ethPrices
      .filter(ep => ep.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
