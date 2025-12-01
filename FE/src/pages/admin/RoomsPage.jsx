import React, { useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';

const RoomsPage = () => {
  const [rooms] = useState([
    { id: 1, name: 'Conference Room A', status: 'Available', currentUser: '-', upcoming: '2 meetings today' },
    { id: 2, name: 'Meeting Room 3', status: 'In Use', currentUser: 'John Doe', upcoming: '1 meeting in 30min' },
    { id: 3, name: 'Boardroom', status: 'Available', currentUser: '-', upcoming: 'No upcoming meetings' }
  ]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Rooms</h1>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Create New Room
        </button>
      </div>

      <div className="bg-white border border-secondary-dark rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Room Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Current User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Upcoming Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark">
              {rooms.map((room, index) => (
                <tr key={room.id} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                  <td className="px-6 py-4 text-sm text-text font-medium">{room.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text">{room.currentUser}</td>
                  <td className="px-6 py-4 text-sm text-text-light">{room.upcoming}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-primary hover:bg-secondary rounded-button transition-colors" title="View History">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-secondary rounded-button transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;

