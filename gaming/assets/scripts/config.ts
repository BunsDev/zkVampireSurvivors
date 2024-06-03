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
      gameAddress: '0x601a1299435b006a41d7498b40720EEf9b5991A1'
  },
  'Avalanche Fuji testnet': {
    gameAddress: '0x793425DD140f50a9be395A3B628c704c4D969cCb'
  },
  'Polygon Amoy testnet': {
    gameAddress: '0x2A246afFf42559bD984A440428ad935670CAEF61'
  },
}

// zk, Sindri
export const  BEARER_TOKEN = "sindri_FU1t47kuCWy55EeiYotj9EysFiKj2AIX_07c4";
export const  timeValidator_CIRCUIT_ID = "70811d8a-fd42-4176-abf0-09a0484a23eb";