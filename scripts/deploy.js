const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('Deploying SupplyChainTracker contract...');

  // Get the ContractFactory
  const SupplyChainTracker = await ethers.getContractFactory('SupplyChainTracker');
  
  // Get the first account as the deployer
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  
  // Deploy as upgradeable contract
  console.log('Deploying SupplyChainTracker...');
  const supplyChainTracker = await upgrades.deployProxy(
    SupplyChainTracker, 
    [deployer.address], // Initialize with deployer as admin
    { 
      initializer: 'initialize',
      kind: 'uups' 
    }
  );
  
  await supplyChainTracker.deployed();
  console.log('SupplyChainTracker deployed to:', supplyChainTracker.address);

  // Add some roles for testing
  console.log('Setting up test roles...');
  const accounts = await ethers.getSigners();
  
  // Add manufacturer role to your MetaMask address
  const userMetaMaskAddress = '0x73072b26Be3C7d344dc3F4101eb8B7DE19148A41';
  await supplyChainTracker.addManufacturer(userMetaMaskAddress);
  console.log('Added manufacturer role to MetaMask address:', userMetaMaskAddress);
  
  // Set up a manufacturer role for the second account
  if (accounts.length > 1) {
    await supplyChainTracker.addManufacturer(accounts[1].address);
    console.log('Added manufacturer role to:', accounts[1].address);
  }
  
  // Set up a distributor role for the third account
  if (accounts.length > 2) {
    await supplyChainTracker.addDistributor(accounts[2].address);
    console.log('Added distributor role to:', accounts[2].address);
  }
  
  // Set up a retailer role for the fourth account
  if (accounts.length > 3) {
    await supplyChainTracker.addRetailer(accounts[3].address);
    console.log('Added retailer role to:', accounts[3].address);
  }
  
  console.log('Deployment and setup completed successfully!');
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during deployment:', error);
    process.exit(1);
  }); 