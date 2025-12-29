// src/components/meetings/CreateMeetingForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Save, X, Plus, Trash2, Search, Users, UserPlus, FileText, UploadCloud, Paperclip } from 'lucide-react'; 
import { useApp } from '../../contexts/AppContext';
import { apiCall } from '../../utils/api';

const CreateMeetingForm = ({ onClose, onSave }) => {
  const { createMeeting, currentUser } = useApp();

  const [activeSection, setActiveSection] = useState('basic');
  const [message, setMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  
  const [activeDeptId, setActiveDeptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeSection === 'participants' && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [activeSection, allUsers.length]);

  const departments = useMemo(() => {
  const map = new Map();
  allUsers.forEach(u => {
    const id = u.departmentId ?? null;
    const name = u.departmentName ?? u.department?.name ?? `Dept ${id}`;
    if (id != null && !map.has(id)) map.set(id, { id, name });
  });
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [allUsers]);

useEffect(() => {
  if (departments.length > 0 && activeDeptId === null) {
    setActiveDeptId(departments[0].id);
  }
}, [departments, activeDeptId]);


  const [participants, setParticipants] = useState([]);

  const usersInActiveDept = useMemo(() => {
    return allUsers.filter(u => u.departmentId === activeDeptId);
  }, [allUsers, activeDeptId]);

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const lowerSearch = searchTerm.toLowerCase();
    return participants.filter(p => 
      p.name?.toLowerCase().includes(lowerSearch) || 
      (p.departmentName && p.departmentName.toLowerCase().includes(lowerSearch))
    );
  }, [participants, searchTerm]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    host: currentUser?.fullName || '',
    room: '',
    startDate: '',   
    startTime: '',   
    endDate: '',   
    endTime: '',
    type: 'internal',
    documents: [],
    notifications: true,
    accessControl: false
  });

  useEffect(() => {
    if (currentUser?.fullName) {
      setForm(prev => ({ ...prev, host: currentUser.fullName }));
    }
  }, [currentUser]);

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiCall('/Auth/users', { method: 'GET' });
      const users = Array.isArray(res) ? res : (res.value || res.data || res.users || []);
      setAllUsers(users);
      setMessage(`${users.length} users loaded`);
    } catch (err) {
      console.error('Load users error:', err);
      setMessage('Lỗi tải danh sách user');
    } finally {
      setLoadingUsers(false);
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const addOneParticipant = (u) => {
    const p = {
      userId: u.userId ?? u.id,
      name: u.fullName ?? u.name ?? u.username,
      roleInMeeting: 'Member',
      departmentName: u.departmentName
    };
    setParticipants(prev => {
      if (prev.find(item => String(item.userId) === String(p.userId))) return prev;
      return [...prev, p];
    });
  };

  const addAllFromDept = () => {
    const usersToAdd = usersInActiveDept.map(u => ({
      userId: u.userId ?? u.id,
      name: u.fullName ?? u.name ?? u.username,
      roleInMeeting: 'Member',
      departmentName: u.departmentName
    }));

    setParticipants(prev => {
      const map = new Map();
      prev.forEach(p => map.set(String(p.userId), p));
      usersToAdd.forEach(u => map.set(String(u.userId), u));
      return Array.from(map.values());
    });
    setMessage(` Đã thêm nhân sự từ phòng ban.`);
    setTimeout(() => setMessage(''), 2000);
  };

  const removeParticipant = (userId) => {
    setParticipants(prev => prev.filter(p => String(p.userId) !== String(userId)));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({
      ...prev,
      documents: [...prev.documents, { 
        id: Date.now(), 
        name: file.name, 
        type, 
        file: file,
        size: (file.size / 1024).toFixed(1) + ' KB'
      }]
    }));
    e.target.value = '';
  };

  const removeDocument = (id) => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  const isValidDmy = (dmy) => {
    if (!dmy) return false;
    const parts = dmy.split('/');
    if (parts.length !== 3) return false;
    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return false;
    const dt = new Date(yyyy, mm - 1, dd);
    return dt && dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd;
  };

  const vnDateTimeToUtcIso = (dateStr, timeStr) => {
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  const [hh, min] = timeStr.split(':').map(Number);

  return new Date(yyyy, mm - 1, dd, hh, min, 0).toISOString()

};


  const getMeetingIdFromCreateResult = (result) => {
    if (!result) return null;
    const data = result.data || result;
    return data.meetingId ?? data.id ?? data.meeting?.meetingId ?? data.meetingIdCreated ?? null;
  };

  const handleSave = async (asDraft = false) => {
    if (!form.title ||
        !form.startDate ||
        !form.startTime ||
        !form.endDate ||
        !form.endTime) {
      setMessage('Please fill required fields: Title, Date, Time');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    if (!isValidDmy(form.startDate) || !isValidDmy(form.endDate)) {
      setMessage('Date must be in dd/mm/yyyy format');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

  const startTimeUtc = vnDateTimeToUtcIso(form.startDate, form.startTime);
  const endTimeUtc = vnDateTimeToUtcIso(form.endDate, form.endTime);

  if (new Date(endTimeUtc) <= new Date(startTimeUtc)) {
    setMessage('End time must be after start time');
    setTimeout(() => setMessage(''), 2000);
    return;
  }
  const startHour = parseInt(form.startTime.split(':')[0], 10);


    setMessage('Creating meeting...');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        location: form.room,
        organizer: form.host,
        session: startHour < 12 ? 'Buổi sáng' : 'Buổi chiều',
        status: 'not_started',
        approved: !asDraft,
        participants: participants.map(p => ({ userId: p.userId, roleInMeeting: p.roleInMeeting })),
        documents: form.documents.map(d => ({ name: d.name, type: d.type }))
      };

      const createResult = await createMeeting(payload);
      if (!createResult || !createResult.success) {
        setMessage('❌ Failed to create meeting');
        return;
      }

      const meetingId = getMeetingIdFromCreateResult(createResult) ?? (createResult.data && (createResult.data.meetingId || createResult.data.id));

      if (!meetingId) {
        setMessage('⚠️ Meeting created but cannot determine meetingId.');
        if (onSave) onSave();
        if (onClose) onClose();
        return;
      }

      const hostUserId = currentUser?.userId;
      const hostEntry = hostUserId ? [{ userId: hostUserId, roleInMeeting: 'Host' }] : [];
      const others = participants
        .filter(p => String(p.userId) !== String(hostUserId))
        .map(p => ({ userId: p.userId, roleInMeeting: p.roleInMeeting || 'Member' }));

      const finalParticipantsPayload = [...hostEntry, ...others];

      if (finalParticipantsPayload.length > 0) {
        try {
          await apiCall(`/Participant/meeting/${meetingId}/bulk`, {
            method: 'POST',
            body: JSON.stringify({ participants: finalParticipantsPayload }) 
          });
        } catch (err) {
          console.error('Failed to add participants');
        }
      }

      if (form.documents.length > 0) {
        try {
          const formData = new FormData();
          form.documents.forEach((doc) => {
            if (doc.file) {
        
              formData.append('Files', doc.file); 
            }
          });
          formData.append('Visibility', 'Chung');

          const token = localStorage.getItem('token');
          const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5075/api';


          const uploadUrl = `${BASE_URL}/Document/UploadMultipleDocuments/meeting/${meetingId}/multiple`;
          
          console.log("👉 Calling Upload API URL:", uploadUrl);

          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
          });

          if (!uploadResponse.ok) {
            let errorMsg = `Upload failed with status ${uploadResponse.status}`;
            try {
              const errorData = await uploadResponse.json();
              errorMsg = errorData.message || JSON.stringify(errorData);
            } catch {
              errorMsg = await uploadResponse.text();
            }
            throw new Error(errorMsg);
          }

          const result = await uploadResponse.json();
          console.log('✅ Upload tài liệu thành công:', result);
          
        } catch (err) {
          console.error('❌ Lỗi upload file trực tiếp:', err);
          setMessage('⚠️ Cuộc họp đã tạo nhưng lỗi upload tài liệu: ' + err.message);
        }
      }

      if (onSave) onSave();
      setTimeout(() => { if (onClose) onClose(); }, 800);
    } catch (err) {
      setMessage('❌ Error creating meeting: ' + (err.message || err));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Create New Meeting</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(false)} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-5 h-5" /> Save
          </button>
          <button onClick={() => handleSave(true)} className="bg-secondary hover:bg-secondary-dark text-text px-6 py-2 rounded-button font-semibold border border-secondary-dark transition-colors">
            Save as Draft
          </button>
          <button onClick={onClose} className="bg-white hover:bg-secondary text-text px-6 py-2 rounded-button font-semibold border border-secondary-dark transition-colors flex items-center gap-2">
            <X className="w-5 h-5" /> Cancel
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-button ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-secondary-dark rounded-lg mb-6">
        <div className="flex border-b border-secondary-dark overflow-x-auto">
          {['basic', 'participants', 'documents'].map(key => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${activeSection === key ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-text'}`}
            >
              {key === 'basic' ? 'Basic Info' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* BASIC INFO - GIỮ NGUYÊN */}
          {activeSection === 'basic' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Title <span className="text-primary">*</span></label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-secondary-dark rounded-button" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Host</label>
                  <input name="host" value={form.host} disabled className="w-full px-4 py-2 border border-secondary-dark bg-gray-100 rounded-button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Room</label>
                  <input name="room" value={form.room} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" />
                </div>
                <div className="grid grid-cols-1 gap-6">

                  {/* START */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">
                      Start Date & Time <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="startDate"
                        placeholder="dd/mm/yyyy"
                        value={form.startDate}
                        onChange={handleChange}
                        className="px-4 py-2 border border-secondary-dark rounded-button"
                      />
                      <input
                        type="time"
                        name="startTime"
                        value={form.startTime}
                        onChange={handleChange}
                        className="px-4 py-2 border border-secondary-dark rounded-button"
                      />
                    </div>
                  </div>

                  {/* END */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">
                      End Date & Time <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="endDate"
                        placeholder="dd/mm/yyyy"
                        value={form.endDate}
                        onChange={handleChange}
                        className="px-4 py-2 border border-secondary-dark rounded-button"
                      />
                      <input
                        type="time"
                        name="endTime"
                        value={form.endTime}
                        onChange={handleChange}
                        className="px-4 py-2 border border-secondary-dark rounded-button"
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* PARTICIPANTS - GIỮ NGUYÊN */}
          {activeSection === 'participants' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 border border-secondary-dark rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-secondary p-3 font-semibold border-b border-secondary-dark flex justify-between">
                    <span>Phòng ban</span>
                    {loadingUsers && <span className="text-xs animate-pulse text-primary">Loading...</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {departments.map(d => (
                      <div 
                        key={d.id} 
                        onClick={() => setActiveDeptId(d.id)}
                        className={`p-3 cursor-pointer border-b last:border-0 transition-colors ${activeDeptId === d.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-gray-50'}`}
                      >
                        <div className="font-medium text-sm">{d.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 border border-secondary-dark rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-secondary p-3 font-semibold border-b border-secondary-dark flex justify-between items-center">
                    <span className="text-sm">Nhân viên</span>
                    <button onClick={addAllFromDept} className="text-xs bg-primary text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-primary-dark">
                      <Users className="w-3 h-3" /> Thêm tất cả
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {usersInActiveDept.map(u => (
                      <div key={u.userId} className="p-3 flex justify-between items-center hover:bg-gray-50">
                        <span className="text-sm font-medium">{u.fullName}</span>
                        <button onClick={() => addOneParticipant(u)} className="p-1 text-primary hover:bg-primary/10 rounded">
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-secondary-dark">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                  <h3 className="font-bold">Danh sách tham gia ({participants.length})</h3>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input 
                      type="text" 
                      placeholder="Tìm tên hoặc phòng ban..." 
                      className="w-full pl-10 pr-4 py-2 border border-secondary-dark rounded-button text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white border border-secondary-dark rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left">Họ tên</th>
                        <th className="px-4 py-3 text-left">Phòng ban</th>
                        <th className="px-4 py-3 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-dark">
                      {filteredParticipants.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-text-light">{p.departmentName}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => removeParticipant(p.userId)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS - TỐI ƯU UI */}
          {activeSection === 'documents' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section 1 */}
                <div className="border-2 border-dashed border-secondary-dark rounded-xl p-6 hover:border-primary transition-colors bg-gray-50/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-bold mb-1">Tài liệu được phát</h4>
                    <p className="text-xs text-text-light mb-4">PDF, Word, Excel tối đa 20MB</p>
                    <label className="bg-white border border-secondary-dark px-4 py-2 rounded-button text-sm font-semibold cursor-pointer hover:bg-secondary transition-all flex items-center gap-2 shadow-sm">
                      <Paperclip className="w-4 h-4" /> Chọn tập tin
                      <input type="file" hidden onChange={(e) => handleFileUpload(e, 'rev')} />
                    </label>
                  </div>
                </div>

                {/* Upload Section 2 */}
                <div className="border-2 border-dashed border-secondary-dark rounded-xl p-6 hover:border-primary transition-colors bg-gray-50/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-bold mb-1">Tài liệu chuẩn bị</h4>
                    <p className="text-xs text-text-light mb-4">Các tài liệu tham khảo trước buổi họp</p>
                    <label className="bg-white border border-secondary-dark px-4 py-2 rounded-button text-sm font-semibold cursor-pointer hover:bg-secondary transition-all flex items-center gap-2 shadow-sm">
                      <Paperclip className="w-4 h-4" /> Chọn tập tin
                      <input type="file" hidden onChange={(e) => handleFileUpload(e, 'pre')} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Document List Table */}
              {form.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" /> 
                    Danh sách tệp tin ({form.documents.length})
                  </h3>
                  <div className="border border-secondary-dark rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary text-text font-semibold">
                        <tr>
                          <th className="px-4 py-3 text-left">Tên tệp</th>
                          <th className="px-4 py-3 text-left">Phân loại</th>
                          <th className="px-4 py-3 text-left">Dung lượng</th>
                          <th className="px-4 py-3 text-center w-20">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-dark">
                        {form.documents.map(doc => (
                          <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded text-gray-500">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${doc.type === 'rev' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                {doc.type === 'rev' ? 'Phát hành' : 'Chuẩn bị'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-light italic">{doc.size}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => removeDocument(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-secondary-dark sticky bottom-0 p-4 flex justify-end gap-3 shadow-lg">
        <button onClick={() => handleSave(false)} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button flex items-center gap-2 font-semibold transition-all shadow-md">
          <Save className="w-5 h-5" /> Save & Create
        </button>
        <button onClick={onClose} className="bg-white hover:bg-gray-50 text-text px-6 py-2 rounded-button border border-secondary-dark font-semibold transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateMeetingForm;