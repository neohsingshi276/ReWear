import React, { useEffect, useState } from 'react';
import api from '../api';
import { FiSearch, FiFilter, FiCheckCircle, FiCreditCard, FiLock, FiX, FiPhone, FiArrowRight, FiHeart, FiAlertCircle, FiShield } from 'react-icons/fi';
import { FaPaypal, FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [receipt, setReceipt] = useState(null);
  
  // Payment State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCvv] = useState('');
  const [phone, setPhone] = useState('');
  const [donationPercent, setDonationPercent] = useState(5);
  const [sessionToken, setSessionToken] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchProducts(); }, [category]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const res = await api.get(`/products?${params.toString()}`);
      let sorted = res.data;
      if (sortBy === 'price_asc') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      else if (sortBy === 'price_desc') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setProducts([...sorted]);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let sorted = [...products];
    if (sortBy === 'price_asc') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortBy === 'price_desc') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setProducts(sorted);
  }, [sortBy]);

  const handleBuy = (product) => {
    if (!localStorage.getItem('token')) { alert('Please login first'); return; }
    
    // Check if user is buying their own product
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (product.seller_id === user.id) {
      alert("You cannot buy your own product!");
      return;
    }

    setSelectedProduct(product);
    setPaymentStep(1);
    setPaymentMethod('');
    setCardNumber(''); setCardExpiry(''); setCvv(''); setPhone('');
    setSessionToken(null); setPaymentError('');
  };

  const initPayment = async () => {
    if (!paymentMethod) { alert('Please select a payment method'); return; }
    setProcessing(true); setPaymentError('');
    try {
      const res = await api.post('/payment/init', { product_id: selectedProduct.id, payment_method: paymentMethod });
      if (res.data.success) { setSessionToken(res.data.sessionToken); setPaymentStep(2); }
      else setPaymentError(res.data.error);
    } catch (err) { setPaymentError(err.response?.data?.error || 'Failed to initialize'); }
    finally { setProcessing(false); }
  };

  const processPayment = async () => {
    if (paymentMethod === 'Credit Card' && (!cardNumber || cardNumber.replace(/\s/g, '').length < 13)) {
      setPaymentError('Please enter a valid card number'); return;
    }
    setProcessing(true); setPaymentError(''); setPaymentStep(3);
    try {
      const res = await api.post(`/payment/process/${sessionToken}`, {
        card_number: cardNumber, card_expiry: cardExpiry, card_cvv: cardCvv, phone, donation_percent: donationPercent
      });
      if (res.data.success) await confirmPayment();
      else { setPaymentStep(2); setPaymentError(res.data.error); }
    } catch (err) { setPaymentStep(2); setPaymentError(err.response?.data?.error || 'Payment failed'); }
    finally { setProcessing(false); }
  };

  const confirmPayment = async () => {
    try {
      const res = await api.post(`/payment/confirm/${sessionToken}`);
      if (res.data.success) {
        setPaymentStep(4);
        setTimeout(() => {
          setSelectedProduct(null);
          setReceipt({
            transactionId: res.data.transactionId, product: selectedProduct,
            amount: res.data.amount, donation: res.data.donationAmount, method: paymentMethod,
            cardLastFour: cardNumber.replace(/\s/g, '').slice(-4), date: new Date().toLocaleString()
          });
          fetchProducts();
        }, 2000);
      } else { setPaymentStep(2); setPaymentError(res.data.error); }
    } catch (err) { setPaymentStep(2); setPaymentError(err.response?.data?.error || 'Transaction failed'); }
  };

  const formatCardNumber = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  const closePaymentModal = () => { setSelectedProduct(null); setPaymentStep(1); setSessionToken(null); setPaymentError(''); };

  const getCardType = () => {
    const n = cardNumber.replace(/\s/g, '');
    if (n.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return null;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      {/* Ultra Modern Payment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`bg-white rounded-[2rem] shadow-2xl w-full transition-all duration-500 overflow-hidden relative flex flex-col max-h-[90vh] ${paymentStep === 2 ? 'max-w-5xl' : 'max-w-md'}`}>
            
            {/* Minimalist Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 py-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
                  <FiLock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg tracking-tight">Checkout</h3>
                  <div className="flex items-center gap-2">
                     <div className="flex gap-0.5">
                        {[1,2,3].map(i => (
                           <div key={i} className={`h-1 rounded-full transition-all duration-300 ${paymentStep >= i ? 'w-4 bg-black' : 'w-2 bg-gray-200'}`}></div>
                        ))}
                     </div>
                     <span className="text-xs text-gray-400 font-medium ml-1">Step {paymentStep} of 3</span>
                  </div>
                </div>
              </div>
              <button onClick={closePaymentModal} className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors duration-300">
                <FiX size={22} />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-8">
              {paymentError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-shake">
                  <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0">
                     <FiAlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-red-900 font-bold text-sm">Payment Failed</h4>
                    <p className="text-red-600 text-sm mt-0.5">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Payment Method */}
              {paymentStep === 1 && (
                <div className="space-y-8 animate-fade-in-up">
                  {/* Product Hero */}
                  <div className="relative h-48 rounded-3xl overflow-hidden group">
                     <img src={`http://localhost:3000${selectedProduct.image_url}`} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                        <div className="transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                           <p className="text-white/80 text-sm font-medium mb-1">{selectedProduct.brand}</p>
                           <h4 className="font-bold text-2xl leading-tight mb-2">{selectedProduct.title}</h4>
                           <div className="flex items-center gap-3">
                              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-semibold">RM {Number(selectedProduct.price).toFixed(2)}</span>
                              <span className="text-white/60 text-sm border-l border-white/20 pl-3">{selectedProduct.size}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div>
                    <h4 className="text-gray-900 font-bold text-xl mb-4">Select Payment Method</h4>
                    <div className="grid gap-4">
                      {[
                        { id: 'Credit Card', icons: [<FaCcVisa key="v" />, <FaCcMastercard key="m" />, <FaCcAmex key="a" />], desc: 'Instant processing', bg: 'hover:bg-gray-50' },
                        { id: 'PayPal', icons: [<FaPaypal key="p" className="text-[#003087]" />], desc: 'Protection included', bg: 'hover:bg-[#003087]/5' },
                        { id: 'FPX', icons: [<FiCreditCard key="f" className="text-emerald-600" />], desc: 'Online Banking', bg: 'hover:bg-emerald-50' },
                      ].map(m => (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                          className={`group w-full flex items-center p-5 rounded-2xl border transition-all duration-300 ${
                            paymentMethod === m.id 
                            ? 'border-black bg-black text-white shadow-xl scale-[1.02]' 
                            : `border-gray-200 bg-white text-gray-600 ${m.bg} hover:border-gray-300`
                          }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors duration-300 ${
                             paymentMethod === m.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                          }`}>
                             {m.icons[0]}
                          </div>
                          <div className="flex-1 px-4 text-left">
                            <span className={`font-bold text-lg block ${paymentMethod === m.id ? 'text-white' : 'text-gray-900'}`}>{m.id}</span>
                            <span className={`text-xs ${paymentMethod === m.id ? 'text-white/60' : 'text-gray-400'}`}>{m.desc}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentMethod === m.id ? 'border-white' : 'border-gray-300 group-hover:border-gray-400'
                          }`}>
                            {paymentMethod === m.id && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={initPayment} disabled={!paymentMethod || processing}
                    className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                      paymentMethod && !processing 
                      ? 'bg-black text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Continue <FiArrowRight /></>}
                  </button>
                </div>
              )}

              {/* Step 2: Payment Details */}
              {paymentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 animate-fade-in-up">
                  {/* Left: Form Area */}
                  <div className="md:col-span-7 space-y-8">
                    <div>
                       <h4 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h4>
                       <p className="text-gray-500">Complete your purchase securely.</p>
                    </div>

                    {paymentMethod === 'Credit Card' && (
                      <div className="space-y-8">
                        {/* Minimalist Card Preview */}
                        <div className="relative h-56 rounded-3xl p-8 bg-gray-900 text-white shadow-2xl overflow-hidden transition-transform hover:scale-[1.01] duration-500">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                           <div className="relative h-full flex flex-col justify-between z-10">
                              <div className="flex justify-between items-start">
                                 <div className="w-12 h-8 border border-white/20 rounded bg-white/10 backdrop-blur-sm"></div>
                                 <div className="text-3xl opacity-80">{getCardType() === 'visa' ? <FaCcVisa /> : getCardType() === 'mastercard' ? <FaCcMastercard /> : getCardType() === 'amex' ? <FaCcAmex /> : <FiCreditCard />}</div>
                              </div>
                              <div className="space-y-6">
                                 <div className="font-mono text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                 </div>
                                 <div className="flex gap-12">
                                    <div>
                                       <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Expiry</div>
                                       <div className="font-mono text-lg">{cardExpiry || 'MM/YY'}</div>
                                    </div>
                                    <div>
                                       <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">CVC</div>
                                       <div className="font-mono text-lg">{cardCvv ? '•••' : '•••'}</div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="grid gap-6">
                           <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700 ml-1">Card Number</label>
                              <div className="relative group">
                                 <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                 placeholder="0000 0000 0000 0000" maxLength="19"
                                 className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-mono text-lg text-gray-900 placeholder:text-gray-300" />
                                 <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-sm font-semibold text-gray-700 ml-1">Expiry Date</label>
                                 <input type="text" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                 placeholder="MM/YY" maxLength="5"
                                 className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-mono text-lg text-center text-gray-900 placeholder:text-gray-300" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-sm font-semibold text-gray-700 ml-1">CVC</label>
                                 <div className="relative group">
                                    <input type="password" value={cardCvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="123" maxLength="4"
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-mono text-lg text-center text-gray-900 placeholder:text-gray-300" />
                                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {(paymentMethod === 'FPX' || paymentMethod === 'PayPal') && (
                       <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                             {paymentMethod === 'PayPal' ? <FaPaypal size={40} className="text-[#003087]" /> : <FiCreditCard size={40} className="text-emerald-600" />}
                          </div>
                          <h5 className="font-bold text-gray-900 text-xl mb-2">Continue with {paymentMethod}</h5>
                          <p className="text-gray-500 max-w-xs leading-relaxed">You will be securely redirected to {paymentMethod} to complete your payment.</p>
                          
                          <div className="w-full mt-8 text-left max-w-sm">
                             <label className="text-sm font-semibold text-gray-700 ml-1 mb-2 block">Mobile Number (Optional)</label>
                             <div className="relative group">
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-black rounded-2xl shadow-sm outline-none transition-all" />
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition" />
                             </div>
                          </div>
                       </div>
                    )}
                  </div>

                  {/* Right: Summary Area */}
                  <div className="md:col-span-5 flex flex-col h-full border-l border-gray-100 pl-8 relative">
                     <div className="sticky top-0 space-y-8">
                        <div>
                           <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Order Summary</h4>
                           <div className="flex gap-4 items-center mb-6">
                              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                 <img src={`http://localhost:3000${selectedProduct.image_url}`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <div className="font-bold text-gray-900 text-lg leading-tight">{selectedProduct.title}</div>
                                 <div className="text-gray-500 text-sm mt-1">{selectedProduct.brand} • {selectedProduct.size}</div>
                              </div>
                           </div>
                        </div>

                        {/* Clean Donation Slider */}
                        <div className="bg-gray-50 p-6 rounded-2xl">
                           <div className="flex justify-between items-center mb-4">
                              <span className="font-bold text-gray-900 flex items-center gap-2">
                                 <div className="w-6 h-6 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center"><FiHeart size={12}/></div>
                                 Charity
                              </span>
                              <span className="font-bold text-rose-500">{donationPercent}%</span>
                           </div>
                           <input type="range" min="0" max="20" value={donationPercent} onChange={e => setDonationPercent(parseInt(e.target.value))}
                           className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-rose-500 hover:accent-rose-600 transition-all" />
                           <p className="text-xs text-gray-500 mt-3 text-center">Add <span className="font-bold text-gray-900">RM {(Number (selectedProduct.price) * donationPercent / 100).toFixed(2)}</span> donation</p>
                        </div>

                        <div className="space-y-4 py-6 border-t border-b border-gray-100">
                           <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span>
                              <span className="font-medium">RM {Number (selectedProduct.price).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-rose-500">
                              <span>Donation</span>
                              <span className="font-medium">+ RM {Number ((selectedProduct.price) * donationPercent / 100).toFixed(2)}</span>
                           </div>
                        </div>

                        <div className="flex justify-between items-end">
                           <span className="text-gray-500 font-medium">Total due</span>
                           <span className="text-3xl font-bold text-gray-900">RM {(Number (selectedProduct.price)+Number(selectedProduct.price) * donationPercent / 100).toFixed(2)}</span>
                        </div>

                        <div className="space-y-3 pt-4">
                           <button onClick={processPayment} disabled={processing}
                              className="w-full py-5 rounded-2xl font-bold text-lg text-white bg-black shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                              {processing ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 
                              <>Pay Now <FiArrowRight /></>}
                           </button>
                           <button onClick={() => setPaymentStep(1)} className="w-full py-3 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                              Change Payment Method
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Step 3: Minimalist Processing */}
              {paymentStep === 3 && (
                <div className="h-96 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="relative w-24 h-24 mb-8">
                     <svg className="animate-spin w-full h-full text-gray-200" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center text-black">
                        <FiLock size={24} />
                     </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h4>
                  <p className="text-gray-500">Please wait while we secure your transaction...</p>
                </div>
              )}

              {/* Step 4: Minimalist Success */}
              {paymentStep === 4 && (
                <div className="h-96 flex flex-col items-center justify-center text-center animate-scale-up">
                   <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200 animate-bounce">
                      <FiCheckCircle className="text-white" size={48} />
                   </div>
                   <h4 className="text-3xl font-black text-gray-900 mb-2">Success!</h4>
                   <p className="text-gray-500 text-lg">Your payment has been confirmed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal - Modern Ticket Style */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative">
              <div className="bg-gray-900 text-white p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                     <FiCheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold">Payment Success</h2>
                  <p className="text-white/60 text-sm mt-1">{receipt.date}</p>
              </div>
              
              <div className="p-8 bg-white relative">
                  {/* Decorative Ticket Notches */}
                  <div className="absolute top-0 left-0 w-6 h-6 bg-black rounded-full -translate-x-3 -translate-y-3"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 bg-black rounded-full translate-x-3 -translate-y-3"></div>
                  <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-gray-200"></div>

                  <div className="space-y-6">
                     <div className="text-center">
                        <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Total Amount</div>
                        <div className="text-4xl font-bold text-gray-900">RM {(Number(receipt.amount) + Number(receipt.donation)).toFixed(2)}</div>
                     </div>

                     <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-500">Transaction ID</span>
                           <span className="font-mono font-medium">{receipt.transactionId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-500">Payment Method</span>
                           <span className="font-medium">{receipt.method}</span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600">{receipt.product.title}</span>
                           <span className="font-medium">RM {Number(receipt.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-rose-500">
                           <span className="flex items-center gap-1"><FiHeart size={12}/> Donation</span>
                           <span className="font-medium">RM {Number(receipt.donation).toFixed(2)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8">
                     <button onClick={() => setReceipt(null)} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg">
                        Back Home
                     </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FiFilter /> Products</h1>
        <div className="flex flex-wrap gap-4 items-center flex-1 justify-end">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-48" value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={fetchProducts} className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Search</button>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="border p-2 rounded-lg outline-none">
            <option value="">All</option>
            <option value="Tops">Tops</option>
            <option value="Bottoms">Bottoms</option>
            <option value="Dresses">Dresses</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Shoes">Shoes</option>
            <option value="Accessories">Accessories</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border p-2 rounded-lg outline-none">
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl">No products found</p>
          <p className="mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
              <div className="aspect-square overflow-hidden bg-gray-100 relative">
                {p.image_url ? <img src={`http://localhost:3000${p.image_url}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                {p.brand && <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md font-medium">{p.brand}</span>}
                {p.is_exchangeable && <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">Swap</span>}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{p.title}</h3>
                  <span className="text-green-600 font-bold text-lg">RM {Number(p.price).toFixed(2)}</span>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.category}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.size}</span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{p.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <span className="text-xs text-gray-400">@{p.seller_name}</span>
                  <button onClick={() => handleBuy(p)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition">Buy</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
