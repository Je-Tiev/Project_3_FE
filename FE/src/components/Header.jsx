import React from 'react';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatTime } from '../utils/dateUtils';

const Header = ({ title, showBackButton = false, onBack }) => {
  const { currentTime, currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo & Title */}
          <div className="flex items-center gap-4">
            {/* Back button (if needed) */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Quay lại</span>
              </button>
            )}

            {/* Logo */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src="https://storage.googleapis.com/hust-files/2023-11-01/5807675312963584/ggg_3.4k.png"
                alt="HUST logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                    ĐẠI HỌC BÁCH KHOA HÀ NỘI
                  </h1>
                  <p className="text-red-100 text-xs sm:text-sm">
                    HỆ THỐNG PHÒNG HỌP TRỰC TUYẾN
                  </p>
            </div>
          </div>

          {/* Right side - User info & Actions */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <div className="hidden md:flex items-center text-white/90 text-sm font-mono bg-white/10 px-3 py-2 rounded-lg">
              {formatTime(currentTime)}
            </div>

            {/* User info & Logout (if logged in) */}
            {currentUser ? (
              <>
                {/* User profile */}
                <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">
                    {currentUser.fullName || currentUser.username}
                  </span>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white group"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm font-medium">
                    Đăng xuất
                  </span>
                </button>
              </>
            ) : (
              /* Login button (if not logged in) - for public pages */
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-md"
              >
                <User size={20} />
                <span className="hidden sm:inline">ĐĂNG NHẬP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;