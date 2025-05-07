import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ProductTrackerABI from '../abis/ProductTracker.json';

const ProductTracking = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    manufacturer: '',
    location: ''
  });
  
  // Initialize web3 and contract
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        // Modern dapp browsers
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            setWeb3(web3Instance);
            
            // Get connected accounts
            const accts = await web3Instance.eth.getAccounts();
            setAccounts(accts);
            
            // Get network ID
            const networkId = await web3Instance.eth.net.getId();
            
            // Get contract instance
            const deployedNetwork = ProductTrackerABI.networks[networkId];
            if (deployedNetwork) {
              const instance = new web3Instance.eth.Contract(
                ProductTrackerABI.abi,
                deployedNetwork.address
              );
              setContract(instance);
            } else {
              setError('Contract not deployed on the current network');
            }
          } catch (error) {
            setError('User denied account access');
          }
        }
        // Legacy dapp browsers
        else if (window.web3) {
          const web3Instance = new Web3(window.web3.currentProvider);
          setWeb3(web3Instance);
        }
        // Non-dapp browsers
        else {
          setError('Non-Ethereum browser detected. Consider trying MetaMask!');
        }
        
        setLoading(false);
      } catch (error) {
        setError(`Error initializing web3: ${error.message}`);
        setLoading(false);
      }
    };
    
    initWeb3();
  }, []);
  
  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (contract && accounts.length > 0) {
        try {
          // Get total number of tokens
          const balance = await contract.methods.balanceOf(accounts[0]).call();
          
          // Load each product
          const productsList = [];
          for (let i = 0; i < balance; i++) {
            const tokenId = await contract.methods.tokenOfOwnerByIndex(accounts[0], i).call();
            const details = await contract.methods.getProductBasicDetails(tokenId).call();
            
            productsList.push({
              id: tokenId,
              name: details.productName,
              manufacturer: details.manufacturer,
              date: new Date(details.manufacturingDate * 1000).toLocaleString(),
              location: details.productionLocation,
              steps: parseInt(details.currentStep),
              authentic: details.isAuthentic
            });
          }
          
          setProducts(productsList);
        } catch (error) {
          setError(`Error loading products: ${error.message}`);
        }
      }
    };
    
    loadProducts();
  }, [contract, accounts]);
  
  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };
  
  // Create new product
  const createProduct = async (e) => {
    e.preventDefault();
    
    if (contract && accounts.length > 0) {
      try {
        setLoading(true);
        
        await contract.methods.createProduct(
          accounts[0],
          newProduct.name,
          newProduct.manufacturer,
          newProduct.location,
          `ipfs://placeholder/${Date.now()}`
        ).send({ from: accounts[0] });
        
        // Reset form
        setNewProduct({
          name: '',
          manufacturer: '',
          location: ''
        });
        
        // Reload products
        const balance = await contract.methods.balanceOf(accounts[0]).call();
        const tokenId = await contract.methods.tokenOfOwnerByIndex(accounts[0], balance - 1).call();
        const details = await contract.methods.getProductBasicDetails(tokenId).call();
        
        setProducts([
          ...products,
          {
            id: tokenId,
            name: details.productName,
            manufacturer: details.manufacturer,
            date: new Date(details.manufacturingDate * 1000).toLocaleString(),
            location: details.productionLocation,
            steps: parseInt(details.currentStep),
            authentic: details.isAuthentic
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        setError(`Error creating product: ${error.message}`);
        setLoading(false);
      }
    }
  };
  
  // Track product
  const trackProduct = async (tokenId) => {
    if (contract && accounts.length > 0) {
      try {
        const details = await contract.methods.getProductBasicDetails(tokenId).call();
        
        // Get all steps
        const steps = [];
        for (let i = 0; i < details.currentStep; i++) {
          const step = await contract.methods.getSupplyChainStep(tokenId, i).call();
          steps.push({
            location: step.location,
            timestamp: new Date(step.timestamp * 1000).toLocaleString(),
            handler: step.handler,
            role: step.handlerRole,
            notes: step.notes
          });
        }
        
        // Display steps (this is simplified - in a real app, you would render this better)
        alert(`
          Product ID: ${tokenId}
          Name: ${details.productName}
          Manufacturer: ${details.manufacturer}
          Manufacturing Date: ${new Date(details.manufacturingDate * 1000).toLocaleString()}
          Is Authentic: ${details.isAuthentic ? 'Yes' : 'No'}
          
          Supply Chain Journey:
          ${steps.map((step, index) => `
            Step ${index + 1}:
            Location: ${step.location}
            Time: ${step.timestamp}
            Handler: ${step.handler} (${step.role})
            Notes: ${step.notes}
          `).join('\n')}
        `);
      } catch (error) {
        setError(`Error tracking product: ${error.message}`);
      }
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div className="container">
      <h1>Blockchain Supply Chain Tracker</h1>
      
      <div className="create-product-form">
        <h2>Create New Product</h2>
        <form onSubmit={createProduct}>
          <div className="form-group">
            <label>Product Name:</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Manufacturer:</label>
            <input
              type="text"
              name="manufacturer"
              value={newProduct.manufacturer}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Production Location:</label>
            <input
              type="text"
              name="location"
              value={newProduct.location}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit">Create Product</button>
        </form>
      </div>
      
      <div className="products-list">
        <h2>Your Products</h2>
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Manufacturer</th>
                <th>Date</th>
                <th>Location</th>
                <th>Steps</th>
                <th>Authentic</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.manufacturer}</td>
                  <td>{product.date}</td>
                  <td>{product.location}</td>
                  <td>{product.steps}</td>
                  <td>{product.authentic ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => trackProduct(product.id)}>Track</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductTracking; 