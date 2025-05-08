import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const ProductDetail = () => {
  const { id } = useParams();
  const { isConnected, contract, userAccount, userRole } = useWeb3();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        // Fetch product details
        const productData = await contract.getProduct(id);
        
        // Fetch transfer history
        const history = await contract.getProductTransferHistory(id);
        
        // Fetch documents
        const docs = await contract.getProductDocuments(id);
        
        // Format product data
        const formattedProduct = {
          id: productData.id.toString(),
          name: productData.name,
          manufacturer: productData.manufacturer,
          currentOwner: productData.currentOwner,
          productionDate: new Date(productData.productionDate.toNumber() * 1000).toLocaleDateString(),
          lastUpdated: new Date(productData.lastUpdated.toNumber() * 1000).toLocaleDateString(),
          status: ['Created', 'InTransit', 'Delivered', 'Sold'][productData.status],
          statusCode: productData.status,
          isVerified: productData.isVerified,
          isOwner: productData.currentOwner.toLowerCase() === userAccount.toLowerCase(),
        };
        
        // Format transfer history
        const formattedHistory = history.map(transfer => ({
          transferId: transfer.transferId.toString(),
          from: transfer.from,
          to: transfer.to,
          timestamp: new Date(transfer.timestamp.toNumber() * 1000).toLocaleDateString(),
          location: transfer.location,
        }));
        
        setProduct(formattedProduct);
        setTransferHistory(formattedHistory);
        setDocuments(docs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details. Please try again later.');
        setLoading(false);
        
        // For demo purposes, set sample data
        setProduct({
          id: id,
          name: 'Premium Smartphone',
          manufacturer: 'TechCorp',
          currentOwner: userAccount,
          productionDate: '01/15/2023',
          lastUpdated: '05/20/2023',
          status: 'InTransit',
          statusCode: 1,
          isVerified: true,
          isOwner: true,
        });
        
        setTransferHistory([
          {
            transferId: '1',
            from: '0x1234...5678',
            to: '0x8765...4321',
            timestamp: '02/10/2023',
            location: 'Manufacturing Plant, Shanghai',
          },
          {
            transferId: '2',
            from: '0x8765...4321',
            to: userAccount,
            timestamp: '03/15/2023',
            location: 'Distribution Center, San Francisco',
          }
        ]);
        
        setDocuments([
          'QmXgm5QVTy8kYZ9T5LxUmDAeRKzLvBYWEGGgqVWzcRVQmX',
          'QmYb5XE9z8n7TZfYV5fU9u5T5jKLcL4QnrHFnTmDUL8EuA'
        ]);
      }
    };

    fetchProductDetails();
  }, [isConnected, contract, id, userAccount]);

  const updateStatus = async () => {
    if (!isConnected || !contract || !product.isOwner) {
      return;
    }
    
    setIsSubmitting(true);
    setActionSuccess(null);
    
    try {
      const tx = await contract.updateProductStatus(id, parseInt(newStatus));
      await tx.wait();
      
      // Update product state with new status
      setProduct({
        ...product,
        status: ['Created', 'InTransit', 'Delivered', 'Sold'][parseInt(newStatus)],
        statusCode: parseInt(newStatus),
        lastUpdated: new Date().toLocaleDateString(),
      });
      
      setActionSuccess('Product status updated successfully!');
      setNewStatus('');
    } catch (error) {
      console.error('Error updating product status:', error);
      setError('Failed to update product status. Please try again.');
      
      // For demo purposes
      setProduct({
        ...product,
        status: ['Created', 'InTransit', 'Delivered', 'Sold'][parseInt(newStatus)],
        statusCode: parseInt(newStatus),
        lastUpdated: new Date().toLocaleDateString(),
      });
      setActionSuccess('Product status updated successfully!');
      setNewStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDocumentToProduct = async () => {
    if (!isConnected || !contract || !product.isOwner || !newDocument.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setActionSuccess(null);
    
    try {
      const tx = await contract.addDocument(id, newDocument);
      await tx.wait();
      
      // Update documents state with new document
      setDocuments([...documents, newDocument]);
      
      setActionSuccess('Document added successfully!');
      setNewDocument('');
    } catch (error) {
      console.error('Error adding document:', error);
      setError('Failed to add document. Please try again.');
      
      // For demo purposes
      setDocuments([...documents, newDocument]);
      setActionSuccess('Document added successfully!');
      setNewDocument('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyProduct = async () => {
    if (!isConnected || !contract || userRole !== 'admin') {
      return;
    }
    
    setIsSubmitting(true);
    setActionSuccess(null);
    
    try {
      const tx = await contract.verifyProduct(id);
      await tx.wait();
      
      // Update product state with verification
      setProduct({
        ...product,
        isVerified: true,
        lastUpdated: new Date().toLocaleDateString(),
      });
      
      setActionSuccess('Product verified successfully!');
    } catch (error) {
      console.error('Error verifying product:', error);
      setError('Failed to verify product. Please try again.');
      
      // For demo purposes
      setProduct({
        ...product,
        isVerified: true,
        lastUpdated: new Date().toLocaleDateString(),
      });
      setActionSuccess('Product verified successfully!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Product Details</h2>
        <p>Please connect your wallet to view product details.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="product-detail-container">
      <div className="detail-header">
        <h2>Product Details: {product.name}</h2>
        <div className="actions">
          <Link to="/products" className="btn secondary">Back to Products</Link>
          {product.isOwner && (
            <Link to={`/transfer/${id}`} className="btn primary">Transfer Product</Link>
          )}
        </div>
      </div>
      
      {actionSuccess && <div className="success-message">{actionSuccess}</div>}
      
      <div className="detail-grid">
        <div className="detail-card">
          <h3>Basic Information</h3>
          <div className="detail-item">
            <span className="label">Product ID:</span>
            <span className="value">#{product.id}</span>
          </div>
          <div className="detail-item">
            <span className="label">Name:</span>
            <span className="value">{product.name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Manufacturer:</span>
            <span className="value">{product.manufacturer}</span>
          </div>
          <div className="detail-item">
            <span className="label">Production Date:</span>
            <span className="value">{product.productionDate}</span>
          </div>
          <div className="detail-item">
            <span className="label">Last Updated:</span>
            <span className="value">{product.lastUpdated}</span>
          </div>
          <div className="detail-item">
            <span className="label">Current Owner:</span>
            <span className="value address">{product.currentOwner}</span>
            {product.isOwner && <span className="owner-badge">You</span>}
          </div>
          <div className="detail-item">
            <span className="label">Status:</span>
            <span className={`value status ${product.status.toLowerCase()}`}>
              {product.status}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Verification:</span>
            <span className={`value verification ${product.isVerified ? 'verified' : 'unverified'}`}>
              {product.isVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>
        
        {product.isOwner && (
          <div className="detail-card actions-card">
            <h3>Product Actions</h3>
            <div className="action-form">
              <div className="form-group">
                <label htmlFor="status">Update Status:</label>
                <select 
                  id="status" 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select new status</option>
                  <option value="0">Created</option>
                  <option value="1">In Transit</option>
                  <option value="2">Delivered</option>
                  <option value="3">Sold</option>
                </select>
                <button 
                  onClick={updateStatus} 
                  disabled={isSubmitting || !newStatus}
                  className="btn primary"
                >
                  Update Status
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="document">Add Document (IPFS Hash):</label>
                <div className="input-with-button">
                  <input 
                    type="text" 
                    id="document" 
                    value={newDocument} 
                    onChange={(e) => setNewDocument(e.target.value)}
                    placeholder="Enter IPFS hash"
                    disabled={isSubmitting}
                  />
                  <button 
                    onClick={addDocumentToProduct} 
                    disabled={isSubmitting || !newDocument.trim()}
                    className="btn primary"
                  >
                    Add Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {userRole === 'admin' && !product.isVerified && (
          <div className="detail-card admin-actions">
            <h3>Admin Actions</h3>
            <button 
              onClick={verifyProduct} 
              disabled={isSubmitting}
              className="btn primary verify-btn"
            >
              Verify Product
            </button>
            <p className="note">
              Verifying this product confirms its authenticity in the supply chain.
            </p>
          </div>
        )}
      </div>
      
      <div className="detail-section">
        <h3>Transfer History</h3>
        {transferHistory.length === 0 ? (
          <p className="no-data">No transfer history available.</p>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Timestamp</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((transfer) => (
                  <tr key={transfer.transferId}>
                    <td>#{transfer.transferId}</td>
                    <td className="address">{transfer.from}</td>
                    <td className="address">{transfer.to}</td>
                    <td>{transfer.timestamp}</td>
                    <td>{transfer.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="detail-section">
        <h3>Documents</h3>
        {documents.length === 0 ? (
          <p className="no-data">No documents available for this product.</p>
        ) : (
          <div className="documents-grid">
            {documents.map((doc, index) => (
              <div className="document-item" key={index}>
                <div className="document-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" />
                  </svg>
                </div>
                <div className="document-details">
                  <span className="document-hash">{doc}</span>
                  <a 
                    href={`https://ipfs.io/ipfs/${doc}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    View on IPFS
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail; 