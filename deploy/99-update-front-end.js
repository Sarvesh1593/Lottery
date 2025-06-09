const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const fs = require("fs");
const FRONT_END_ADDRESSES_FILE =
  "../Lottery-smart-contract/smart-lottery/constants/contractAddresses.json";
const FRONT_ENT_ABI_FILE =
  "../Lottery-smart-contract/smart-lottery/constants/abi.json";

module.exports = async function () {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating fron end...");
    updateContractAddresses();
    updateAbi();
  }
};

async function updateAbi() {
  const raffleDeployment = await deployments.get("Raffle");
  const raffle = await ethers.getContractAt("Raffle", raffleDeployment.address);
  fs.writeFileSync(
    FRONT_ENT_ABI_FILE,
    raffle.interface.format(ethers.utils.FormatTypes.json)
  );
}
async function updateContractAddresses() {
  const raffleDeployment = await deployments.get("Raffle");
  const chainId = network.config.chainId.toString();
  const raffle = await ethers.getContractAt("Raffle", raffleDeployment.address);
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
  );

  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(raffle.address)) {
      currentAddresses[chainId].push(raffle.address);
    }
  } else {
    currentAddresses[chainId] = [raffle.address];
  }

  fs.writeFileSync(
    FRONT_END_ADDRESSES_FILE,
    JSON.stringify(currentAddresses, null, 2)
  );
}

module.exports.tags = ["all", "frontend"];
