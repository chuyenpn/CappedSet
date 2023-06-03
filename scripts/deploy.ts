import fs from 'fs';
import type { ethers } from "ethers";
import hre from "hardhat";
import hreType from "hardhat/types/runtime";
import { NetWorkExplorer, Process, Address, Config } from "./types";
import * as Contracts from "../typechain-types";

const hreEthers: typeof ethers & hreType.HardhatEthersHelpers = hre.ethers;
let network: string | undefined = hre.hardhatArguments.network;

const addressOutput: string = `${__dirname}/address.json`;
const deployConfig: string = `${__dirname}/config.json`;
const deployProgress: string = `${__dirname}/progress.json`;

const explorers: NetWorkExplorer = {
  bsctestnet: "https://testnet.bscscan.com",
};

async function main() {
  const addresses: Address = {};
  const config: Config = {};
  const progress: Process = {};

  const saveAddresses = async () => {
    await fs.promises.writeFile(addressOutput, JSON.stringify(addresses, null, 2));
    await fs.promises.writeFile(deployProgress, JSON.stringify(progress, null, 2));
    await fs.promises.writeFile(deployConfig, JSON.stringify(config, null, 2));
  };

  const runWithProgressCheck = async (tag: string, func: Function) => {
    if (progress[tag]) {
      console.log(`Skipping '${tag}'.`);
      return;
    }
    console.log(`Running: ${tag}`);
    try {
      if (func.constructor.name === "AsyncFunction") {
        await func();
      } else {
        func();
      }
    } catch (e) {
      throw e;
    }

    progress[tag] = true;
    await saveAddresses();
  };

  if (!network) {
    throw new Error("Not available network");
  }
  const explorer: string = explorers[network];

  console.log("Preparing... network = ", network);

  if (fs.existsSync(addressOutput)) {
    const data: Buffer = fs.readFileSync(addressOutput);
    Object.assign(addresses, JSON.parse(data.toString()));
  }

  if (fs.existsSync(deployConfig)) {
    const data: Buffer = fs.readFileSync(deployConfig);
    Object.assign(config, JSON.parse(data.toString()));
  }

  if (fs.existsSync(deployProgress)) {
    const data: Buffer = fs.readFileSync(deployProgress);
    Object.assign(progress, JSON.parse(data.toString()));
  }

  console.log('config = ', config);
  console.log('addresses = ', addresses);
  console.log("Deploying...");

  const CappedSet: Contracts.CappedSet__factory = await hreEthers.getContractFactory("CappedSet");
  const n: number = config.maxLength;

  try {
    await runWithProgressCheck("CappedSet", async () => {
      
      const cappedSet: Contracts.CappedSet = await CappedSet.deploy(n);
      await cappedSet.deployed();
      console.log(`CappedSet address at: ${explorer}/address/${cappedSet.address}`);
      addresses.CappedSet = cappedSet.address;
    });

  } catch (e) {
    console.log(e);
    await saveAddresses();
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
