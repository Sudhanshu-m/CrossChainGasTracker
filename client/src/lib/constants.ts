export const CHAINS = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'fab fa-ethereum',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    color: 'text-blue-400',
    description: 'Mainnet'
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: 'fas fa-layer-group',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    color: 'text-purple-400',
    description: 'PoS Chain'
  },
  arbitrum: {
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: 'fas fa-fast-forward',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    color: 'text-cyan-400',
    description: 'One'
  }
};

export const TRANSACTION_TYPES = {
  transfer: { name: 'Simple Transfer', gasLimit: 21000 },
  erc20: { name: 'ERC-20 Transfer', gasLimit: 65000 },
  swap: { name: 'Uniswap Swap', gasLimit: 150000 },
  nft: { name: 'NFT Mint', gasLimit: 100000 }
};

export const CHART_INTERVALS = {
  '15m': { name: '15 Minutes', value: 15 },
  '1h': { name: '1 Hour', value: 60 },
  '4h': { name: '4 Hours', value: 240 },
  '1d': { name: '1 Day', value: 1440 }
};
