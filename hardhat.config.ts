import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const BSC_TESTNET_PROVIDER: string = process.env.BSC_TESTNET_PROVIDER || "https://data-seed-prebsc-1-s3.binance.org:8545/";
const MNEMONIC: string | undefined = process.env.MNEMONIC;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bsctestnet: {
      url: BSC_TESTNET_PROVIDER,
      chainId: 97,
      gas: 8000000,
      accounts: {
        mnemonic: MNEMONIC
      }
    },
  }
};

export default config;
