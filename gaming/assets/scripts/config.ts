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
      gameAddress: '0x8311344cB31Db458B6b8FbdD14ff798776e7E04c'
  },
  'Avalanche Fuji testnet': {
    gameAddress: ''
  },
  'Polygon Amoy testnet': {
    gameAddress: ''
  },
}

// zk, Sindri
export const  BEARER_TOKEN = "sindri_FU1t47kuCWy55EeiYotj9EysFiKj2AIX_07c4";
export const  timeValidator_CIRCUIT_ID = "70811d8a-fd42-4176-abf0-09a0484a23eb";