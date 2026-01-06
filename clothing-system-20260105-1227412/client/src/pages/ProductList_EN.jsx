import React, { useEffect, useState } from 'react';
import api from '../api';
import { FiSearch, FiFilter, FiCheckCircle } from 'react-icons/fi';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    const res = await api.get(`/products?category=${category}&search=${search}`);
    let sorted = res.data;
    
    if (sortBy === 'price_asc') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortBy === 'price_desc') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setProducts([...sorted]);
  };

  useEffect(() => {
      let sorted = [...products];
      if (sortBy === 'price_asc') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      else if (sortBy === 'price_desc') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setProducts(sorted);
  }, [sortBy]);

  const handleBuy = async (product) => {
    const confirm = window.confirm(`Confirm purchase of ${product.title}? Price: $${product.price}`);
    if (!confirm) return;

    try {
        const paymentMethod = prompt("Enter payment method (FPX/PayPal/Stripe):", "FPX");
        if (!paymentMethod) return;

        const res = await api.post('/transactions', {
            product_id: product.id,
            amount: product.price,
            payment_method: paymentMethod
        });

        setReceipt({
            transactionId: res.data.transactionId,
            product: product,
            amount: product.price,
            donation: (parseFloat(product.price) * 0.05).toFixed(2),
            method: paymentMethod,
            date: new Date().toLocaleString()
        });

        fetchProducts(); 
    } catch (err) {
        alert(err.response?.data?.error || 'Purchase failed');
    }
  };

  return (
    <div className="container mx-auto p-8 relative">
      {/* Receipt Modal */}
      {receipt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
                  <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                          <FiCheckCircle size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                      <p className="text-gray-500">Thank you for your purchase & donation</p>
                  </div>
                  
                  <div className="space-y-4 border-t border-b border-dashed border-gray-300 py-4 mb-6">
                      <div className="flex justify-between">
                          <span className="text-gray-600">Item</span>
                          <span className="font-bold">{receipt.product.title}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID</span>
                          <span className="font-mono text-sm">{receipt.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method</span>
                          <span>{receipt.method}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                          <span>Total Amount</span>
                          <span className="text-indigo-600">${receipt.amount}</span>
                      </div>
                  </div>

                  <div className="bg-pink-50 p-4 rounded-lg mb-6 flex items-center justify-between text-pink-800">
                      <span className="font-bold">❤️ Includes charity donation</span>
                      <span className="font-bold text-lg">${receipt.donation}</span>
                  </div>

                  <button onClick={() => setReceipt(null)} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                      Save Receipt & Close
                  </button>
              </div>
          </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FiFilter /> Product List</h1>
        
        <div className="flex flex-wrap gap-4 items-center flex-1 justify-end">
          <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search brand, name..." 
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button onClick={fetchProducts} className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Search</button>
          </div>
          
          <select value={category} onChange={e => setCategory(e.target.value)} className="border p-2 rounded-lg outline-none">
            <option value="All">All Categories</option>
            <option value="Tops">Tops</option>
            <option value="Bottoms">Bottoms</option>
            <option value="Dresses">Dresses</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Shoes">Shoes</option>
            <option value="Accessories">Accessories</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border p-2 rounded-lg outline-none">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
            <div className="aspect-square overflow-hidden bg-gray-100 relative">
                {p.image_url ? (
                    <img src={`http://localhost:3000${p.image_url}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                {p.brand && (
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md font-medium tracking-wide">
                        {p.brand}
                    </span>
                )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{p.title}</h3>
                  <span className="text-green-600 font-bold text-lg">${p.price}</span>
              </div>
              
              <div className="flex gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.category}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.size}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{p.condition_status}</span>
              </div>

              <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{p.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Seller: {p.seller_name}</span>
                  <button onClick={() => handleBuy(p)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-indigo-200 shadow-md">
                      Buy Now
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;

