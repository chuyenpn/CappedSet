# Implement a set-like structure in Solidity

This project for assignment CappedSet - RikkeiSoft solution\
\
v0.2: first simple solution using hashmap with index as address - value pair; find smallest value element by iterating through all elemets. Have issues with high gas (Max 12 Million Gas when Capped = 1000 - Insert Operation) \
\
Gas Image

![Gas Image v0.2]([URL or file path](https://raw.githubusercontent.com/chuyenpn/CappedSet/master/docs/test-result-v0.2.png))



v0.3: Recommended version using Red Black Tree Library from [Red-Black Binary Search Tree Library](https://github.com/bokkypoobah/BokkyPooBahsRedBlackTreeLibrary)\
      Much better gas usage with maximum gas ~ 400,000 (0.0011 BNB per transaction) when Capped Number = 1000 \
      Should scale well with high Capped Number since all operation complexity is O(logN) \
\
Gas Image

![Gas Image v0.3]([URL or file path](https://raw.githubusercontent.com/chuyenpn/CappedSet/master/docs/test-result-v0.3-red-black-tree.png))


Try running some of the following tasks:

```shell
yarn
copy .env.example .env
npx hardhat help
npx hardhat test
```

Choose Type Script Project in "npx hardhat test" in case being asked.
Test Scenario in Test Folder, Change Capped Number file CappedSet.ts
const MAX_LENGTH = 1000;

To deploy, create .env file (see .env.example file for sample), then run command

```shell
npx hardhat run scripts/deploy.ts --network bsctestnet
```

[Contract deployed and verified on BNB Smart Chain Testnet](https://testnet.bscscan.com/address/0xa174d628a00ca2f10fa62b4c5231469678c30d61)