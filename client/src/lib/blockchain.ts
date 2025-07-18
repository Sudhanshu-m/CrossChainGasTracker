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

export function aggregateToCandles(history: any[], intervalMinutes: number = 15) {
  if (!history || history.length === 0) {
    console.log('No history data to aggregate');
    return [];
  }

  console.log('Aggregating', history.length, 'records with', intervalMinutes, 'minute intervals');

  // Sort by timestamp
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const candles: any[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  // Group data by interval
  const intervalGroups = new Map();

  for (const record of sortedHistory) {
    const currentTime = new Date(record.timestamp).getTime();
    const intervalStart = Math.floor(currentTime / intervalMs) * intervalMs;

    if (!intervalGroups.has(intervalStart)) {
      intervalGroups.set(intervalStart, []);
    }
    intervalGroups.get(intervalStart).push(record);
  }

  // Create candles from groups
  for (const [intervalStart, intervalData] of Array.from(intervalGroups.entries())) {
    if (intervalData.length === 0) continue;

    const totalFees = intervalData.map((d: any) => {
      const baseFee = parseFloat(d.baseFee) || 0;
      const priorityFee = parseFloat(d.priorityFee) || 0;
      return baseFee + priorityFee;
    });

    const candle = {
      time: intervalStart / 1000, // Convert to seconds for lightweight-charts
      open: totalFees[0],
      high: Math.max(...totalFees),
      low: Math.min(...totalFees),
      close: totalFees[totalFees.length - 1]
    };

    candles.push(candle);
  }

  const sortedCandles = candles.sort((a, b) => a.time - b.time);
  console.log('Created', sortedCandles.length, 'candles');
  return sortedCandles;
}