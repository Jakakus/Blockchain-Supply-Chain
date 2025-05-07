const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ProductTracker', function () {
  let ProductTracker;
  let productTracker;
  let owner;
  let manufacturer;
  let distributor;
  let retailer;
  let consumer;
  
  // Roles
  let MANUFACTURER_ROLE;
  let DISTRIBUTOR_ROLE;
  let RETAILER_ROLE;
  let CONSUMER_ROLE;
  
  beforeEach(async function () {
    // Get contract factory
    ProductTracker = await ethers.getContractFactory('ProductTracker');
    
    // Get signers
    [owner, manufacturer, distributor, retailer, consumer] = await ethers.getSigners();
    
    // Deploy contract
    productTracker = await ProductTracker.deploy();
    await productTracker.deployed();
    
    // Initialize contract
    await productTracker.initialize('SupplyChainNFT', 'SCN');
    
    // Get roles
    MANUFACTURER_ROLE = await productTracker.MANUFACTURER_ROLE();
    DISTRIBUTOR_ROLE = await productTracker.DISTRIBUTOR_ROLE();
    RETAILER_ROLE = await productTracker.RETAILER_ROLE();
    CONSUMER_ROLE = await productTracker.CONSUMER_ROLE();
    
    // Grant roles
    await productTracker.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await productTracker.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await productTracker.grantRole(RETAILER_ROLE, retailer.address);
    await productTracker.grantRole(CONSUMER_ROLE, consumer.address);
  });
  
  describe('Initialization', function () {
    it('Should initialize with correct name and symbol', async function () {
      expect(await productTracker.name()).to.equal('SupplyChainNFT');
      expect(await productTracker.symbol()).to.equal('SCN');
    });
    
    it('Should assign roles correctly', async function () {
      expect(await productTracker.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
      expect(await productTracker.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
      expect(await productTracker.hasRole(RETAILER_ROLE, retailer.address)).to.be.true;
      expect(await productTracker.hasRole(CONSUMER_ROLE, consumer.address)).to.be.true;
    });
  });
  
  describe('Product Creation', function () {
    it('Should create a product when called by a manufacturer', async function () {
      // Create product as manufacturer
      await productTracker.connect(manufacturer).createProduct(
        manufacturer.address,
        'Test Product',
        'Test Manufacturer',
        'Test Location',
        'ipfs://testURI'
      );
      
      // Check that the product was created
      const tokenId = 1; // First token should have ID 1
      expect(await productTracker.ownerOf(tokenId)).to.equal(manufacturer.address);
      expect(await productTracker.tokenURI(tokenId)).to.equal('ipfs://testURI');
      
      // Get product details
      const productDetails = await productTracker.getProductBasicDetails(tokenId);
      expect(productDetails.productName).to.equal('Test Product');
      expect(productDetails.manufacturer).to.equal('Test Manufacturer');
      expect(productDetails.productionLocation).to.equal('Test Location');
      expect(productDetails.isAuthentic).to.be.true;
    });
    
    it('Should fail if non-manufacturer tries to create a product', async function () {
      // Try to create product as distributor (should fail)
      await expect(
        productTracker.connect(distributor).createProduct(
          distributor.address,
          'Test Product',
          'Test Manufacturer',
          'Test Location',
          'ipfs://testURI'
        )
      ).to.be.revertedWith('Must have manufacturer role');
    });
  });
  
  describe('Supply Chain Tracking', function () {
    let tokenId;
    
    beforeEach(async function () {
      // Create a product first
      await productTracker.connect(manufacturer).createProduct(
        manufacturer.address,
        'Test Product',
        'Test Manufacturer',
        'Factory',
        'ipfs://testURI'
      );
      
      tokenId = 1; // First token ID
    });
    
    it('Should add supply chain steps', async function () {
      // Add step as manufacturer
      await productTracker.connect(manufacturer).addSupplyChainStep(
        tokenId,
        'Distribution Center',
        'Manufacturer',
        'Product shipped to distribution center'
      );
      
      // Get step details
      const stepDetails = await productTracker.getSupplyChainStep(tokenId, 1); // Step at index 1 (second step)
      expect(stepDetails.location).to.equal('Distribution Center');
      expect(stepDetails.handlerRole).to.equal('Manufacturer');
      expect(stepDetails.notes).to.equal('Product shipped to distribution center');
      expect(stepDetails.handler).to.equal(manufacturer.address);
    });
    
    it('Should transfer product ownership', async function () {
      // Transfer from manufacturer to distributor
      await productTracker.connect(manufacturer).transferProduct(
        distributor.address,
        tokenId,
        'Manufacturer',
        'Distributor'
      );
      
      // Check new owner
      expect(await productTracker.ownerOf(tokenId)).to.equal(distributor.address);
    });
    
    it('Should handle product authentication', async function () {
      // Set product as not authentic (by admin)
      await productTracker.connect(owner).authenticateProduct(tokenId, false);
      
      // Check authenticity
      const productDetails = await productTracker.getProductBasicDetails(tokenId);
      expect(productDetails.isAuthentic).to.be.false;
    });
  });
}); 