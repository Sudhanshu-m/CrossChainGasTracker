import { ethers } from "ethers";

export function formatGwei(value: number): string {
  return `${value.toFixed(1)} gwei`;
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatEth(value: number): string {
  return `${value.toFixed(6)} ETH`;
}

export function calculateGasCost(baseFee: number, priorityFee: number, gasLimit: number): number {
  return (baseFee + priorityFee) * gasLimit;
}

export function calculateUsdCost(gasCost: number, ethPrice: number): number {
  const costInEth = gasCost / 1e9; // Convert from gwei to ETH
  return costInEth * ethPrice;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function aggregateToCandles(data: any[], intervalMinutes: number) {
  if (!data.length) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const candles = [];
  
  // Group data by time intervals
  const groups = new Map();
  
  for (const point of data) {
    const timestamp = new Date(point.timestamp).getTime();
    const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
    
    if (!groups.has(intervalStart)) {
      groups.set(intervalStart, []);
    }
    groups.get(intervalStart).push(point);
  }
  
  // Convert groups to candlestick data
  for (const [timestamp, points] of groups) {
    const values = points.map(p => p.baseFee + p.priorityFee);
    
    if (values.length > 0) {
      candles.push({
        time: timestamp / 1000, // Convert to seconds for lightweight-charts
        open: values[0],
        high: Math.max(...values),
        low: Math.min(...values),
        close: values[values.length - 1]
      });
    }
  }
  
  return candles.sort((a, b) => a.time - b.time);
}
