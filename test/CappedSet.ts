import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CappedSet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    const n = 5;
    const CappedSet = await ethers.getContractFactory("CappedSet");
    const cappedSet = await CappedSet.deploy(n);

    return { cappedSet };
  }

  describe("Insert", function () {
    it("Should return address(0) and value 0 in the first time", async function () {
      const { cappedSet } = await loadFixture(deploy);
      const [addr1, addr2] = await ethers.getSigners();
      console.log('input add ', addr1.address)
      const value1 = 1;
      const value2 = 2;
      const add = await cappedSet.callStatic.insert(addr1.address, value1);

      const add2 = await cappedSet.callStatic.insert(addr2.address, value2);
      console.log('add2 === ', add2);

      // expect(await lock.unlockTime()).to.equal(unlockTime);
    });

  });


});
