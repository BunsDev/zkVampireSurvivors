export const web3Config = {
    'Ethereum Sepolia testnet': {
        chainId: "0xaa36a7",
        rpcUrls: ["https://sepolia.drpc.org"],
        chainName: "Scroll Sepolia Testnet",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH", // 2-6 characters long
          decimals: 18,
        },
    },
    'Avalanche Fuji testnet': {
        chainId: "0xa869",
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        chainName: "Avalanche Fuji Testnet",
        nativeCurrency: {
          name: "AVAX",
          symbol: "AVAX", // 2-6 characters long
          decimals: 18,
        },
    },
    'Polygon Amoy testnet': {
        chainId: "0x13882",
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        chainName: "Polygon Amoy testnet",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC", // 2-6 characters long
          decimals: 18,
        },
    },
}

export const web3ContractConfig = {
  'Ethereum Sepolia testnet': {
      gameAddress: '0x3e1eb98B5150eb7Fb49De2419821Ed26615B0691'
  },
  'Avalanche Fuji testnet': {
    gameAddress: ''
  },
  'Polygon Amoy testnet': {
    gameAddress: ''
  },
}