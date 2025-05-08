const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('Starting add-manufacturer script...');
    // Get the deployed contract
    const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
    console.log(`Using contract at address: ${contractAddress}`);
    
    console.log('Getting contract factory...');
    const SupplyChainTracker = await ethers.getContractFactory('SupplyChainTracker');
    console.log('Attaching to contract...');
    const contract = SupplyChainTracker.attach(contractAddress);
    
    // User's MetaMask address
    const yourAddress = '0x73072b26Be3C7d344dc3F4101eb8B7DE19148A41';
    console.log(`Target address for manufacturer role: ${yourAddress}`);
    
    console.log('Getting accounts...');
    const accounts = await ethers.getSigners();
    console.log(`Using account: ${accounts[0].address} to grant role`);
    
    // Check if already has role
    console.log('Getting manufacturer role...');
    const manufacturerRole = await contract.MANUFACTURER_ROLE();
    console.log(`Manufacturer role hash: ${manufacturerRole}`);
    
    console.log('Checking if address has manufacturer role...');
    const hasRoleBefore = await contract.hasRole(manufacturerRole, yourAddress);
    console.log(`Address has manufacturer role before: ${hasRoleBefore}`);
    
    if (hasRoleBefore) {
      console.log('Address already has manufacturer role. No action needed.');
    } else {
      // Add manufacturer role
      console.log(`Adding manufacturer role to ${yourAddress}...`);
      const tx = await contract.addManufacturer(yourAddress);
      console.log(`Transaction submitted: ${tx.hash}`);
      
      console.log('Waiting for transaction confirmation...');
      await tx.wait();
      console.log('Transaction confirmed!');
      
      // Verify again
      const hasRoleAfter = await contract.hasRole(manufacturerRole, yourAddress);
      console.log(`Address has manufacturer role after: ${hasRoleAfter}`);
      
      if (hasRoleAfter) {
        console.log('✅ Role assigned successfully!');
      } else {
        console.log('❌ Role assignment failed! Please check contract permissions.');
      }
    }
  } catch (error) {
    console.error('Error occurred:');
    console.error(error.message);
    
    if (error.message.includes('not authorized')) {
      console.log('\nTIP: You might not have admin role to grant permissions.');
      console.log('Try using the account that deployed the contract.');
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Uncaught error:', error);
    process.exit(1);
  }); 