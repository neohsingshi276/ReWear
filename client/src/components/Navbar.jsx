import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiRepeat, FiLogOut, FiPlusCircle, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path ? "text-indigo-600 font-bold" : "text-gray-600 hover:text-indigo-600";

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4 shadow-sm'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 text-white p-2 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <FiShoppingBag size={24} />
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ReWear
          </span>
        </Link>
        
        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8 items-center absolute left-1/2 transform -translate-x-1/2">
          <Link to="/products" className={`flex items-center gap-2 transition-colors ${isActive('/products')}`}>
            Shop & Donate
          </Link>
          <Link to="/exchange" className={`flex items-center gap-2 transition-colors ${isActive('/exchange')}`}>
            <FiRepeat /> Exchange
          </Link>
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-4">
          {token ? (
            <>
              <Link to="/upload" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm font-medium transform hover:-translate-y-0.5">
                <FiPlusCircle size={18} /> List Item
              </Link>
              
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-transparent group-hover:border-indigo-200 transition">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800 group-hover:text-indigo-600">{user.username}</p>
                    
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition" title="Logout">
                  <FiLogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-gray-600 font-medium hover:text-indigo-600 px-2">
                Login
              </Link>
              <Link to="/register" className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition shadow-lg transform hover:-translate-y-0.5">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t p-4 flex flex-col gap-4">
          <Link to="/products" className="py-2 text-gray-700 font-medium border-b border-gray-100" onClick={() => setIsOpen(false)}>
            Shop & Donate
          </Link>
          <Link to="/exchange" className="py-2 text-gray-700 font-medium border-b border-gray-100" onClick={() => setIsOpen(false)}>
            Exchange
          </Link>
          {token ? (
            <>
              <Link to="/upload" className="py-2 text-indigo-600 font-bold border-b border-gray-100" onClick={() => setIsOpen(false)}>
                List Item
              </Link>
              <Link to="/profile" className="py-2 text-gray-700 font-medium" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout} className="py-2 text-red-500 text-left">
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link to="/login" className="text-center py-2 border rounded-lg" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="text-center py-2 bg-indigo-600 text-white rounded-lg" onClick={() => setIsOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
