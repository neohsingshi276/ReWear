import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { FiEdit2, FiTrash2, FiMessageCircle, FiCheck, FiX, FiDollarSign, FiHeart, FiSend, FiRefreshCw } from 'react-icons/fi';

const Profile = () => {

  const [profile, setProfile] = useState(null);
  const [myExchanges, setMyExchanges] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [balance, setBalance] = useState({ balance: 0, totalDonations: 0 });
  const [activeTab, setActiveTab] = useState('products');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({
  username: "",
  email: "",
  phone: "",
});


  // Edit modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  // Chat modal
  const [chatExchange, setChatExchange] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Balance modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState('donate'); // donate or withdraw
  const [actionAmount, setActionAmount] = useState('');
  const [bankCard, setBankCard] = useState('');
  const [confirmStep, setConfirmStep] = useState(false); // Confirmation step for withdraw

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatExchange) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [chatExchange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      const [pRes, eRes, tRes, prodRes, balRes, billRes] = await Promise.all([
        api.get('/me'),
        api.get('/my-exchanges'),
        api.get('/my-transactions'),
        api.get('/my-products'),
        api.get('/balance'),
        api.get('/my-billing-history')
      ]);

      setProfile(pRes.data);
      setMyExchanges(eRes.data);
      setMyTransactions(tRes.data);
      setMyProducts(prodRes.data);
      setBalance(balRes.data);
      setBillingHistory(billRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    if (!chatExchange) return;
    try {
      const res = await api.get(`/exchange-requests/${chatExchange.id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`/exchange-requests/${chatExchange.id}/messages`, { message: newMessage });
      setNewMessage('');
      loadMessages();
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleUpdatePrice = async () => {
    try {
      await api.put(`/products/${editingProduct.id}`, { price: editPrice });
      alert('Price updated!');
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleDelist = async (productId) => {
    if (!window.confirm('Delist this product?')) return;
    try {
      await api.put(`/products/${productId}/delist`);
      fetchData();
    } catch (err) {
      alert('Failed to delist');
    }
  };

  const handleRelist = async (productId) => {
    try {
      await api.put(`/products/${productId}/relist`);
      fetchData();
    } catch (err) {
      alert('Failed to relist');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/products/${productId}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };


  const handleToggleExchange = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { is_exchangeable: !product.is_exchangeable });
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleShip = async (id) => {
    if (!window.confirm('Confirm shipment?')) return;
    try {
      await api.put(`/transactions/${id}/ship`);
      fetchData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleConfirmReceipt = async (id) => {
    if (!window.confirm('Confirm receipt? Funds will be released to seller.')) return;
    try {
      await api.put(`/transactions/${id}/confirm`);
      fetchData();
      alert('Transaction completed!');
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleExchangeAction = async (id, status) => {
    try {
      await api.put(`/exchange-requests/${id}`, { status });
      fetchData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleConfirmExchange = async (id) => {
    try {
      const res = await api.put(`/exchange-requests/${id}/confirm`);
      if (res.data.completed) {
        alert('Exchange completed! Both items have been marked as exchanged.');
      } else {
        alert('Your confirmation recorded. Waiting for the other party to confirm.');
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };
  
  const handleUpdateProfile = async (field) => {
  try {
    await api.put('/profile', {
      [field]: editProfile[field]
    });
    setProfile(prev => ({
      ...prev,
      [field]: editProfile[field]
    }));

    const user = JSON.parse(localStorage.getItem('user'));
    const updatedUser = {
      ...user,
      [field]: editProfile[field]
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    alert(`${field} updated`);
    window.location.reload();
  } catch (err) {
    alert(err.response?.data?.error || 'Update failed');
  }
};



  const handleBalanceAction = async () => {
    if (!actionAmount || parseFloat(actionAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      if (balanceAction === 'donate') {
        await api.post('/donate', { amount: actionAmount });
        alert('Donation successful! Thank you for your generosity.');
      } else {
        if (!bankCard) {
          alert('Please enter your Account ID');
          return;
        }
        if (!/^\d{12}$/.test(bankCard)) {
          alert('Account ID must be exactly 12 digits');
          return;
        }

        // Show confirmation step first
        if (!confirmStep) {
          setConfirmStep(true);
          return;
        }

        await api.post('/withdraw', { amount: actionAmount, bank_card: bankCard });
        alert('Withdrawal request submitted. Funds will arrive in 1-3 business days.');
      }
      setShowBalanceModal(false);
      setActionAmount('');
      setBankCard('');
      setConfirmStep(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const closeBalanceModal = () => {
    setShowBalanceModal(false);
    setConfirmStep(false);
    setActionAmount('');
    setBankCard('');
  };

  if (!profile) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-wrap items-center gap-8 border border-gray-100">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
          {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover rounded-full" /> : profile.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-gray-500 mt-2">{profile.email}</p>
          <button
  onClick={() => setShowEditProfile(true)}
  className="
    inline-flex items-center
    px-2 py-1 mt-7 -ml-1
    rounded-full
    bg-indigo-500/10
    text-indigo-600
    font-medium
    hover:bg-indigo-500/20
    transition
  "
>
  Update Profile
</button>
         </div>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl min-w-[200px]">
          <p className="text-sm opacity-80">Account Balance</p>
          <p className="text-2xl font-bold"> {Number (balance.balance).toFixed(2)}</p>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => { setBalanceAction('donate'); setShowBalanceModal(true); }}
              className="flex-1 bg-white/20 hover:bg-white/30 py-1.5 rounded text-sm font-medium transition"
            >
              Donate
            </button>
            <button 
              onClick={() => { setBalanceAction('withdraw'); setShowBalanceModal(true); }}
              className="flex-1 bg-white/20 hover:bg-white/30 py-1.5 rounded text-sm font-medium transition"
            >
              Withdraw
            </button>
          </div>
          <p className="text-xs mt-2 opacity-70">Total Donated: RM {Number(balance.totalDonations).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {['products', 'exchanges', 'orders', 'billing'].map(tab => (
          <button 
            key={tab}
            className={`px-6 py-3 font-bold whitespace-nowrap transition ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'products' ? 'My Products' : tab === 'exchanges' ? 'Exchanges' : tab === 'orders' ? 'Orders' : 'Billing History'}
          </button>
        ))}
      </div>

      {/* My Products Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProducts.length === 0 && <p className="text-gray-500 col-span-3">No products listed yet</p>}
          {myProducts.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                <img src={`http://localhost:3000${p.image_url}`} className="w-full h-full object-cover"/>
                <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded text-white ${
                  p.status === 'approved' ? 'bg-green-500' : 
                  p.status === 'pending' ? 'bg-yellow-500' : 
                  p.status === 'sold' ? 'bg-gray-500' : 
                  p.status === 'delisted' ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {p.status === 'approved' ? 'Listed' : p.status === 'pending' ? 'Under Review' : p.status === 'sold' ? 'Sold' : p.status === 'delisted' ? 'Delisted' : 'Rejected'}
                </span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold line-clamp-1">{p.title}</h3>
                  <span className="text-green-600 font-bold">RM {Number(p.price).toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">AI Check: {p.ai_check_result}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={p.is_exchangeable} 
                      onChange={() => handleToggleExchange(p)}
                      className="rounded text-indigo-600"
                    />
                    Available for Exchange
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingProduct(p); setEditPrice(p.price); }}
                      className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                    >
                      <FiEdit2 size={14}/> Edit Price
                    </button>
                    {p.status === 'approved' ? (
                      <button 
                        onClick={() => handleDelist(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                      >
                        <FiX size={14}/> Delist
                      </button>
                    ) : p.status === 'delisted' ? (
                      <button 
                        onClick={() => handleRelist(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                      >
                        <FiCheck size={14}/> Relist
                      </button>
                    ) : null}
                  </div>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-full flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    <FiTrash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exchanges Tab */}
      {activeTab === 'exchanges' && (
        <div className="space-y-4">
          {myExchanges.length === 0 && <p className="text-gray-500">No exchange requests</p>}
          {myExchanges.map(req => {
            const isRequester = req.requester_id === profile.id;
            const otherParty = isRequester ? req.receiver_name : req.requester_name;
            const myConfirmed = isRequester ? req.requester_confirmed : req.receiver_confirmed;
            const otherConfirmed = isRequester ? req.receiver_confirmed : req.requester_confirmed;

            return (
              <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <img src={`http://localhost:3000${req.requester_product_image}`} className="w-16 h-16 object-cover rounded-lg"/>
                      <p className="text-xs text-gray-500 mt-1 text-center max-w-[80px] truncate">{req.requester_product_title}</p>
                      <p className="text-xs font-bold">RM {Number(req.requester_product_price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center">
                      <FiRefreshCw className="text-indigo-500" size={24}/>
                    </div>
                    <div className="flex flex-col items-center">
                      <img src={`http://localhost:3000${req.receiver_product_image}`} className="w-16 h-16 object-cover rounded-lg"/>
                      <p className="text-xs text-gray-500 mt-1 text-center max-w-[80px] truncate">{req.receiver_product_title}</p>
                      <p className="text-xs font-bold">RM {Number(req.receiver_product_price).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      req.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">with {otherParty}</p>
                  </div>
                </div>

                {/* Confirmation Status for accepted exchanges */}
                {req.status === 'accepted' && (
                  <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex gap-4">
                        <span className={myConfirmed ? 'text-green-600' : 'text-gray-500'}>
                          {myConfirmed ? '✓ You confirmed' : 'You: Pending'}
                        </span>
                        <span className={otherConfirmed ? 'text-green-600' : 'text-gray-500'}>
                          {otherConfirmed ? `✓ ${otherParty} confirmed` : `${otherParty}: Pending`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {/* Chat Button */}
                  {req.status === 'accepted' && (
                    <button 
                      onClick={() => setChatExchange(req)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      <FiMessageCircle /> Chat
                    </button>
                  )}

                  {/* Accept/Reject for receiver */}
                  {req.status === 'pending' && !isRequester && (
                    <>
                      <button 
                        onClick={() => handleExchangeAction(req.id, 'accepted')}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <FiCheck /> Accept
                      </button>
                      <button 
                        onClick={() => handleExchangeAction(req.id, 'rejected')}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}

                  {/* Confirm Completion */}
                  {req.status === 'accepted' && !myConfirmed && (
                    <button 
                      onClick={() => handleConfirmExchange(req.id)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <FiCheck /> Confirm Complete
                    </button>
                  )}

                  {req.status === 'pending' && isRequester && (
                    <span className="text-sm text-gray-500 py-2">Waiting for {otherParty} to respond...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {myTransactions.length === 0 && <p className="text-gray-500">No transactions yet</p>}
          {myTransactions.map(tx => {
            const isBuyer = tx.buyer_id === profile.id;
            return (
              <div key={tx.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-4">
                  <img src={`http://localhost:3000${tx.image_url}`} className="w-20 h-20 object-cover rounded-lg bg-gray-100"/>
                  <div>
                    <h3 className="font-bold">{tx.product_title}</h3>
                    <p className="text-sm text-gray-500">
                      {isBuyer ? `Seller: ${tx.seller_name}` : `Buyer: ${tx.buyer_name}`}
                    </p>
                    <p className="font-bold text-indigo-600 mt-1">
                      RM {Number (tx.amount).toFixed(2)} 
                      
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    tx.status === 'held' ? 'text-yellow-600' : 
                    tx.status === 'shipped' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {tx.status === 'held' ? 'Funds Held' : tx.status === 'shipped' ? 'Shipped' : 'Completed'}
                  </p>
                  <div className="mt-2">
                    {!isBuyer && tx.status === 'held' && (
                      <button onClick={() => handleShip(tx.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                        Confirm Shipped
                      </button>
                    )}
                    {isBuyer && tx.status === 'shipped' && (
                      <button onClick={() => handleConfirmReceipt(tx.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                        Confirm Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {billingHistory.length === 0 && <p className="text-gray-500">No billing records found</p>}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billingHistory.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{item.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        item.type === 'purchase' ? 'bg-orange-100 text-orange-700' :
                        item.type === 'sale' ? 'bg-green-100 text-green-700' :
                        item.type === 'withdrawal' ? 'bg-blue-100 text-blue-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>{item.type}</span>
                    </td>
                    <td
  className={`px-6 py-4 font-bold ${
    Number(item.amount)>= 0 ? 'text-green-600' : 'text-red-600'
  }`}
>
  {Number(item.amount) >= 0 ? '+' : '-'}
  RM {Math.abs(Number(item.amount)).toFixed(2)}
</td>

                    <td className="px-6 py-4 text-gray-500 capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Edit Price</h3>
            <p className="text-sm text-gray-500 mb-2">{editingProduct.title}</p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-2.5 text-gray-500">RM</span>
              <input 
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdatePrice} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg h-[500px] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">Chat with {chatExchange.requester_id === profile.id ? chatExchange.receiver_name : chatExchange.requester_name}</h3>
                <p className="text-xs text-gray-500">{chatExchange.requester_product_title} ↔ {chatExchange.receiver_product_title}</p>
              </div>
              <button onClick={() => setChatExchange(null)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24}/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 py-8">No messages yet. Start the conversation!</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    msg.sender_id === profile.id 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white border rounded-bl-none'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === profile.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700">
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Balance Action Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            {confirmStep && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            )}

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              {balanceAction === 'donate' ? <><FiHeart className="text-pink-500"/> Donate</> : <><FiDollarSign className="text-green-500"/> Withdraw Funds</>}
            </h3>
            
            {!confirmStep ? (
              // Step 1: Input
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Available Balance: <span className="font-bold text-green-600">RM {Number (balance.balance).toFixed(2)}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">RM</span>
                      <input 
                        type="number"
                        value={actionAmount}
                        onChange={e => setActionAmount(e.target.value)}
                        max={balance.balance}
                        className="w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {balanceAction === 'withdraw' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Account ID (12 digits)</label>
                      <input 
                        type="text"
                        value={bankCard}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setBankCard(val);
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest"
                        placeholder="0000 0000 0000"
                      />
                      <p className="text-xs text-gray-400 mt-1 text-right">{bankCard.length}/12 digits</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Step 2: Bill Confirmation
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                <h4 className="font-bold text-center text-gray-800 border-b border-dashed pb-2 mb-3">WITHDRAWAL BILL</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withdraw Amount</span>
                    <span className="font-bold">RM {Number (actionAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service Fee</span>
                    <span className="text-green-600 font-medium">RM 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account ID</span>
                    <span className="font-mono text-gray-700">{bankCard}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="font-bold text-gray-800">Total Deducted</span>
                    <span className="font-bold text-xl text-green-600">RM {Number (actionAmount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mt-3 text-center">
                  Funds will be transferred to your account within 1-3 business days.
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={closeBalanceModal} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button 
                onClick={handleBalanceAction} 
                className={`flex-1 py-2 text-white rounded-lg transition font-bold shadow-md ${balanceAction === 'donate' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {balanceAction === 'donate' ? 'Donate' : confirmStep ? 'Confirm Withdraw' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
            {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Update Profile</h3>

            <div className="space-y-4">

  {/* Username */}
  <div className="flex gap-2 items-center">
    <input
      type="text"
      placeholder="Username"
      value={editProfile.username}
      onChange={e =>
        setEditProfile({ ...editProfile, username: e.target.value })
      }
      className="flex-1 px-4 py-2 border rounded-lg"
    />
    <button
      onClick={() => handleUpdateProfile('username')}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg
                 hover:bg-indigo-700 transition"
    >
      Save
    </button>
  </div>

  {/* Email */}
  <div className="flex gap-2 items-center">
    <input
      type="email"
      placeholder="Email"
      value={editProfile.email}
      onChange={e =>
        setEditProfile({ ...editProfile, email: e.target.value })
      }
      className="flex-1 px-4 py-2 border rounded-lg"
    />
    <button
      onClick={() => handleUpdateProfile('email')}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg
                 hover:bg-indigo-700 transition"
    >
      Save
    </button>
  </div>

  {/* Phone */}
  <div className="flex gap-2 items-center">
    <input
      type="text"
      placeholder="Phone"
      value={editProfile.phone}
      onChange={e =>
        setEditProfile({ ...editProfile, phone: e.target.value })
      }
      className="flex-1 px-4 py-2 border rounded-lg"
    />
    <button
      onClick={() => handleUpdateProfile('phone')}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg
                 hover:bg-indigo-700 transition"
    >
      Save
    </button>
  </div>

</div>


            <div className="flex justify-end mt-8">
  <button
    onClick={() => setShowEditProfile(false)}
    className="px-6 py-2 bg-gray-100 rounded-lg
               hover:bg-gray-200 transition"
  >
    Cancel
  </button>
</div>

          </div>
        </div>
      )}

    </div>
  );
};


export default Profile;