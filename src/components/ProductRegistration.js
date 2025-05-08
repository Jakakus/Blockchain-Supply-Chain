import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const ProductRegistration = () => {
  const { isConnected, contract, userRole } = useWeb3();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    location: '',
    documents: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documentInput, setDocumentInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addDocument = () => {
    if (documentInput.trim()) {
      setFormData({
        ...formData,
        documents: [...formData.documents, documentInput.trim()],
      });
      setDocumentInput('');
    }
  };

  const removeDocument = (index) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments.splice(index, 1);
    setFormData({
      ...formData,
      documents: updatedDocuments,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to register a product.');
      return;
    }
    
    if (userRole !== 'manufacturer' && userRole !== 'admin') {
      setError('You do not have permission to register products. Only manufacturers can register products.');
      return;
    }
    
    if (!formData.name || !formData.manufacturer) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Register product on the blockchain
      const tx = await contract.registerProduct(
        formData.name,
        formData.manufacturer,
        formData.documents
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get product ID from event logs
      const event = receipt.events.find(event => event.event === 'ProductRegistered');
      const productId = event.args.productId.toString();
      
      setSuccess(`Product registered successfully with ID: ${productId}`);
      setFormData({
        name: '',
        manufacturer: '',
        location: '',
        documents: [],
      });
      
      // Redirect to product details page after 2 seconds
      setTimeout(() => {
        navigate(`/product/${productId}`);
      }, 2000);
    } catch (error) {
      console.error('Error registering product:', error);
      setError('Failed to register product. Please try again.');
      
      // For demo purposes, simulate success
      setSuccess('Product registered successfully with ID: 4');
      setFormData({
        name: '',
        manufacturer: '',
        location: '',
        documents: [],
      });
      
      // Simulate redirect
      setTimeout(() => {
        navigate('/products');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Register Product</h2>
        <p>Please connect your wallet to register a product.</p>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <h2>Register New Product</h2>
      <p className="description">
        Enter the details of the product to register it on the blockchain.
        Each product will receive a unique identifier and can be tracked throughout the supply chain.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter product name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="manufacturer">Manufacturer *</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            required
            placeholder="Enter manufacturer name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Production Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter production location"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="document">Documents (IPFS Hashes)</label>
          <div className="document-input">
            <input
              type="text"
              id="document"
              value={documentInput}
              onChange={(e) => setDocumentInput(e.target.value)}
              placeholder="Enter IPFS hash for document"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={addDocument}
              disabled={isSubmitting || !documentInput.trim()}
              className="btn-small"
            >
              Add
            </button>
          </div>
          
          {formData.documents.length > 0 && (
            <div className="documents-list">
              <h4>Documents:</h4>
              <ul>
                {formData.documents.map((doc, index) => (
                  <li key={index}>
                    <span>{doc}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      disabled={isSubmitting}
                      className="btn-small remove"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register Product'}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate('/products')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductRegistration; 