import React, { useState, useEffect } from 'react';
import { Edit, Lock, Unlock, Eye, Plus, CheckCircle, XCircle } from 'lucide-react';
import { apiCall } from '../../utils/api';

const departments = [
  { id: 1, name: "Phòng Bảo vệ" },
  { id: 2, name: "Phòng Kỹ thuật" },
  { id: 3, name: "Phòng Kế toán" },
  { id: 4, name: "Ban Giám đốc" },
  { id: 5, name: "Phòng Nhân sự" }
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filterPosition, setFilterPosition] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [newUser, setNewUser] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    departmentID: 1
  });

  // Fetch user từ backend
  const fetchUsers = async () => {
    try {
      const response = await apiCall("/Auth/users", { method: "GET" });
      const formatted = response.map(u => ({
        id: u.userId,
        name: u.fullName,
        email: u.email,
        position: u.departmentName || "N/A",
        role: u.role,
        status: "Active"
      }));
      setUsers(formatted);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
      setFeedback({ message: "Không tải được danh sách người dùng!", type: "error" });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: 'Đang xử lý...', type: 'info' });

    try {
      const responseData = await apiCall("/Auth/register", { method: "POST", body: JSON.stringify(newUser) });
      const successMessage = typeof responseData === 'object' && responseData.message
        ? responseData.message
        : responseData.toString() || 'Đăng ký người dùng thành công.';
      setFeedback({ message: successMessage, type: 'success' });

      // Thêm user mới vào danh sách hiển thị ngay lập tức
      const departmentName = departments.find(d => d.id === newUser.departmentID)?.name || "N/A";
      setUsers(prev => [
        ...prev,
        {
          id: Date.now(),
          name: newUser.fullName,
          email: newUser.email,
          position: departmentName,
          role: "User",
          status: "Active"
        }
      ]);

      setShowForm(false);
      setNewUser({ fullName: "", username: "", email: "", password: "", departmentID: 1 });

      // Fetch lại danh sách từ backend để đảm bảo dữ liệu chính xác
      await fetchUsers();

    } catch (err) {
      console.error("Đăng ký thất bại:", err);
      setFeedback({ message: `Đăng ký thất bại! Lỗi: ${err.message}`, type: 'error' });
    }

    setTimeout(() => setFeedback({ message: '', type: '' }), 5000);
  };

  // Lọc & tìm kiếm frontend
  const filteredUsers = users.filter(u => {
    const matchPosition = filterPosition === "All" || u.position === filterPosition;
    const matchRole = filterRole === "All" || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchText.toLowerCase());
    return matchPosition && matchRole && matchSearch;
  });

  const positions = ["All", ...Array.from(new Set(users.map(u => u.position)))];
  const roles = ["All", ...Array.from(new Set(users.map(u => u.role)))];

  return (
    <div className="p-4">
      {/* Thông báo chung */}
      {feedback.message && (
        <div className={`p-4 mb-4 rounded-lg flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-green-100 text-green-700' :
          feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Controls lọc & tìm kiếm */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search Name or Email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border p-2 rounded"
        />
        <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="border p-2 rounded">
          {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="border p-2 rounded">
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-dark">
          <Plus className="w-5 h-5" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-secondary-dark rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                  <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">{user.position}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'Admin' ? 'bg-primary text-white' : 'bg-secondary text-text'}`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-primary hover:bg-secondary rounded-button" title="Edit"><Edit className="w-4 h-4" /></button>
                      {user.status === 'Active' ? (
                        <button className="p-2 text-orange-600 hover:bg-secondary rounded-button" title="Lock"><Lock className="w-4 h-4" /></button>
                      ) : (
                        <button className="p-2 text-green-600 hover:bg-secondary rounded-button" title="Unlock"><Unlock className="w-4 h-4" /></button>
                      )}
                      <button className="p-2 text-primary hover:bg-secondary rounded-button" title="View History"><Eye className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {feedback.message && feedback.type !== 'success' && (
                <div className={`p-2 rounded-lg flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  <XCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">{feedback.message}</p>
                </div>
              )}
              <input className="w-full border p-2 rounded" placeholder="Full Name" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required />
              <input className="w-full border p-2 rounded" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
              <input className="w-full border p-2 rounded" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              <input type="password" className="w-full border p-2 rounded" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />

              {/* Chọn Department */}
              <select className="w-full border p-2 rounded" value={newUser.departmentID} onChange={(e) => setNewUser({ ...newUser, departmentID: Number(e.target.value) })} required>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-primary-dark">Create User</button>
              <button type="button" className="w-full bg-gray-300 mt-2 p-2 rounded hover:bg-gray-400" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
