// src/components/PollNotification.jsx
import React, { useEffect, useState } from 'react';
import { BarChart2, X } from 'lucide-react';

export default function PollNotification({ poll, onOpen, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification
    setIsVisible(true);

    // Auto dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [poll]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for animation
  };

  const handleOpen = () => {
    setIsVisible(false);
    setTimeout(() => {
      onOpen();
    }, 300);
  };

  if (!poll) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="bg-white/20 p-2 rounded-lg">
            <BarChart2 size={24} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              Biểu quyết mới!
            </h3>
            <p className="text-sm text-blue-100 mb-3 line-clamp-2">
              {poll.question}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleOpen}
                className="flex-1 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Vote ngay
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}