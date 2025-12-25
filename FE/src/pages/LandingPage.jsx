import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, FileText, BarChart2, ArrowRight, LogIn } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-xl">BK</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  ĐẠI HỌC BÁCH KHOA HÀ NỘI
                </h1>
                <p className="text-red-100 text-sm">
                  HỆ THỐNG QUẢN TRỊ ĐẠI HỌC TRỰC TUYẾN
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-md"
              >
                <LogIn size={20} />
                ĐĂNG NHẬP
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-red-700 border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-3">
            <a href="#" className="text-white hover:text-red-100 font-medium text-sm">TRANG CHỦ</a>
            <a href="#" className="text-white hover:text-red-100 font-medium text-sm">GIẢNG VIÊN</a>
            <a href="#" className="text-white hover:text-red-100 font-medium text-sm">SINH VIÊN</a>
            <a href="#" className="text-white hover:text-red-100 font-medium text-sm">CÔNG THÔNG TIN</a>
            <a href="#" className="text-white hover:text-red-100 font-medium text-sm">LIÊN HỆ VÀ PHẢN HỒI</a>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div 
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url('https://storage.googleapis.com/hust-files/2021-11-15/5807675312963584/background-new-page_.9m.jpeg')`
        }}
      >
        
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-gray-600 text-lg">
              Hệ thống quản lý cuộc họp toàn diện và chuyên nghiệp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Video className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Họp trực tuyến
              </h3>
              <p className="text-gray-600">
                Hỗ trợ video conference với chất lượng HD, chia sẻ màn hình và ghi âm cuộc họp
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Quản lý tài liệu
              </h3>
              <p className="text-gray-600">
                Chia sẻ, xem và tải tài liệu cuộc họp một cách dễ dàng và bảo mật
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <BarChart2 className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Biểu quyết trực tuyến
              </h3>
              <p className="text-gray-600">
                Tổ chức biểu quyết trong cuộc họp với kết quả thời gian thực
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Users className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Quản lý thành viên
              </h3>
              <p className="text-gray-600">
                Mời, quản lý và phân quyền người tham gia cuộc họp một cách linh hoạt
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 Đại học Bách khoa Hà Nội - Trường Công nghệ Thông tin và Truyền thông
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Hệ thống Phòng họp Không giấy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;