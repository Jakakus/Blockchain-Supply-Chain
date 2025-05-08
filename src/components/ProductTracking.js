import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SupplyChainTracker from '../artifacts/contracts/SupplyChainTracker.sol/SupplyChainTracker.json';

// Change this to your deployed contract address
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const ProductTracking = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    manufacturer: '',
    documents: []
  });
  const [transferProduct, setTransferProduct] = useState({
    productId: '',
    recipient: '',
    location: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Check if Metamask is installed
        if (window.ethereum) {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          setAccount(account);
          
          // Create ethers provider and signer
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Create contract instance
          const supplyChainContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            SupplyChainTracker.abi,
            signer
          );
          
          setContract(supplyChainContract);
          
          // Load owned products
          await loadProducts(supplyChainContract, account);
          
          setLoading(false);
        } else {
          setError('Metamask is not installed. Please install it to use this application.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize. Please check console for details.');
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  // Function to load products owned by the current account
  const loadProducts = async (contract, account) => {
    try {
      const productIds = await contract.getProductsByOwner(account);
      
      const productsDetails = [];
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        const product = await contract.getProduct(productId);
        const documents = await contract.getProductDocuments(productId);
        const transfers = await contract.getProductTransferHistory(productId);
        
        productsDetails.push({
          id: productId.toString(),
          name: product.name,
          manufacturer: product.manufacturer,
          currentOwner: product.currentOwner,
          productionDate: new Date(product.productionDate.toNumber() * 1000).toLocaleString(),
          lastUpdated: new Date(product.lastUpdated.toNumber() * 1000).toLocaleString(),
          status: ['Created', 'InTransit', 'Delivered', 'Sold'][product.status],
          isVerified: product.isVerified,
          documents: documents,
          transfers: transfers.map(t => ({
            transferId: t.transferId.toString(),
            from: t.from,
            to: t.to,
            location: t.location,
            timestamp: new Date(t.timestamp.toNumber() * 1000).toLocaleString()
          }))
        });
      }
      
      setProducts(productsDetails);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please check console for details.');
    }
  };
  
  // Function to handle creating a new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.manufacturer) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Split documents by comma or line break
      const documents = newProduct.documents
        ? newProduct.documents.split(/[\n,]/).map(d => d.trim()).filter(Boolean)
        : [];
      
      // Call the contract function
      const tx = await contract.registerProduct(
        newProduct.name,
        newProduct.manufacturer,
        documents
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Reset form
      setNewProduct({
        name: '',
        manufacturer: '',
        documents: []
      });
      
      // Reload products
      await loadProducts(contract, account);
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product. Please check console for details.');
      setLoading(false);
    }
  };
  
  // Function to handle transferring a product
  const handleTransferProduct = async (e) => {
    e.preventDefault();
    
    if (!transferProduct.productId || !transferProduct.recipient || !transferProduct.location) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a dummy signature (in production this would be a real signature)
      const message = `Transfer product ${transferProduct.productId} to ${transferProduct.recipient} at ${transferProduct.location}`;
      const messageBytes = ethers.utils.toUtf8Bytes(message);
      const messageHash = ethers.utils.keccak256(messageBytes);
      const signature = ethers.utils.arrayify(messageHash);
      
      // Call the contract function
      const tx = await contract.transferProduct(
        transferProduct.productId,
        transferProduct.recipient,
        transferProduct.location,
        signature
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Reset form
      setTransferProduct({
        productId: '',
        recipient: '',
        location: '',
      });
      
      // Reload products
      await loadProducts(contract, account);
      
      setLoading(false);
    } catch (error) {
      console.error('Error transferring product:', error);
      setError('Failed to transfer product. Please check console for details.');
      setLoading(false);
    }
  };
  
  // Function to handle updating product status
  const handleUpdateStatus = async (productId, newStatus) => {
    try {
      setLoading(true);
      
      // Convert status string to enum value
      const statusEnum = ['Created', 'InTransit', 'Delivered', 'Sold'].indexOf(newStatus);
      
      if (statusEnum === -1) {
        setError('Invalid status value');
        setLoading(false);
        return;
      }
      
      // Call the contract function
      const tx = await contract.updateProductStatus(productId, statusEnum);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Reload products
      await loadProducts(contract, account);
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please check console for details.');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="product-tracking">
      <h1>Blockchain Supply Chain Tracker</h1>
      
      <div className="account-info">
        <h2>Account Information</h2>
        <p>Connected Account: {account}</p>
      </div>
      
      <div className="product-registration">
        <h2>Register New Product</h2>
        <form onSubmit={handleCreateProduct}>
          <div className="form-group">
            <label htmlFor="name">Product Name:</label>
            <input
              type="text"
              id="name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="manufacturer">Manufacturer:</label>
            <input
              type="text"
              id="manufacturer"
              value={newProduct.manufacturer}
              onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="documents">Documents (IPFS URLs, one per line or comma-separated):</label>
            <textarea
              id="documents"
              value={newProduct.documents}
              onChange={(e) => setNewProduct({...newProduct, documents: e.target.value})}
              rows={3}
            />
          </div>
          
          <button type="submit" disabled={loading}>Register Product</button>
        </form>
      </div>
      
      <div className="product-transfer">
        <h2>Transfer Product</h2>
        <form onSubmit={handleTransferProduct}>
          <div className="form-group">
            <label htmlFor="productId">Product ID:</label>
            <input
              type="text"
              id="productId"
              value={transferProduct.productId}
              onChange={(e) => setTransferProduct({...transferProduct, productId: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address:</label>
            <input
              type="text"
              id="recipient"
              value={transferProduct.recipient}
              onChange={(e) => setTransferProduct({...transferProduct, recipient: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              value={transferProduct.location}
              onChange={(e) => setTransferProduct({...transferProduct, location: e.target.value})}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>Transfer Product</button>
        </form>
      </div>
      
      <div className="owned-products">
        <h2>Your Products</h2>
        {products.length === 0 ? (
          <p>You don't own any products yet.</p>
        ) : (
          <div className="product-list">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <div className="product-details">
                  <p><strong>ID:</strong> {product.id}</p>
                  <p><strong>Manufacturer:</strong> {product.manufacturer}</p>
                  <p><strong>Status:</strong> {product.status}</p>
                  <p><strong>Verified:</strong> {product.isVerified ? 'Yes' : 'No'}</p>
                  <p><strong>Production Date:</strong> {product.productionDate}</p>
                  <p><strong>Last Updated:</strong> {product.lastUpdated}</p>
                  
                  <div className="product-documents">
                    <h4>Documents:</h4>
                    {product.documents.length === 0 ? (
                      <p>No documents</p>
                    ) : (
                      <ul>
                        {product.documents.map((doc, index) => (
                          <li key={index}>
                            <a href={doc} target="_blank" rel="noopener noreferrer">
                              {doc}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="product-transfers">
                    <h4>Transfer History:</h4>
                    {product.transfers.length === 0 ? (
                      <p>No transfers</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Location</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.transfers.map(transfer => (
                            <tr key={transfer.transferId}>
                              <td>{transfer.from.substring(0, 8)}...</td>
                              <td>{transfer.to.substring(0, 8)}...</td>
                              <td>{transfer.location}</td>
                              <td>{transfer.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div className="product-actions">
                    <h4>Actions:</h4>
                    <div className="action-buttons">
                      <button onClick={() => handleUpdateStatus(product.id, 'Delivered')}>
                        Mark as Delivered
                      </button>
                      <button onClick={() => handleUpdateStatus(product.id, 'Sold')}>
                        Mark as Sold
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTracking; 