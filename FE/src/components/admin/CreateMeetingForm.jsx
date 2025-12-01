// src/components/meetings/CreateMeetingForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { apiCall } from '../../utils/api';

const CreateMeetingForm = ({ onClose, onSave }) => {
  const { createMeeting, currentUser } = useApp();

  const [activeSection, setActiveSection] = useState('basic');
  const [message, setMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // all users from /Auth/users

  // departments derived from users: [{ id, name }]
  const departments = useMemo(() => {
    const map = new Map();
    allUsers.forEach(u => {
      const id = u.departmentId ?? null;
      const name = u.departmentName ?? u.department?.name ?? `Dept ${id}`;
      if (id != null && !map.has(id)) map.set(id, { id, name });
    });
    return Array.from(map.values()).sort((a, b) => (a.id - b.id));
  }, [allUsers]);

  // which departmentIds are selected
  const [selectedDeptIds, setSelectedDeptIds] = useState(new Set());

  // participants selected (manually or from departments)
  const [participants, setParticipants] = useState([]); // { userId, name, roleInMeeting, departmentId }

  // form state (host auto from currentUser)
  const [form, setForm] = useState({
    title: '',
    description: '',
    host: currentUser?.fullName || '',
    room: '',
    date: '', // dd/mm/yyyy
    time: '', // HH:mm
    type: 'internal',
    documents: [],
    votingTopics: [],
    notifications: true,
    accessControl: false
  });

  useEffect(() => {
    // keep host synced if currentUser available after mount
    if (currentUser?.fullName) {
      setForm(prev => ({ ...prev, host: currentUser.fullName }));
    }
  }, [currentUser]);

  // Helper: load all users from API
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiCall('/Auth/users', { method: 'GET' });
      // API might return array or wrapped object
      const users = Array.isArray(res) ? res : (res.value || res.data || res.users || []);
      setAllUsers(users);
      setMessage(`${users.length} users loaded`);
    } catch (err) {
      console.error('Load users error:', err);
      setMessage('❌ Lỗi tải danh sách user');
    } finally {
      setLoadingUsers(false);
      setTimeout(() => setMessage(''), 2500);
    }
  };

  // Toggle department checkbox
  const toggleDept = (deptId) => {
    setSelectedDeptIds(prev => {
      const s = new Set(prev);
      if (s.has(deptId)) s.delete(deptId);
      else s.add(deptId);
      return s;
    });
  };

  // Compute users belonging to currently selected departments
  const usersInSelectedDepts = useMemo(() => {
    if (!allUsers.length || selectedDeptIds.size === 0) return [];
    return allUsers.filter(u => selectedDeptIds.has(u.departmentId));
  }, [allUsers, selectedDeptIds]);

  // Add users from selected departments into participants list (deduplicate)
  const addParticipantsFromDepartments = () => {
    if (selectedDeptIds.size === 0) {
      setMessage('Vui lòng chọn ít nhất 1 department.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    const usersToAdd = usersInSelectedDepts.map(u => ({
      userId: u.userId ?? u.id,
      name: u.fullName ?? u.name ?? u.username,
      roleInMeeting: 'Member',
      departmentName: u.departmentName
    }));

    // ensure host is present (currentUser) and set host role
    const hostId = currentUser?.userId ?? currentUser?.userId;
    const hostEntry = hostId ? [{ userId: hostId, name: currentUser.fullName, roleInMeeting: 'Host', departmentId: currentUser.departmentId }] : [];

    // merge dedup
    const map = new Map();
    // add existing participants first
    participants.forEach(p => map.set(String(p.userId), p));
    // add host explicitly to ensure host role preserved
    hostEntry.forEach(h => map.set(String(h.userId), { ...h }));
    // add new users
    usersToAdd.forEach(u => {
      const key = String(u.userId);
      if (!map.has(key)) map.set(key, u);
      else {
        // if exists and is Host keep Host, otherwise keep existing
        const existing = map.get(key);
        if (existing.roleInMeeting !== 'Host' && u.roleInMeeting === 'Member') {
          map.set(key, existing);
        }
      }
    });

    const merged = Array.from(map.values());
    setParticipants(merged);
    setMessage(`${usersToAdd.length} users added from selected departments.`);
    setTimeout(() => setMessage(''), 2200);
  };

  // Remove a participant
  const removeParticipant = (userId) => {
    setParticipants(prev => prev.filter(p => String(p.userId) !== String(userId)));
  };

  // manual add (prompt) kept for convenience
  const manualAddParticipant = () => {
    const name = prompt('Enter participant full name:');
    if (!name) return;
    const userId = Date.now();
    setParticipants(prev => [...prev, { userId, name, roleInMeeting: 'Member', departmentId: null }]);
  };

  // handle form changes (host is disabled)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // file upload simple handler
  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      documents: [...prev.documents, { id: Date.now(), name: file.name, type, url, file }]
    }));
  };

  const removeDocument = (id) => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  // validate dmy date
  const isValidDmy = (dmy) => {
    if (!dmy) return false;
    const parts = dmy.split('/');
    if (parts.length !== 3) return false;
    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return false;
    const dt = new Date(yyyy, mm - 1, dd);
    return dt && dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd;
  };

  // helper to extract meetingId from createMeeting result
  const getMeetingIdFromCreateResult = (result) => {
    if (!result) return null;
    const data = result.data || result;
    if (!data) return null;
    return data.meetingId ?? data.id ?? data.meeting?.meetingId ?? data.meetingIdCreated ?? null;
  };

  // Save meeting -> create meeting -> post participants (single grouped request)
  const handleSave = async (asDraft = false) => {
    if (!form.title || !form.date || !form.time) {
      setMessage('Please fill required fields: Title, Date, Time');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    if (!isValidDmy(form.date)) {
      setMessage('Date must be in dd/mm/yyyy format');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setMessage('Creating meeting...');
    try {
      // prepare createMeeting payload to match your AppContext expectation
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        location: form.room,
        organizer: form.host,
        session: form.time.includes('AM') || parseInt(form.time.split(':')[0], 10) < 12 ? 'Buổi sáng' : 'Buổi chiều',
        status: asDraft ? 'not_started' : 'not_started',
        approved: !asDraft,
        participants: participants.map(p => ({ userId: p.userId, roleInMeeting: p.roleInMeeting })),
        documents: form.documents.map(d => ({ name: d.name, type: d.type }))
      };

      const createResult = await createMeeting(payload);
      if (!createResult || !createResult.success) {
        setMessage('❌ Failed to create meeting');
        return;
      }

      const meetingId = getMeetingIdFromCreateResult(createResult);
      // if createMeeting returned meeting object or id inside response.data
      // fallback: try to read createResult.data?.meetingId || createResult.data?.id
      if (!meetingId) {
        // try common places
        const r = createResult.data || createResult;
        const guessId = r?.meetingId ?? r?.id ?? r?.data?.meetingId ?? null;
        if (guessId) {
          // use guess
        }
      }

      // final attempt to extract
      const finalMeetingId = meetingId ?? (createResult.data && (createResult.data.meetingId || createResult.data.id)) ?? null;

      if (!finalMeetingId) {
        console.warn('Could not determine meetingId from create response', createResult);
        setMessage('⚠️ Meeting created but cannot determine meetingId to add participants. Please add participants later.');
        // still call onSave/onClose
        if (onSave) onSave();
        if (onClose) onClose();
        return;
      }

      // Prepare participants payload for POST /Participant/meeting/{meetingId}
      // The user requested option B: send one request with array of participants
      // Ensure host is included and marked as Host
      const hostUserId = currentUser?.userId ?? currentUser?.userId;
      const hostEntry = hostUserId ? [{ userId: hostUserId, roleInMeeting: 'Host' }] : [];

      // other participants as Member (exclude host if already present)
      const others = participants
        .filter(p => String(p.userId) !== String(hostUserId))
        .map(p => ({ userId: p.userId, roleInMeeting: p.roleInMeeting || 'Member' }));

      const finalParticipantsPayload = [...hostEntry, ...others];

      if (finalParticipantsPayload.length > 0) {
        setMessage('Adding participants to meeting...');
        try {
          const postRes = await apiCall(`/Participant/meeting/${finalMeetingId}/bulk`, {
            method: 'POST',
            body: JSON.stringify({ participants: finalParticipantsPayload }) 
          });
          setMessage('✅ Meeting created and participants added successfully');
        } catch (err) {
          console.error('Error adding participants:', err);
          setMessage('⚠️ Meeting created but failed to add participants.');
        }
      }


      // finalize
      if (onSave) onSave();
      // small delay for message UX
      setTimeout(() => {
        if (onClose) onClose();
      }, 800);

    } catch (err) {
      console.error('Create meeting error', err);
      setMessage('❌ Error creating meeting: ' + (err.message || err));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Create New Meeting</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" /> Save
          </button>

          <button
            onClick={() => handleSave(true)}
            className="bg-secondary hover:bg-secondary-dark text-text px-6 py-2 rounded-button font-semibold border border-secondary-dark transition-colors"
          >
            Save as Draft
          </button>

          <button
            onClick={onClose}
            className="bg-white hover:bg-secondary text-text px-6 py-2 rounded-button font-semibold border border-secondary-dark transition-colors flex items-center gap-2"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-button ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Sections navigation */}
      <div className="bg-white border border-secondary-dark rounded-lg mb-6">
        <div className="flex border-b border-secondary-dark overflow-x-auto">
          {['basic', 'participants', 'documents', 'voting', 'advanced'].map(key => (
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
          {/* BASIC */}
          {activeSection === 'basic' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Title <span className="text-primary">*</span></label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" placeholder="Enter meeting title" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-secondary-dark rounded-button" placeholder="Enter meeting description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Host</label>
                  <input name="host" value={form.host} disabled className="w-full px-4 py-2 border border-secondary-dark bg-gray-100 rounded-button" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Room</label>
                  <input name="room" value={form.room} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" placeholder="Enter room" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Date <span className="text-primary">*</span></label>
                  <input name="date" value={form.date} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" placeholder="dd/mm/yyyy" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Time <span className="text-primary">*</span></label>
                  <input name="time" value={form.time} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button" placeholder="HH:mm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-2 border border-secondary-dark rounded-button">
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          {activeSection === 'participants' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text">Participants</h3>
                <div className="flex items-center gap-2">
                  
                  <button onClick={loadAllUsers} className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-button">
                     Load Users
                  </button>
                </div>
              </div>

              {/* Departments multi-select */}
              <div className="bg-white border border-secondary-dark p-4 rounded-lg">
                <div className="mb-3 text-sm text-text-light">Select one or more departments to add all members at once</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto">
                  {departments.length === 0 && <div className="text-text-light">No departments loaded. Click "Load Users".</div>}
                  {departments.map(d => (
                    <label key={d.id} className="flex items-center gap-2 text-sm border p-2 rounded">
                      <input type="checkbox" checked={selectedDeptIds.has(d.id)} onChange={() => toggleDept(d.id)} />
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-text-light">ID: {d.id}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={addParticipantsFromDepartments} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-button">Add users from selected departments</button>
                  <div className="self-center text-sm text-text-light">Selected: {Array.from(selectedDeptIds).join(', ') || '-'}</div>
                </div>
              </div>

              {/* Preview users that would be added */}
              {selectedDeptIds.size > 0 && (
                <div className="bg-white border border-secondary-dark p-4 rounded-lg">
                  <div className="mb-2 font-medium">Users from selected departments ({usersInSelectedDepts.length})</div>
                  <div className="max-h-40 overflow-auto">
                    {usersInSelectedDepts.map(u => (
                      <div key={u.userId} className="flex items-center justify-between py-1 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{u.fullName}</div>
                          <div className="text-xs text-text-light">{u.username} • Dept: {u.departmentId}</div>
                        </div>
                        <div className="text-sm text-text-light">ID: {u.userId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current participants table */}
              <div>
                <div className="mb-2 font-medium">Participants to be added ({participants.length})</div>
                {participants.length === 0 ? (
                  <p className="text-text-light">No participants selected yet.</p>
                ) : (
                  <div className="bg-white border border-secondary-dark rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-dark">
                        {participants.map((p, idx) => (
                          <tr key={String(p.userId) + idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                            <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                            <td className="px-6 py-4 text-sm">{p.roleInMeeting}</td>
                            <td className="px-6 py-4 text-sm">{p.departmentName ?? '-'}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => removeParticipant(p.userId)} className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeSection === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Tài liệu được phát</label>
                  <div className="relative">
                    <input type="file" id="revUpload" className="hidden" onChange={(e) => handleFileUpload(e, 'rev')} />
                    <div className="flex">
                      <input readOnly value="" placeholder="Dán link hoặc bấm + để chọn file" className="w-full pr-12 px-4 py-2 border border-secondary-dark rounded-button" />
                      <button onClick={() => document.getElementById('revUpload').click()} className="ml-2 px-3 rounded bg-gray-100">+</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Tài liệu chuẩn bị</label>
                  <div className="relative">
                    <input type="file" id="preUpload" className="hidden" onChange={(e) => handleFileUpload(e, 'pre')} />
                    <div className="flex">
                      <input readOnly value="" placeholder="Dán link hoặc bấm + để chọn file" className="w-full pr-12 px-4 py-2 border border-secondary-dark rounded-button" />
                      <button onClick={() => document.getElementById('preUpload').click()} className="ml-2 px-3 rounded bg-gray-100">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {form.documents.length > 0 && (
                <div className="bg-white border border-secondary-dark rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-dark">
                      {form.documents.map((doc, idx) => (
                        <tr key={doc.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                          <td className="px-6 py-4 text-sm font-medium">{doc.name}</td>
                          <td className="px-6 py-4 text-sm">{doc.type}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => removeDocument(doc.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VOTING */}
          {activeSection === 'voting' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text">Voting Topics</h3>
                <button onClick={() => {
                  const t = prompt('Enter voting topic:');
                  if (t) setForm(prev => ({ ...prev, votingTopics: [...prev.votingTopics, { id: Date.now(), topic: t }] }));
                }} className="bg-primary text-white px-3 py-2 rounded-button">+ Add Topic</button>
              </div>

              {form.votingTopics.length === 0 ? <p className="text-text-light">No voting topics</p> : (
                <div className="space-y-2">
                  {form.votingTopics.map(v => (
                    <div key={v.id} className="p-3 bg-secondary rounded flex justify-between items-center">
                      <div>{v.topic}</div>
                      <button onClick={() => setForm(prev => ({ ...prev, votingTopics: prev.votingTopics.filter(x => x.id !== v.id) }))} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADVANCED */}
          {activeSection === 'advanced' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Send Notifications</div>
                  <div className="text-sm text-text-light">Notify participants about the meeting</div>
                </div>
                <input type="checkbox" name="notifications" checked={form.notifications} onChange={handleChange} />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Access Control</div>
                  <div className="text-sm text-text-light">Restrict access to authorized users only</div>
                </div>
                <input type="checkbox" name="accessControl" checked={form.accessControl} onChange={handleChange} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-secondary-dark sticky bottom-0 left-0 right-0 p-4 flex justify-end gap-3 shadow-lg mt-6">
        <button onClick={() => handleSave(false)} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button flex items-center gap-2"><Save className="w-5 h-5" /> Save & Create Meeting</button>
        <button onClick={() => handleSave(true)} className="bg-secondary hover:bg-secondary-dark text-text px-6 py-2 rounded-button border border-secondary-dark">Save as Draft</button>
        <button onClick={onClose} className="bg-white hover:bg-secondary text-text px-6 py-2 rounded-button border border-secondary-dark flex items-center gap-2"><X className="w-5 h-5" /> Cancel</button>
      </div>
    </div>
  );
};

export default CreateMeetingForm;
