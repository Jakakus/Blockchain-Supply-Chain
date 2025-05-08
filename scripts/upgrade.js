const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('Upgrading SupplyChainTracker contract...');

  // Get the proxy contract address from environment or hardcode for testing
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    console.error('Please set the PROXY_ADDRESS environment variable');
    process.exit(1);
  }

  console.log('Proxy contract address:', proxyAddress);

  // Get the ContractFactory of the implementation we want to upgrade to
  const SupplyChainTrackerV2 = await ethers.getContractFactory('SupplyChainTracker');
  
  console.log('Preparing upgrade...');
  
  // Upgrade the proxy to point to a new implementation
  const upgraded = await upgrades.upgradeProxy(proxyAddress, SupplyChainTrackerV2);
  
  console.log('SupplyChainTracker upgraded at address:', upgraded.address);
  console.log('(This should be the same address as the proxy)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during upgrade:', error);
    process.exit(1);
  }); 