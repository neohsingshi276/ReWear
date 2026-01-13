import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import emailjs from 'emailjs-com';


const Login = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: enter email, 2: enter token & password
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await api.post('/login', { email, password });

    const user = res.data.user;

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(user));

    if (user.email === 'admin@test.com') {
      navigate('/admin');   // ✅ admin 进后台
    } else {
      navigate('/');        // ✅ 普通用户进主页
    }

    window.location.reload(); // 保留你原本逻辑
  } catch (err) {
    alert(err.response?.data?.error || 'Login failed');
  } finally {
    setLoading(false);
  }
};

const sendCode = async () => {
  if (!email) {
    alert('Please enter your email');
    return;
  }

   setLoading(true);
  try {
    // 后端生成验证码
    const res = await api.post('/password/send-code', { email });
    const code = res.data.code; // 后端返回的 6 位码

    // EmailJS 发邮件
    await emailjs.send(
      'service_3abonlf',
      'template_895gar9',
       {
        to_email: email,
        code: res.data.code
      },
      'O6JGWYqhNgQP78t0V'
    );
    alert('Verification code sent to your email');
    setResetStep(2); // 进入第二步
  } catch (err) {
    console.error(err);
    alert('Failed to send verification code');
  } finally {
    setLoading(false);
  }
};

const resetPassword = async () => {
  if (!code || !newPassword) {
    alert('Please enter verification code and new password');
    return;
  }

  setLoading(true);
  try {
    await api.post('/password/reset-with-code', {
      email,
      code,
      newPassword
    });

    alert('Password reset successful. Please login again.');
    window.location.href = '/login';
  } catch (err) {
    alert(err.response?.data?.error || 'Reset failed');
  } finally {
    setLoading(false);
  }
};


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/forgot-password', { email });
      alert('Reset token generated! Check console or use the token shown.');
      console.log('Reset Token:', res.data.token);
      // For demo purposes, auto-fill the token
      if (res.data.token) {
        setResetToken(res.data.token);
      }
      setResetStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reset-password', { token: resetToken, newPassword });
      alert('Password updated successfully! Please login with your new password.');
      setForgotMode(false);
      setResetStep(1);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <button 
              onClick={() => { setForgotMode(false); setResetStep(1); }}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
            >
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <p className="text-gray-500 mt-2">
                {resetStep === 1 ? 'Enter your email to receive a verification code' : 'Enter the verification code and your new password'}
              </p>
            </div>

            {resetStep === 1 ? (
              <form
  onSubmit={(e) => {
    e.preventDefault();
    sendCode();  

 // 新函数
  }}
>
                <div className='mb-6'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                      required 
                    />
                  </div>
                </div>
                <button 
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form
  onSubmit={(e) => {
    e.preventDefault();
    resetPassword();
  }}
>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
  Verification Code
</label>
<input 
  type="text"
  value={code}
  onChange={e => setCode(e.target.value)}
  placeholder="Enter 6-digit code"
  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-indigo-500 outline-none 
             tracking-widest text-center font-mono"
  required
/>

                </div>
                <div className='mb-6'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                      required 
                    />
                  </div>
                </div>
                <button type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-500 mt-2">Login to your ReWear account</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button 
              type="submit"
              onClick={() => setForgotMode(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button 
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-gray-500 mt-6">
            Don't have an account? 
            <Link to="/register" className="text-indigo-600 font-medium ml-1 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
