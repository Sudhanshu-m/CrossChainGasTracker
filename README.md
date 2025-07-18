# Real-Time Cross-Chain Gas Price Tracker

## Overview

This is a React-based web application that tracks real-time gas prices across multiple blockchain networks (Ethereum, Polygon, and Arbitrum). The application provides live gas price monitoring, historical data visualization, wallet simulation, and transaction cost analysis. It uses WebSocket connections for real-time updates and implements a sophisticated charting system with candlestick visualizations and real ETH/USD pricing from Uniswap V3.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Zustand for global state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Lightweight Charts library for candlestick visualizations
- **Real-time Communication**: WebSocket client for live data updates

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **WebSocket**: ws library for real-time communication
- **Blockchain Integration**: Ethers.js for Web3 interactions
- **Database**: Drizzle ORM with PostgreSQL support
- **Session Management**: Express sessions with PostgreSQL store

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations
- **Fallback**: In-memory storage implementation for development

## Key Components

### Real-Time Gas Tracking Service
- **Purpose**: Monitors gas prices across multiple blockchain networks
- **Implementation**: WebSocket connections to Ethereum, Polygon, and Arbitrum RPC endpoints
- **Features**: 
  - Automatic reconnection on connection loss
  - Base fee and priority fee extraction from new blocks
  - Cross-chain gas price normalization

### Price Oracle Service
- **Purpose**: Fetches real-time ETH/USD prices from Uniswap V3
- **Implementation**: Listens to Swap events from ETH/USDC pool
- **Features**:
  - Direct parsing of sqrtPriceX96 values
  - No dependency on external price APIs
  - Real-time price updates via WebSocket

### Transaction Simulator
- **Purpose**: Calculates transaction costs across different chains
- **Features**:
  - Support for multiple transaction types (transfer, ERC-20, swaps, NFTs)
  - USD cost calculation using live ETH prices
  - Cross-chain cost comparison

### Interactive Dashboard
- **Components**:
  - Gas price cards with live status indicators
  - Candlestick charts with configurable time intervals (15min, 30min, 1h, 4h)
  - Historical data tables with CSV export
  - Transaction cost simulator with cross-chain comparison
  - Wallet simulator with demo address generation
  - Real-time WebSocket connection status
  - Live/Simulation mode toggle

## Data Flow

1. **Data Collection**: Gas tracker services connect to blockchain RPC endpoints via WebSocket
2. **Data Processing**: Raw blockchain data is processed and normalized
3. **Data Storage**: Processed data is stored in PostgreSQL with fallback to in-memory storage
4. **Real-time Updates**: WebSocket server broadcasts updates to connected clients
5. **Client Updates**: React components receive updates and update UI state via Zustand
6. **User Interaction**: Users can simulate transactions and view historical data

## External Dependencies

### Blockchain RPCs
- **Ethereum**: Configurable RPC endpoint (default: Alchemy demo)
- **Polygon**: Configurable RPC endpoint (default: Alchemy demo)
- **Arbitrum**: Configurable RPC endpoint (default: Alchemy demo)

### Price Data Source
- **Uniswap V3**: Direct integration with ETH/USDC pool contract
- **Contract Address**: 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640
- **Method**: Real-time Swap event parsing

### Third-party Libraries
- **UI Components**: Radix UI primitives via shadcn/ui
- **Charts**: TradingView's lightweight-charts
- **Blockchain**: Ethers.js for Web3 interactions
- **Database**: Neon Database (serverless PostgreSQL)

## Deployment Strategy

### Development Setup
- **Environment**: Vite development server with HMR
- **Database**: In-memory storage fallback for quick development
- **WebSocket**: Local WebSocket server on same port as HTTP server
- **Hot Reload**: Full TypeScript compilation with instant updates

### Production Build
- **Frontend**: Vite build with optimized bundle splitting
- **Backend**: esbuild compilation to ESM format
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: 
  - `DATABASE_URL`: PostgreSQL connection string
  - `ETHEREUM_RPC_URL`: Ethereum WebSocket RPC endpoint
  - `POLYGON_RPC_URL`: Polygon WebSocket RPC endpoint
  - `ARBITRUM_RPC_URL`: Arbitrum WebSocket RPC endpoint

### Architecture Decisions

#### WebSocket Over REST
- **Problem**: Need for real-time gas price updates
- **Solution**: WebSocket connections for bidirectional real-time communication
- **Benefits**: Lower latency, reduced server load, better user experience
- **Trade-offs**: More complex connection management, fallback polling implemented

#### Zustand State Management
- **Problem**: Complex state synchronization between live and simulation modes
- **Solution**: Zustand for lightweight, type-safe state management
- **Benefits**: Simpler than Redux, TypeScript support, excellent DevTools
- **Features**: Mode switching, chain selection, simulation results management

#### Direct Uniswap Integration
- **Problem**: Avoid dependency on external price APIs
- **Solution**: Direct integration with Uniswap V3 pool contracts
- **Benefits**: No API rate limits, real-time price updates, decentralized
- **Implementation**: Raw sqrtPriceX96 calculation from Swap events

#### Drizzle ORM Choice
- **Problem**: Type-safe database operations with PostgreSQL
- **Solution**: Drizzle ORM with shared schema definitions
- **Benefits**: Full TypeScript support, lightweight, excellent migrations
- **Features**: Shared types between client and server, Zod validation integration

## Recent Changes (January 2025)

### Implemented Missing Features
- **Wallet Simulator**: Complete wallet simulation with demo address generation, balance tracking, transaction cost comparison, and gas optimization recommendations
- **Real Uniswap V3 Integration**: Added real ETH/USD price fetching from Uniswap V3 pool contract with automatic fallback to simulation when RPC endpoints are rate-limited
- **Fixed Candlestick Chart**: Resolved TypeScript errors and chart initialization issues with proper lightweight-charts v5.0.8 integration
- **Enhanced UI**: Added Live/Simulation mode toggle with distinct interfaces for different use cases

### Technical Improvements
- Improved chart initialization with proper error handling and TypeScript types
- Enhanced data validation in aggregateToCandles function
- Added comprehensive wallet simulation with realistic gas cost analysis
- Implemented dual-mode architecture (Live vs Simulation)
