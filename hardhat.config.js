require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}; 