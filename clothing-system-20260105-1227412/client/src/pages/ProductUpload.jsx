import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiX, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

const ProductUpload = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Tops', size: 'M', 
    condition: 'Tried Once', price: '', brand: '', is_exchangeable: true
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (file) => {
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleImageChange(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { alert('Please upload an image'); return; }

    setUploading(true);
    setAiStatus('checking');
    setAiMessage('AI is analyzing your image, please wait...');

    const data = new FormData();
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    data.append('image', image);

    try {
      const res = await api.post('/products', data, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      if (res.data.status === 'approved') {
        setAiStatus('approved');
        setAiMessage('AI check passed! Your item is now listed.');
        setTimeout(() => navigate('/products'), 2000);
      } else if (res.data.status === 'rejected') {
        setAiStatus('rejected');
        setAiMessage('AI check failed: Image may not be clothing or contains inappropriate content.');
      } else {
        setAiStatus('pending');
        setAiMessage('Submitted for manual review.');
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (err) {
      setAiStatus('error');
      setAiMessage('Upload failed: ' + (err.response?.data?.error || 'Network error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 flex justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <FiUploadCloud size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">List Item</h2>
            <p className="text-gray-500 text-sm">AI will automatically verify your image</p>
          </div>
        </div>

        {aiStatus && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            aiStatus === 'checking' ? 'bg-blue-50 text-blue-700' :
            aiStatus === 'approved' ? 'bg-green-50 text-green-700' :
            aiStatus === 'rejected' ? 'bg-red-50 text-red-700' :
            aiStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {aiStatus === 'checking' && <FiLoader className="animate-spin" size={20} />}
            {aiStatus === 'approved' && <FiCheckCircle size={20} />}
            {aiStatus === 'rejected' && <FiAlertCircle size={20} />}
            {aiStatus === 'pending' && <FiAlertCircle size={20} />}
            <span className="font-medium">{aiMessage}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" placeholder="e.g.: Nike Sneakers, Zara Shirt" 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input type="text" placeholder="e.g.: Nike, Adidas, Zara" 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                onChange={e => setFormData({...formData, brand: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border p-2.5 rounded-lg" value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Tops">Tops</option>
                  <option value="Sweaters">Sweaters</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input type="number" placeholder="0.00" 
                  className="w-full border p-2.5 rounded-lg outline-none" 
                  onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select className="w-full border p-2.5 rounded-lg" value={formData.size} 
                  onChange={e => setFormData({...formData, size: e.target.value})}>
                  <option value="One Size">One Size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="40">40</option>
                  <option value="41">41</option>
                  <option value="42">42</option>
                  <option value="43">43</option>
                  <option value="44">44</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select className="w-full border p-2.5 rounded-lg" value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value})}>
                  <option value="Brand New with Tags">Brand New with Tags</option>
                  <option value="Tried Once">Tried Once</option>
                  <option value="Lightly Used">Lightly Used</option>
                  <option value="Normal Wear">Normal Wear</option>
                  <option value="Has Flaws">Has Flaws</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea placeholder="Describe the item details..." rows="3" 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-green-800">Available for Exchange</span>
                  <p className="text-xs text-green-600">Others can offer their items to trade</p>
                </div>
                <div className="relative" onClick={() => setFormData({...formData, is_exchangeable: !formData.is_exchangeable})}>
                  <div className={`w-11 h-6 rounded-full transition ${formData.is_exchangeable ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_exchangeable ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
            <div 
              className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition
                ${preview ? 'border-gray-300' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {preview ? (
                <>
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                    <p className="text-white font-bold">Click to change</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); setImage(null); }}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500 hover:bg-red-50">
                    <FiX />
                  </button>
                </>
              ) : (
                <div className="text-center p-6">
                  <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click or drag image here</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
                </div>
              )}
              <input id="file-upload" type="file" accept="image/*" className="hidden"
                onChange={e => handleImageChange(e.target.files[0])} />
            </div>

            <button type="submit" disabled={uploading || aiStatus === 'approved'}
              className="w-full mt-6 bg-indigo-600 text-white py-3.5 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2">
              {uploading ? (
                <><FiLoader className="animate-spin" /> AI Checking...</>
              ) : aiStatus === 'approved' ? (
                <><FiCheckCircle /> Listed!</>
              ) : (
                <><FiCheckCircle /> List Item</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductUpload;
