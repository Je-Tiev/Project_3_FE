import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { dayOfWeekViFromDmy } from '../utils/dateUtils';

const AdminCreateMeeting = ({ onClose }) => {
  const { createMeeting } = useApp();
  const [open, setOpen] = useState(true);

  const [form, setForm] = useState({
    title: '',
    date: '', // dd/mm/yyyy
    time: '', // HH:mm
    location: '',
    session: 'Buổi sáng',
    organizer: '',
    file_rev: '',
    file_rev_link: '',
    file_rev_file: null,
    file_rev_name: '',
    file_pre: '',
    file_pre_link: '',
    file_pre_file: null,
    file_pre_name: '',
    status: 'not_started',
    approved: true
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files && files.length ? files[0] : null;
      if (!file) {
        setForm(prev => ({ ...prev, [name]: null }));
        return;
      }
      const url = URL.createObjectURL(file);
      if (name === 'file_rev_file') {
        setForm(prev => ({
          ...prev,
          file_rev_file: file,
          file_rev_link: url,
          file_rev_name: prev.file_rev_name || file.name
        }));
      } else if (name === 'file_pre_file') {
        setForm(prev => ({
          ...prev,
          file_pre_file: file,
          file_pre_link: url,
          file_pre_name: prev.file_pre_name || file.name
        }));
      }
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) {
      setMessage('Vui lòng nhập tiêu đề, ngày và giờ');
      return;
    }

    try {
      const result = await createMeeting({
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        organizer: form.organizer,
        session: form.session,
        status: form.status,
        approved: form.approved,
        participants: [] // TODO: Thêm danh sách người tham gia
      });

      if (result.success) {
        setMessage('✅ Tạo cuộc họp thành công!');
        setTimeout(() => {
          if (onClose) onClose();
          setOpen(false);
        }, 1500);
        setForm({
          title: '',
          date: '',
          time: '',
          location: '',
          session: 'Buổi sáng',
          organizer: '',
          file_rev: '',
          file_rev_link: '',
          file_rev_file: null,
          file_rev_name: '',
          file_pre: '',
          file_pre_link: '',
          file_pre_file: null,
          file_pre_name: '',
          status: 'not_started',
          approved: true
        });
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('❌ Lỗi: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Lỗi tạo cuộc họp: ' + error.message);
    }
  };

  if (!open) {
    return (
      <div className="mb-6">
        <button onClick={() => setOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded">Tạo cuộc họp</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-bold mb-4">Tạo cuộc họp (Admin)</h2>
      {message && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{message}</div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="title" value={form.title} onChange={handleChange} className="px-3 py-2 border rounded" placeholder="Tiêu đề" required />
        <input name="date" value={form.date} onChange={handleChange} className="px-3 py-2 border rounded" placeholder="Ngày (dd/mm/yyyy)" required />
        <input name="time" value={form.time} onChange={handleChange} className="px-3 py-2 border rounded" placeholder="Giờ (HH:mm)" required />
        <input name="location" value={form.location} onChange={handleChange} className="px-3 py-2 border rounded" placeholder="Địa điểm" />
        <input name="organizer" value={form.organizer} onChange={handleChange} className="px-3 py-2 border rounded" placeholder="LĐ chủ trì" />
        {/* Hàng tài liệu: 2 box cùng 1 dòng với nút + để upload */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              name="file_rev_link"
              value={form.file_rev_link}
              onChange={handleChange}
              className="w-full pr-12 px-3 py-2 border rounded"
              placeholder="Tài liệu được phát: dán link hoặc bấm + để chọn file"
            />
            <input type="file" name="file_rev_file" onChange={handleChange} className="hidden" id="revUpload" />
            <button
              type="button"
              onClick={() => document.getElementById('revUpload').click()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-transparent text-gray-700 text-lg leading-none shadow-none focus:outline-none focus:ring-0"
              title="Chọn file"
            >
              +
            </button>
          </div>
          <div className="relative">
            <input
              name="file_pre_link"
              value={form.file_pre_link}
              onChange={handleChange}
              className="w-full pr-12 px-3 py-2 border rounded"
              placeholder="Tài liệu chuẩn bị: dán link hoặc bấm + để chọn file"
            />
            <input type="file" name="file_pre_file" onChange={handleChange} className="hidden" id="preUpload" />
            <button
              type="button"
              onClick={() => document.getElementById('preUpload').click()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-transparent text-gray-700 text-lg leading-none shadow-none focus:outline-none focus:ring-0"
              title="Chọn file"
            >
              +
            </button>
          </div>
        </div>
        <select name="session" value={form.session} onChange={handleChange} className="px-3 py-2 border rounded">
          <option value="Buổi sáng">Buổi sáng</option>
          <option value="Buổi chiều">Buổi chiều</option>
        </select>
        <select name="status" value={form.status} onChange={handleChange} className="px-3 py-2 border rounded">
          <option value="not_started">Chưa diễn ra</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="postponed">Bị hoãn</option>
          <option value="completed">Kết thúc</option>
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-2 border rounded">
          <input type="checkbox" name="approved" checked={form.approved} onChange={handleChange} />
          Đã duyệt
        </label>
        <div className="md:col-span-3 flex items-center gap-3">
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded">Tạo cuộc họp</button>
          <button type="button" onClick={() => { setOpen(false); if (onClose) onClose(); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded">Đóng</button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateMeeting;


