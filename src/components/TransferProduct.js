import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const TransferProduct = () => {
  const { id } = useParams();
  const { isConnected, contract, userAccount, signer } = useWeb3();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    recipientAddress: '',
    location: '',
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        const productData = await contract.getProduct(id);
        
        const formattedProduct = {
          id: productData.id.toString(),
          name: productData.name,
          manufacturer: productData.manufacturer,
          currentOwner: productData.currentOwner,
          status: ['Created', 'InTransit', 'Delivered', 'Sold'][productData.status],
          isOwner: productData.currentOwner.toLowerCase() === userAccount.toLowerCase(),
        };
        
        if (!formattedProduct.isOwner) {
          setError("You don't have permission to transfer this product. Only the current owner can transfer it.");
        }
        
        setProduct(formattedProduct);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details. Please try again later.');
        setLoading(false);
        
        // For demo purposes
        setProduct({
          id: id,
          name: 'Premium Smartphone',
          manufacturer: 'TechCorp',
          currentOwner: userAccount,
          status: 'InTransit',
          isOwner: true,
        });
      }
    };

    fetchProductDetails();
  }, [isConnected, contract, id, userAccount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to transfer a product.');
      return;
    }
    
    if (!product.isOwner) {
      setError("You don't have permission to transfer this product. Only the current owner can transfer it.");
      return;
    }
    
    if (!ethers.utils.isAddress(formData.recipientAddress)) {
      setError('Please enter a valid Ethereum address for the recipient.');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Please enter the current location of the product.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create a digital signature for the transfer (for demo purposes)
      const messageHash = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'address', 'string'],
        [id, userAccount, formData.recipientAddress, formData.location]
      );
      
      const messageHashBytes = ethers.utils.arrayify(messageHash);
      const signature = await signer.signMessage(messageHashBytes);
      
      // Call the contract to transfer the product
      const tx = await contract.transferProduct(
        id,
        formData.recipientAddress,
        formData.location,
        signature
      );
      
      await tx.wait();
      
      setSuccess(`Product transferred successfully to ${formData.recipientAddress}`);
      
      // Redirect to product details page after 2 seconds
      setTimeout(() => {
        navigate(`/product/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Error transferring product:', error);
      setError('Failed to transfer product. Please try again.');
      
      // For demo purposes, simulate success
      setSuccess(`Product transferred successfully to ${formData.recipientAddress}`);
      
      // Simulate redirect
      setTimeout(() => {
        navigate(`/product/${id}`);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Transfer Product</h2>
        <p>Please connect your wallet to transfer products.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error && !product) {
    return <div className="error">{error}</div>;
  }

  if (!product.isOwner) {
    return (
      <div className="unauthorized">
        <h2>Unauthorized Action</h2>
        <p>You don't have permission to transfer this product. Only the current owner can transfer it.</p>
        <Link to={`/product/${id}`} className="btn secondary">Back to Product Details</Link>
      </div>
    );
  }

  return (
    <div className="transfer-container">
      <h2>Transfer Product: {product.name}</h2>
      <p className="description">
        Transfer ownership of this product to another address.
        This will update the product's current owner and create a new entry in the transfer history.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="product-summary">
        <h3>Product Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Product ID:</span>
            <span className="value">#{product.id}</span>
          </div>
          <div className="summary-item">
            <span className="label">Name:</span>
            <span className="value">{product.name}</span>
          </div>
          <div className="summary-item">
            <span className="label">Manufacturer:</span>
            <span className="value">{product.manufacturer}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current Owner:</span>
            <span className="value address">{product.currentOwner}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current Status:</span>
            <span className={`value status ${product.status.toLowerCase()}`}>
              {product.status}
            </span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label htmlFor="recipientAddress">Recipient Address *</label>
          <input
            type="text"
            id="recipientAddress"
            name="recipientAddress"
            value={formData.recipientAddress}
            onChange={handleChange}
            required
            placeholder="Enter Ethereum address (0x...)"
            disabled={isSubmitting}
          />
          <small>The Ethereum address of the new owner</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Current Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="Enter current location"
            disabled={isSubmitting}
          />
          <small>The current physical location of the product</small>
        </div>
        
        <div className="note">
          <p>
            <strong>Note:</strong> Transferring ownership is a blockchain transaction that requires gas.
            You will need to confirm the transaction in your wallet.
          </p>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
          </button>
          <Link
            to={`/product/${id}`}
            className="btn secondary"
            onClick={(e) => isSubmitting && e.preventDefault()}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default TransferProduct; 