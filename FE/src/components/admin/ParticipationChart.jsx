import React from 'react';
import { TrendingDown } from 'lucide-react';

const ParticipationChart = () => {
  const rate = 82; // Mock data
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-text mb-4">Participation Rate</h2>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="#d32f2f"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-text">{rate}%</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-semibold">-2%</span>
          <span className="text-sm text-gray-600">This month</span>
        </div>
      </div>
    </div>
  );
};

export default ParticipationChart;

