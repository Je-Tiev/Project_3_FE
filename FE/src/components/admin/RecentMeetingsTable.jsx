import React from 'react';

const RecentMeetingsTable = ({ meetings = [], onViewMeeting, onMeetingClick }) => {
  // Lấy 5 cuộc họp gần nhất
  const recentMeetings = meetings.slice(0, 5);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' },
      ongoing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ongoing' },
      canceled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Canceled' },
      not_started: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' }
    };

    const config = statusConfig[status] || statusConfig.upcoming;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white border border-secondary-dark rounded-lg shadow-sm">
      <div className="p-6 border-b border-secondary-dark flex justify-between items-center">
        <h2 className="text-xl font-bold text-text">Recent Meetings</h2>
        <button
          onClick={onViewMeeting}
          className="text-primary hover:text-primary-dark font-semibold text-sm transition-colors"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">DATE</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">TIME</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">ROOM</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">HOST</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">STATUS</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-secondary-dark">
              {recentMeetings.map((meeting, index) => (
                <tr
                  key={meeting.id}
                  onClick={() => onMeetingClick && onMeetingClick(meeting.id)}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-secondary'} cursor-pointer hover:bg-primary/10 transition-colors`}
                >
                  <td className="px-6 py-4 text-sm text-text">{meeting.date}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.time}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.location || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.organizer || 'N/A'}</td>
                  <td className="px-6 py-4">{getStatusBadge(meeting.status)}</td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentMeetingsTable;

