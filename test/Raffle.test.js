const { network, getNamedAccounts, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { assert, expect } = require("chai");

console.log("getcontract", typeof ethers.getContractAt());
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit test", async function () {
      let raffle, vrfCoordinatorV2Mock, raffleEnteranceFee, deployer, interval;
      const chainId = network.config.chainId;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);

        // Get the Signer instance for deployer
        const signer = await ethers.getSigner(deployer);

        // Get Raffle deployment and contract
        const raffleDeployment = await deployments.get("Raffle");
        raffle = await ethers.getContractAt(
          "Raffle",
          raffleDeployment.address,
          signer
        );

        // Get VRFCoordinatorV2Mock deployment and contract
        const vrfCoordinatorV2MockDeployment = await deployments.get(
          "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Mock = await ethers.getContractAt(
          "VRFCoordinatorV2Mock",
          vrfCoordinatorV2MockDeployment.address,
          signer
        );
        raffleEnteranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe("constructor", async function () {
        it("Intializes the raffle correctly", async function () {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        });
      });

      describe("enterRaffle", async function () {
        it("reverts when you don't pay enough", async function () {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle__SendMoreToEnterRaffle"
          );
        });
        it("records player when they enter", async function () {
          await raffle.enterRaffle({ value: raffleEnteranceFee });
          const playerFromContract = await raffle.getPlayer(0); // ⬅️ Add await here
          assert.equal(playerFromContract, deployer); // ✅
        });
        it("emits event on enter", async function () {
          await expect(
            raffle.enterRaffle({ value: raffleEnteranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });
        it("doesn't allow if raffle is not open", async function () {
          await raffle.enterRaffle({ value: raffleEnteranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          // We pretend to be a ChainLink keeper
          await raffle.performUpkeep();
          await expect(
            raffle.enterRaffle({ value: raffleEnteranceFee })
          ).to.be.revertedWith("Raffle__RaffleNotOpen");
        });
      });
      describe("checkUpkeep", async function () {
        it("returns false if people haven't", async function () {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
      });
    });
