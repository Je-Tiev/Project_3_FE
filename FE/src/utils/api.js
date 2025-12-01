// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5075/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log("👉 Calling API URL:", url);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // ======================
    // Xử lý lỗi Response
    // ======================
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;

      // Thử parse JSON lỗi
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || JSON.stringify(errorData);
      } catch {
        // Nếu không phải JSON thì đọc text
        try {
          errorDetail = await response.text();
        } catch {
          // giữ nguyên errorDetail
        }
      }

      // Token hết hạn → logout
      if (response.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      throw new Error(errorDetail);
    }

    // ======================
    // TRẢ VỀ KẾT QUẢ
    // ======================
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
