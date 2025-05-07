const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('Deploying ProductTracker contract...');

  // Get the contract factory
  const ProductTracker = await ethers.getContractFactory('ProductTracker');
  const ProductTrackerProxy = await ethers.getContractFactory('ProductTrackerProxy');
  
  // Deploy the implementation contract
  const productTrackerImpl = await ProductTracker.deploy();
  await productTrackerImpl.deployed();
  console.log('ProductTracker implementation deployed to:', productTrackerImpl.address);
  
  // Encode initialization data
  const initData = ProductTracker.interface.encodeFunctionData('initialize', ['SupplyChainNFT', 'SCN']);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  // Deploy the proxy contract
  const proxy = await ProductTrackerProxy.deploy(
    productTrackerImpl.address,
    deployer.address,
    initData
  );
  await proxy.deployed();
  console.log('ProductTrackerProxy deployed to:', proxy.address);
  
  // Create a ProductTracker instance with the proxy address
  const productTracker = ProductTracker.attach(proxy.address);
  
  // Grant roles to the deployer for testing
  const MANUFACTURER_ROLE = await productTracker.MANUFACTURER_ROLE();
  const DISTRIBUTOR_ROLE = await productTracker.DISTRIBUTOR_ROLE();
  const RETAILER_ROLE = await productTracker.RETAILER_ROLE();
  
  console.log('Granting roles to deployer...');
  
  // Grant each role to the deployer
  await productTracker.grantRole(MANUFACTURER_ROLE, deployer.address);
  await productTracker.grantRole(DISTRIBUTOR_ROLE, deployer.address);
  await productTracker.grantRole(RETAILER_ROLE, deployer.address);
  
  console.log('Roles granted to:', deployer.address);
  console.log('Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 