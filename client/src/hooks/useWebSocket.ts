import { useEffect, useRef, useState } from 'react';
import { useGasStore } from '../store/gasStore';
import { calculateUsdCost } from '../lib/blockchain';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const { updateChainData, updateEthPrice, setConnected, ethPrice } = useGasStore();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnected(true);
        reconnectAttempts.current = 0;
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initialData':
              handleInitialData(message.data);
              break;
            case 'gasUpdate':
              handleGasUpdate(message.data);
              break;
            case 'priceUpdate':
              handlePriceUpdate(message.data);
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
            connect();
          }, delay);
        }
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnected(false);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
      setConnected(false);
    }
  };

  const handleInitialData = (data: any) => {
    if (data.gasPrices) {
      data.gasPrices.forEach((gasData: any) => {
        const totalCost = calculateUsdCost(
          gasData.baseFee + gasData.priorityFee,
          data.ethPrice || ethPrice
        );
        
        updateChainData(gasData.chain, {
          baseFee: gasData.baseFee,
          priorityFee: gasData.priorityFee,
          totalCost,
          connected: true
        });
      });
    }
    
    if (data.ethPrice) {
      updateEthPrice(data.ethPrice);
    }
  };

  const handleGasUpdate = (gasData: any) => {
    const totalCost = calculateUsdCost(
      gasData.baseFee + gasData.priorityFee,
      ethPrice
    );
    
    updateChainData(gasData.chain, {
      baseFee: gasData.baseFee,
      priorityFee: gasData.priorityFee,
      totalCost,
      connected: true
    });
  };

  const handlePriceUpdate = (data: any) => {
    if (data.price) {
      updateEthPrice(data.price);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setConnected(false);
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect
  };
}
