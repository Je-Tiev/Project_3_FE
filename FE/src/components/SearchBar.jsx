import React from 'react';
import { useApp } from '../contexts/AppContext';

const SearchBar = () => {
  const { searchFilters, updateSearchFilters } = useApp();

  const handleSearch = () => {
    console.log('Searching with filters:', searchFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            value={searchFilters.startDate}
            onChange={(e) => updateSearchFilters({ startDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            placeholder="Từ ngày"
          />
        </div>
        <div>
          <input
            type="text"
            value={searchFilters.endDate}
            onChange={(e) => updateSearchFilters({ endDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            placeholder="Đến ngày"
          />
        </div>
        <div>
          <select
            value={searchFilters.filterOption}
            onChange={(e) => updateSearchFilters({ filterOption: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="all">Tất cả</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
        <div>
          <button 
            onClick={handleSearch}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;