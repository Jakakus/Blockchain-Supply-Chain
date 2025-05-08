const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('SupplyChainTracker', function () {
  let SupplyChainTracker;
  let supplyChainTracker;
  let owner;
  let manufacturer;
  let distributor;
  let retailer;
  let customer;

  // Common constants
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
  const MANUFACTURER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MANUFACTURER_ROLE'));
  const DISTRIBUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DISTRIBUTOR_ROLE'));
  const RETAILER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RETAILER_ROLE'));

  // Test data
  const productName = 'Premium Smartphone';
  const manufacturerName = 'TechCorp';
  const initialDocuments = ['ipfs://Qm...123', 'ipfs://Qm...456'];
  const transferLocation = 'Distribution Center, San Francisco';
  const transferSignature = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('signed-data')));

  beforeEach(async function () {
    // Get the signers
    [owner, manufacturer, distributor, retailer, customer] = await ethers.getSigners();

    // Deploy the contract
    SupplyChainTracker = await ethers.getContractFactory('SupplyChainTracker');
    supplyChainTracker = await upgrades.deployProxy(
      SupplyChainTracker,
      [owner.address],
      { initializer: 'initialize', kind: 'uups' }
    );
    await supplyChainTracker.deployed();

    // Setup roles
    await supplyChainTracker.addManufacturer(manufacturer.address);
    await supplyChainTracker.addDistributor(distributor.address);
    await supplyChainTracker.addRetailer(retailer.address);
  });

  describe('Deployment', function () {
    it('Should set the correct owner', async function () {
      expect(await supplyChainTracker.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it('Should assign correct roles', async function () {
      expect(await supplyChainTracker.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.equal(true);
      expect(await supplyChainTracker.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.equal(true);
      expect(await supplyChainTracker.hasRole(RETAILER_ROLE, retailer.address)).to.equal(true);
    });
  });

  describe('Product Registration', function () {
    it('Should allow manufacturer to register a product', async function () {
      // Connect as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      
      // Register a product
      const tx = await manufacturerContract.registerProduct(
        productName,
        manufacturerName,
        initialDocuments
      );
      
      // Get the receipt
      const receipt = await tx.wait();
      
      // Find the ProductRegistered event
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      expect(event).to.not.be.undefined;
      
      // Check product ID
      const productId = event.args.productId;
      expect(productId).to.equal(1);
      
      // Verify product details
      const product = await supplyChainTracker.getProduct(productId);
      expect(product.name).to.equal(productName);
      expect(product.manufacturer).to.equal(manufacturerName);
      expect(product.currentOwner).to.equal(manufacturer.address);
      expect(product.status).to.equal(0); // ProductStatus.Created
      expect(product.isVerified).to.equal(true);
      
      // Verify documents
      const documents = await supplyChainTracker.getProductDocuments(productId);
      expect(documents.length).to.equal(initialDocuments.length);
      expect(documents[0]).to.equal(initialDocuments[0]);
      expect(documents[1]).to.equal(initialDocuments[1]);
    });

    it('Should not allow non-manufacturer to register a product', async function () {
      // Connect as customer (not a manufacturer)
      const customerContract = supplyChainTracker.connect(customer);
      
      // Attempt to register a product
      await expect(
        customerContract.registerProduct(productName, manufacturerName, initialDocuments)
      ).to.be.revertedWith(/AccessControl/); // Expects access control error
    });
  });

  describe('Product Transfer', function () {
    let productId;

    beforeEach(async function () {
      // Register a product as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const tx = await manufacturerContract.registerProduct(
        productName,
        manufacturerName,
        initialDocuments
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      productId = event.args.productId;
    });

    it('Should allow owner to transfer a product', async function () {
      // Transfer from manufacturer to distributor
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const tx = await manufacturerContract.transferProduct(
        productId,
        distributor.address,
        transferLocation,
        transferSignature
      );
      
      // Get the receipt
      const receipt = await tx.wait();
      
      // Find the ProductTransferred event
      const event = receipt.events.find(event => event.event === 'ProductTransferred');
      expect(event).to.not.be.undefined;
      
      // Verify transfer details
      expect(event.args.productId).to.equal(productId);
      expect(event.args.from).to.equal(manufacturer.address);
      expect(event.args.to).to.equal(distributor.address);
      
      // Verify product ownership change
      const product = await supplyChainTracker.getProduct(productId);
      expect(product.currentOwner).to.equal(distributor.address);
      expect(product.status).to.equal(1); // ProductStatus.InTransit
      
      // Verify transfer history
      const transfers = await supplyChainTracker.getProductTransferHistory(productId);
      expect(transfers.length).to.equal(1);
      expect(transfers[0].from).to.equal(manufacturer.address);
      expect(transfers[0].to).to.equal(distributor.address);
      expect(transfers[0].location).to.equal(transferLocation);
    });

    it('Should not allow non-owner to transfer a product', async function () {
      // Attempt transfer by non-owner (distributor)
      const distributorContract = supplyChainTracker.connect(distributor);
      
      await expect(
        distributorContract.transferProduct(
          productId,
          retailer.address,
          transferLocation,
          transferSignature
        )
      ).to.be.revertedWith('Not the product owner');
    });
  });

  describe('Status Updates', function () {
    let productId;

    beforeEach(async function () {
      // Register a product as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const tx = await manufacturerContract.registerProduct(
        productName,
        manufacturerName,
        initialDocuments
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      productId = event.args.productId;
      
      // Transfer to distributor
      await manufacturerContract.transferProduct(
        productId,
        distributor.address,
        transferLocation,
        transferSignature
      );
    });

    it('Should allow owner to update product status', async function () {
      // Update status as the current owner (distributor)
      const distributorContract = supplyChainTracker.connect(distributor);
      const tx = await distributorContract.updateProductStatus(productId, 2); // ProductStatus.Delivered
      
      // Get the receipt
      const receipt = await tx.wait();
      
      // Find the ProductStatusUpdated event
      const event = receipt.events.find(event => event.event === 'ProductStatusUpdated');
      expect(event).to.not.be.undefined;
      
      // Verify status update
      expect(event.args.productId).to.equal(productId);
      expect(event.args.status).to.equal(2); // ProductStatus.Delivered
      
      // Verify product status
      const product = await supplyChainTracker.getProduct(productId);
      expect(product.status).to.equal(2); // ProductStatus.Delivered
    });

    it('Should not allow non-owner to update product status', async function () {
      // Attempt status update by non-owner (manufacturer)
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      
      await expect(
        manufacturerContract.updateProductStatus(productId, 2) // ProductStatus.Delivered
      ).to.be.revertedWith('Not the product owner');
    });
  });

  describe('Document Management', function () {
    let productId;

    beforeEach(async function () {
      // Register a product as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const tx = await manufacturerContract.registerProduct(
        productName,
        manufacturerName,
        initialDocuments
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      productId = event.args.productId;
    });

    it('Should allow owner to add a document', async function () {
      // Add document as the current owner (manufacturer)
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const newDocument = 'ipfs://Qm...789';
      const tx = await manufacturerContract.addDocument(productId, newDocument);
      
      // Get the receipt
      const receipt = await tx.wait();
      
      // Find the DocumentAdded event
      const event = receipt.events.find(event => event.event === 'DocumentAdded');
      expect(event).to.not.be.undefined;
      
      // Verify document update
      expect(event.args.productId).to.equal(productId);
      expect(event.args.documentHash).to.equal(newDocument);
      
      // Verify documents list
      const documents = await supplyChainTracker.getProductDocuments(productId);
      expect(documents.length).to.equal(initialDocuments.length + 1);
      expect(documents[documents.length - 1]).to.equal(newDocument);
    });

    it('Should not allow non-owner to add a document', async function () {
      // Attempt to add document by non-owner (distributor)
      const distributorContract = supplyChainTracker.connect(distributor);
      const newDocument = 'ipfs://Qm...789';
      
      await expect(
        distributorContract.addDocument(productId, newDocument)
      ).to.be.revertedWith('Not the product owner');
    });
  });

  describe('Role Management', function () {
    it('Should allow admin to add a new manufacturer', async function () {
      // Add new manufacturer
      await supplyChainTracker.addManufacturer(customer.address);
      
      // Verify role assignment
      expect(await supplyChainTracker.hasRole(MANUFACTURER_ROLE, customer.address)).to.equal(true);
    });

    it('Should not allow non-admin to add a new manufacturer', async function () {
      // Connect as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      
      // Attempt to add a new manufacturer
      await expect(
        manufacturerContract.addManufacturer(customer.address)
      ).to.be.revertedWith(/AccessControl/); // Expects access control error
    });
  });

  describe('Product Verification', function () {
    let productId;

    beforeEach(async function () {
      // Register a product as manufacturer
      const manufacturerContract = supplyChainTracker.connect(manufacturer);
      const tx = await manufacturerContract.registerProduct(
        productName,
        manufacturerName,
        initialDocuments
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      productId = event.args.productId;
      
      // Set product as not verified (for testing)
      // This is a bit of a hack for testing - in real contracts we wouldn't expose this directly
      const ProductStatus = { Created: 0, InTransit: 1, Delivered: 2, Sold: 3 };
      await manufacturerContract.transferProduct(productId, distributor.address, transferLocation, transferSignature);
      await manufacturerContract.transferProduct(productId, manufacturer.address, transferLocation, transferSignature);
    });

    it('Should allow admin to verify a product', async function () {
      // Verify product as admin
      const tx = await supplyChainTracker.verifyProduct(productId);
      
      // Get the receipt
      const receipt = await tx.wait();
      
      // Find the ProductVerified event
      const event = receipt.events.find(event => event.event === 'ProductVerified');
      expect(event).to.not.be.undefined;
      
      // Verify event details
      expect(event.args.productId).to.equal(productId);
      expect(event.args.verifier).to.equal(owner.address);
      
      // Verify product status
      const product = await supplyChainTracker.getProduct(productId);
      expect(product.isVerified).to.equal(true);
    });

    it('Should not allow non-admin to verify a product', async function () {
      // Attempt to verify product as distributor
      const distributorContract = supplyChainTracker.connect(distributor);
      
      await expect(
        distributorContract.verifyProduct(productId)
      ).to.be.revertedWith(/AccessControl/); // Expects access control error
    });
  });
}); 