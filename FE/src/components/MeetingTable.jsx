import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { apiCall } from '../utils/api';

const MeetingTable = () => {
  const { getFilteredMeetings, fetchMeetings, meetings, searchFilters, activeTab } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // const handleJoinMeeting = async (e, meetingId) => {
  //   e.preventDefault(); //  chặn Link tự điều hướng

  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) throw new Error("Bạn chưa đăng nhập.");

  //     // GỌI API JOIN
  //     const joinInfo = await apiCall(`/Meetings/join/${meetingId}`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       }
  //     });

  //     // Lưu joinInfo
  //     sessionStorage.setItem(`joinInfo_${meetingId}`, JSON.stringify(joinInfo));

  //     // Điều hướng thủ công
  //     navigate(`/meeting/${meetingId}`, {
  //       state: { joinInfo }
  //     });

  //   } catch (err) {
  //     console.error(err);
  //     alert(err.message || "Không thể tham gia cuộc họp.");
  //   }
  // };

  // Tải dữ liệu cuộc họp khi component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchMeetings();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Lấy danh sách cuộc họp đã lọc
  const filteredMeetings = getFilteredMeetings();

  // // Debug log
  // useEffect(() => {
  //   console.log('Dữ liệu cuộc họp:', filteredMeetings.length, 'item(s)');
  //   console.log('Chi tiết:', filteredMeetings);
  // }, [filteredMeetings.length]);

  const getStatusBadge = (meeting) => {
    if (meeting.approved) {
      return (
        <span className="inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
          ✓ ĐÃ HỌP
        </span>
      );
    }

    return (
      <button
        onClick={() => navigate(`/meeting/${meeting.id}/prejoin`)}
        className="inline-flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
      >
        ▶ Tham gia
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!filteredMeetings || filteredMeetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Không có cuộc họp nào trong khoảng thời gian này</p>
        <p className="text-xs text-gray-400 mt-2">
          Tổng số cuộc họp: {meetings.length} |
          Đang filter: {searchFilters.startDate} - {searchFilters.endDate} |
          Tab: {activeTab}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Ngày</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Thời gian</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Giờ</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Nội dung</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Tài liệu cuộc họp</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.map((meeting, index) => (
              <tr
                key={meeting.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition-all cursor-pointer`}
                onClick={() => navigate(`/meeting/${meeting.id}/prejoin`)}  // ← Click row để vào meeting
              >
                <td className="px-4 py-4 text-sm">
                  <div>{meeting.dayOfWeek},</div>
                  <div>{meeting.date}</div>
                </td>
                <td className="px-4 py-4 text-sm">{meeting.session}</td>
                <td className="px-4 py-4 text-sm font-semibold">{meeting.time}</td>
                <td className="px-4 py-4 text-sm">
                  {meeting.title}
                </td>
                <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/meeting/${meeting.id}/documents`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <FileText size={16} />
                    <span>Xem tài liệu</span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(meeting)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeetingTable;