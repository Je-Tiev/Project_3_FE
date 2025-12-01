import React from 'react';

const MeetingsChart = ({ meetings }) => {
  // Tính số cuộc họp theo ngày trong tuần
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const meetingsByDay = days.map(() => Math.floor(Math.random() * 20) + 5); // Mock data

  const maxValue = Math.max(...meetingsByDay);

  return (
    <div className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-text mb-4">Meetings per week</h2>
      <div className="flex items-end justify-between h-64 gap-2">
        {meetingsByDay.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col justify-end h-full">
                <div
                  className="w-full bg-pink-300 rounded-t transition-all hover:bg-pink-400 cursor-pointer"
                  style={{ height: `${(value / maxValue) * 100}%`, minHeight: '20px' }}
                  title={`${value} meetings`}
                />
              </div>
              <span className="text-xs text-gray-600 mt-2">{days[index]}</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingsChart;

