import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-indigo-900 mb-6">Give Your Clothes a Second Life</h1>
        <p className="text-xl text-gray-600 mb-8">
          Join our community to buy, exchange, or donate clothing. Let every piece find a new home. Reduce waste, spread kindness.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link to="/products" className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg">
            Browse Market
          </Link>
          <Link to="/exchange" className="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg">
            Join Exchange
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-indigo-600">🛒 Shop with Confidence</h3>
            <p className="text-gray-500">Every item undergoes AI-assisted verification to ensure authenticity and quality. Secure payment guaranteed.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-green-600">🤝 Easy Exchange</h3>
            <p className="text-gray-500">Trade what you have for what you want. Simple process to get the clothes you love.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-pink-600">❤️ Charity Donation</h3>
            <p className="text-gray-500">A portion of each transaction is automatically donated to charity, making every purchase meaningful.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

