import React, { useEffect, useState } from 'react';
import api from '../api';
import { FiRefreshCw, FiX, FiMessageCircle, FiCheck, FiArrowRight } from 'react-icons/fi';

const Exchange = () => {
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const [allRes, myRes] = await Promise.all([
          api.get('/exchange-products'),
          api.get('/my-exchange-products')
        ]);
        setProducts(allRes.data);
        setMyProducts(myRes.data);
      } else {
        const res = await api.get('/products');
        setProducts(res.data.filter(p => p.is_exchangeable));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExchange = async (myProductId) => {
    if (!selectedProduct) return;
    try {
      await api.post('/exchange-requests', {
        receiver_id: selectedProduct.seller_id,
        requester_product_id: myProductId,
        receiver_product_id: selectedProduct.id
      });
      alert('Exchange request sent! Check your profile to chat and complete the exchange.');
      setSelectedProduct(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Request failed');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FiRefreshCw className="text-indigo-600" /> Exchange Center
          </h1>
          <p className="text-gray-500 mt-1">Exchange your listed items with others</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl mb-8 border border-indigo-100">
        <h3 className="font-bold text-indigo-800 mb-2">How Exchange Works</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-indigo-700">
          <div className="flex items-start gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
            <span>Browse items others want to exchange</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
            <span>Click "I Want This" and select your item to offer</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
            <span>Chat with the owner to discuss details</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
            <span>Both confirm to complete the exchange</span>
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Select Your Item to Exchange</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-white/80 hover:text-white">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Target Item */}
              <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
                <img src={`http://localhost:3000${selectedProduct.image_url}`} alt="" className="w-24 h-24 object-cover rounded-lg" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">You want:</p>
                  <h4 className="font-bold text-lg text-gray-800">{selectedProduct.title}</h4>
                  <p className="text-sm text-gray-500">{selectedProduct.brand} | {selectedProduct.size} | ${selectedProduct.price}</p>
                  <p className="text-sm text-indigo-600 mt-1">Owner: {selectedProduct.seller_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2">
                  <FiRefreshCw /> Exchange for
                </div>
              </div>

              {/* My Items Selection */}
              {myProducts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 mb-4">You don't have any listed items available for exchange.</p>
                  <p className="text-sm text-gray-400">List a product first and make sure "Available for Exchange" is enabled.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {myProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => handleRequestExchange(product.id)}
                      className="bg-white border-2 border-gray-200 p-3 rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-lg transition group"
                    >
                      <div className="h-24 w-full bg-gray-100 rounded-lg mb-2 overflow-hidden">
                        <img src={`http://localhost:3000${product.image_url}`} className="h-full w-full object-cover group-hover:scale-105 transition"/>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">${product.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FiRefreshCw size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-xl">No items available for exchange</p>
          <p className="mt-2">Check back later or list your own items</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
              <div className="aspect-square overflow-hidden relative bg-gray-100">
                <img src={`http://localhost:3000${product.image_url}`} className="h-full w-full object-cover group-hover:scale-110 transition duration-700"/>
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Exchangeable
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  ${product.price}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                <div className="flex gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{product.category}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{product.size}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span> 
                  {product.seller_name}
                </p>
                <button 
                  onClick={() => {
                    if (!localStorage.getItem('token')) {
                      alert('Please login first');
                      return;
                    }
                    setSelectedProduct(product);
                  }}
                  className="w-full mt-auto bg-indigo-50 text-indigo-600 font-bold py-2.5 rounded-lg hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2"
                >
                  <FiRefreshCw /> I Want This
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exchange;
