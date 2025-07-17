import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { storage } from "./storage";
import { gasTracker } from "./services/gasTracker";
import { priceOracle } from "./services/priceOracle";

// Global event emitters for cross-service communication
declare global {
  var gasUpdateEmitter: EventEmitter;
  var priceUpdateEmitter: EventEmitter;
}

global.gasUpdateEmitter = new EventEmitter();
global.priceUpdateEmitter = new EventEmitter();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Store active WebSocket connections
  const clients = new Set<WebSocket>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    // Send initial data
    sendInitialData(ws);

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast gas updates to all connected clients
  global.gasUpdateEmitter.on('gasUpdate', (gasData) => {
    const message = JSON.stringify({
      type: 'gasUpdate',
      data: gasData
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Broadcast price updates to all connected clients
  global.priceUpdateEmitter.on('priceUpdate', (price) => {
    const message = JSON.stringify({
      type: 'priceUpdate',
      data: { price }
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // REST API routes
  app.get('/api/gas-prices', async (req, res) => {
    try {
      const prices = await gasTracker.getLatestGasPrices();
      res.json(prices);
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      res.status(500).json({ error: 'Failed to fetch gas prices' });
    }
  });

  app.get('/api/eth-price', async (req, res) => {
    try {
      const price = await priceOracle.getLatestPrice();
      res.json({ price });
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      res.status(500).json({ error: 'Failed to fetch ETH price' });
    }
  });

  app.get('/api/gas-history/:chain', async (req, res) => {
    try {
      const { chain } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await storage.getGasPriceHistory(chain, hours);
      res.json(history);
    } catch (error) {
      console.error('Error fetching gas history:', error);
      res.status(500).json({ error: 'Failed to fetch gas history' });
    }
  });

  app.post('/api/simulate-transaction', async (req, res) => {
    try {
      const { value, gasLimit } = req.body;
      
      if (!value || !gasLimit) {
        return res.status(400).json({ error: 'Value and gasLimit are required' });
      }

      const prices = await gasTracker.getLatestGasPrices();
      const ethPrice = await priceOracle.getLatestPrice();
      
      const simulation: Record<string, any> = {};
      
      for (const price of prices) {
        const totalGas = (price.baseFee + price.priorityFee) * gasLimit;
        const costInEth = totalGas / 1e9; // Convert from gwei to ETH
        const costInUsd = costInEth * ethPrice;
        
        simulation[price.chain] = {
          gasCost: totalGas,
          costInEth,
          costInUsd
        };
      }
      
      res.json(simulation);
    } catch (error) {
      console.error('Error simulating transaction:', error);
      res.status(500).json({ error: 'Failed to simulate transaction' });
    }
  });

  // Helper function to send initial data to new WebSocket connections
  async function sendInitialData(ws: WebSocket) {
    try {
      const gasPrices = await gasTracker.getLatestGasPrices();
      const ethPrice = await priceOracle.getLatestPrice();
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'initialData',
          data: {
            gasPrices,
            ethPrice
          }
        }));
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // Start services
  await gasTracker.start();
  await priceOracle.start();

  return httpServer;
}
