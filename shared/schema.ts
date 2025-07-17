import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gasPrices = pgTable("gas_prices", {
  id: serial("id").primaryKey(),
  chain: text("chain").notNull(),
  baseFee: real("base_fee").notNull(),
  priorityFee: real("priority_fee").notNull(),
  gasLimit: integer("gas_limit").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const ethPrices = pgTable("eth_prices", {
  id: serial("id").primaryKey(),
  price: real("price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertGasPriceSchema = createInsertSchema(gasPrices).omit({
  id: true,
  timestamp: true,
});

export const insertEthPriceSchema = createInsertSchema(ethPrices).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertGasPrice = z.infer<typeof insertGasPriceSchema>;
export type InsertEthPrice = z.infer<typeof insertEthPriceSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GasPrice = typeof gasPrices.$inferSelect;
export type EthPrice = typeof ethPrices.$inferSelect;
export type User = typeof users.$inferSelect;

export interface ChainData {
  chain: string;
  baseFee: number;
  priorityFee: number;
  totalCost: number;
  l1Fee?: number;
  connected: boolean;
}

export interface GasPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SimulationResult {
  ethereum: number;
  polygon: number;
  arbitrum: number;
}
