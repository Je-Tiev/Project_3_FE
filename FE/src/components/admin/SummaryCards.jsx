import React from 'react';

const SummaryCards = ({ meetings }) => {
  const total = meetings.length;
  const upcoming = meetings.filter(m => m.status === 'not_started').length;
  const ongoing = meetings.filter(m => m.status === 'ongoing').length;
  const completed = meetings.filter(m => m.status === 'completed').length;

  const cards = [
    { label: 'Total Meetings', value: total, color: 'text-primary' },
    { label: 'Upcoming', value: upcoming, color: 'text-blue-600' },
    { label: 'Ongoing', value: ongoing, color: 'text-orange-600' },
    { label: 'Completed', value: completed, color: 'text-green-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm"
        >
          <p className="text-sm text-text-light mb-2">{card.label}</p>
          <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;

