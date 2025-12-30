// src/components/PollsPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../utils/api';
import { BarChart2, X, Check, Plus, Clock, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function PollsPanel({ meetingId, onClose }) {
  const { currentUser } = useApp();
  const [activePoll, setActivePoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [votedPolls, setVotedPolls] = useState({});
  const hubConnectionRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Load voted polls from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`votedPolls_${meetingId}`);
    if (saved) {
      try {
        setVotedPolls(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing voted polls:', e);
      }
    }
  }, [meetingId]);

  // ✅ SignalR listeners - MATCHING BACKEND
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const existingConnection = window.meetingHubConnection;
        
        if (existingConnection) {
          hubConnectionRef.current = existingConnection;
          
          // ✅ Backend sends "ReceiveNewPoll"
          existingConnection.on('ReceiveNewPoll', (poll) => {
            console.log('📊 New poll received:', poll);
            localStorage.setItem(`activePoll_${meetingId}`, poll.pollId);
            setActivePoll(poll);
          });
          
          // ✅ Backend sends "UpdatePollStats"
          existingConnection.on('UpdatePollStats', (updatedPoll) => {
            console.log('🗳️ Poll stats updated:', updatedPoll);
            setActivePoll(updatedPoll);
          });
          
          // ✅ Backend sends "PollClosed"
          existingConnection.on('PollClosed', (data) => {
            console.log('🔒 Poll closed:', data);
            setActivePoll(prev => 
              prev?.pollId === data.pollId 
                ? { ...prev, status: 'Closed' }
                : prev
            );
          });
        }
      } catch (error) {
        console.error('SignalR setup error:', error);
      }
    };

    setupSignalR();

    return () => {
      if (hubConnectionRef.current) {
        hubConnectionRef.current.off('ReceiveNewPoll');
        hubConnectionRef.current.off('UpdatePollStats');
        hubConnectionRef.current.off('PollClosed');
      }
    };
  }, [meetingId]);

  // ✅ Fetch active poll with polling (since no GET by meeting endpoint)
  useEffect(() => {
    fetchActivePoll();
    
    // Poll every 5 seconds to sync
    pollIntervalRef.current = setInterval(() => {
      fetchActivePoll();
    }, 5000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [meetingId]);

  const fetchActivePoll = async () => {
    try {
      const savedPollId = localStorage.getItem(`activePoll_${meetingId}`);
      
      if (savedPollId) {
        const response = await apiCall(`/Polls/${savedPollId}`, {
          method: 'GET'
        });
        
        // Only show if still Open
        if (response.status === 'Open') {
          setActivePoll(response);
        } else {
          setActivePoll(null);
          localStorage.removeItem(`activePoll_${meetingId}`);
        }
      }
    } catch (error) {
      if (!error.message?.includes('404')) {
        console.error('Error fetching poll:', error);
      }
    }
  };

  const handleCreatePoll = async () => {
    if (!newQuestion.trim()) {
      alert('Vui lòng nhập câu hỏi!');
      return;
    }

    try {
      const response = await apiCall('/Polls', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: parseInt(meetingId),
          question: newQuestion
        })
      });

      console.log('✅ Poll created:', response);
      
      localStorage.setItem(`activePoll_${meetingId}`, response.pollId);
      
      setNewQuestion('');
      setShowCreateForm(false);
      setActivePoll(response);
    } catch (error) {
      console.error('❌ Error creating poll:', error);
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        alert('Bạn không có quyền tạo biểu quyết!\nChỉ Admin mới có thể tạo poll.');
      } else {
        alert(error.message || 'Không thể tạo poll!');
      }
    }
  };

  const handleVote = async (pollId, choice) => {
    try {
      await apiCall(`/Polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ choice })
      });

      console.log('✅ Vote submitted');
      
      // Mark as voted locally
      const newVotedPolls = {
        ...votedPolls,
        [pollId]: choice
      };
      setVotedPolls(newVotedPolls);
      localStorage.setItem(`votedPolls_${meetingId}`, JSON.stringify(newVotedPolls));
      
      // Refresh poll data
      setTimeout(fetchActivePoll, 500);
    } catch (error) {
      console.error('❌ Error voting:', error);
      alert(error.message || 'Không thể vote!');
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Đóng poll này?')) return;

    try {
      await apiCall(`/Polls/${pollId}/close`, {
        method: 'PUT'
      });

      console.log('✅ Poll closed');
      fetchActivePoll();
    } catch (error) {
      console.error('❌ Error closing poll:', error);
      alert('Không thể đóng poll!');
    }
  };

  const hasVoted = activePoll && votedPolls[activePoll.pollId] !== undefined;
  const userVote = activePoll ? votedPolls[activePoll.pollId] : null;
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-40 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center">
          <BarChart2 className="mr-2" size={20} />
          Biểu quyết
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        
        {/* Create Poll Button - Only for Admin */}
        {isAdmin && !showCreateForm && !activePoll && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Tạo biểu quyết mới
          </button>
        )}

        {/* Create Poll Form */}
        {showCreateForm && (
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Tạo biểu quyết</h3>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Nhập câu hỏi biểu quyết..."
              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white"
              rows="3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePoll}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Tạo
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewQuestion('');
                }}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Active Poll */}
        {loading && !activePoll ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-400">Đang tải...</p>
          </div>
        ) : activePoll ? (
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{activePoll.question}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={14} />
                  <span>{activePoll.status === 'Open' ? 'Đang diễn ra' : 'Đã đóng'}</span>
                </div>
              </div>
            </div>

            {/* Vote Buttons */}
            {activePoll.status === 'Open' && !hasVoted ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleVote(activePoll.pollId, true)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Check size={20} />
                  Đồng ý
                </button>
                <button
                  onClick={() => handleVote(activePoll.pollId, false)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle size={20} />
                  Không đồng ý
                </button>
              </div>
            ) : hasVoted ? (
              <div className="text-center py-2 bg-gray-600 rounded-lg">
                <Check size={24} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-gray-300">
                  Bạn đã vote: <span className="font-semibold">
                    {userVote ? 'Đồng ý' : 'Không đồng ý'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-center py-2 bg-gray-600 rounded-lg">
                <p className="text-sm text-gray-300">Poll đã đóng</p>
              </div>
            )}

            {/* Results */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Đồng ý</span>
                  <span className="text-sm font-bold text-green-400">
                    {activePoll.yesVotes || 0} phiếu
                  </span>
                </div>
                <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${
                        activePoll.totalVotes > 0
                          ? ((activePoll.yesVotes || 0) / activePoll.totalVotes) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Không đồng ý</span>
                  <span className="text-sm font-bold text-red-400">
                    {activePoll.noVotes || 0} phiếu
                  </span>
                </div>
                <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${
                        activePoll.totalVotes > 0
                          ? ((activePoll.noVotes || 0) / activePoll.totalVotes) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-600">
                Tổng số phiếu: <span className="font-semibold">{activePoll.totalVotes || 0}</span>
              </div>
            </div>

            {/* Close Poll Button (Admin only) */}
            {isAdmin && activePoll.status === 'Open' && (
              <button
                onClick={() => handleClosePoll(activePoll.pollId)}
                className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
              >
                Đóng biểu quyết
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart2 size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">Chưa có biểu quyết nào</p>
          </div>
        )}
      </div>
    </div>
  );
}