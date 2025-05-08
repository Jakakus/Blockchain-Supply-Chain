import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const ProductList = () => {
  const { isConnected, contract, userAccount } = useWeb3();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        // Get products owned by the current user
        const productIds = await contract.getProductsByOwner(userAccount);
        
        const productDetails = await Promise.all(
          productIds.map(async (id) => {
            const product = await contract.getProduct(id);
            return {
              id: product.id.toString(),
              name: product.name,
              manufacturer: product.manufacturer,
              currentOwner: product.currentOwner,
              productionDate: new Date(product.productionDate.toNumber() * 1000).toLocaleDateString(),
              lastUpdated: new Date(product.lastUpdated.toNumber() * 1000).toLocaleDateString(),
              status: ['Created', 'InTransit', 'Delivered', 'Sold'][product.status],
              isVerified: product.isVerified,
              location: getLocationForStatus(product.status),
            };
          })
        );

        setProducts(productDetails);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
        
        // For demo purposes, set some sample data
        setProducts([
          {
            id: '1',
            name: 'Premium Smartphone',
            manufacturer: 'TechCorp',
            currentOwner: '0x1234...5678',
            productionDate: '01/15/2023',
            lastUpdated: '05/20/2023',
            status: 'InTransit',
            isVerified: true,
            location: 'Distribution Center, San Francisco',
          },
          {
            id: '2',
            name: 'Designer Handbag',
            manufacturer: 'LuxuryBrands',
            currentOwner: '0x8765...4321',
            productionDate: '02/10/2023',
            lastUpdated: '05/18/2023',
            status: 'Created',
            isVerified: false,
            location: 'Manufacturing Plant, Milan',
          },
          {
            id: '3',
            name: 'Pharmaceutical Supplies',
            manufacturer: 'MediCorp',
            currentOwner: '0x4567...8901',
            productionDate: '03/05/2023',
            lastUpdated: '05/21/2023',
            status: 'Delivered',
            isVerified: true,
            location: 'Regional Hospital, Chicago',
          },
        ]);
      }
    };

    fetchProducts();
  }, [isConnected, contract, userAccount]);

  // Helper function to get location based on status (for demo)
  const getLocationForStatus = (status) => {
    const locations = [
      'Manufacturing Plant, Shanghai',
      'Distribution Center, San Francisco',
      'Retail Store, New York',
      'Customer Location',
    ];
    return locations[status] || 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Products</h2>
        <p>Please connect your wallet to view products.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>Tracked Products</h2>
        <Link to="/register" className="btn primary">Register New Product</Link>
      </div>
      
      {products.length === 0 ? (
        <div className="no-products">
          <p>No products found. Register a new product to get started.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Manufacturer</th>
                <th>Current Location</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.manufacturer}</td>
                  <td>{product.location}</td>
                  <td>
                    <span className={`status ${product.status.toLowerCase()}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <span className={`verification ${product.isVerified ? 'verified' : 'unverified'}`}>
                      {product.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/product/${product.id}`} className="btn-small view">View</Link>
                    <Link to={`/transfer/${product.id}`} className="btn-small transfer">Transfer</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductList; 