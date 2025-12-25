import React, { useState } from 'react';
import { Video, User, Lock, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatTime } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentTime } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate('/'); // Chuyển sang trang chủ sau khi đăng nhập thành công
      } else {
        console.log('ĐĂNG NHẬP THẤT BẠI:', result.message); // <-- DEBUG
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối: ' + (err.message || 'Không thể kết nối đến server'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-red-100 rounded-full p-4 mb-4">
            <Video className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Phòng Họp Không Giấy</h1>
          <p className="text-gray-500">Ủy Ban Nhân Dân Tỉnh</p>
          <p className="text-sm text-gray-400 mt-2">{formatTime(currentTime)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Nhập mật khẩu"
                required
                minLength={4}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
            }`}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;