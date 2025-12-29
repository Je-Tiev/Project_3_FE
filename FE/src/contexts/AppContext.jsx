import { File } from 'lucide-react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { parseDmyToDate } from '../utils/dateUtils';
import { apiCall } from '../utils/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  });

  const [deviceStatus, setDeviceStatus] = useState('ready');
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('not_started');
  const [searchFilters, setSearchFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    filterOption: 'all'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      if (meetings.length > 0) {
        localStorage.setItem('meetings', JSON.stringify(meetings));
      }
    } catch {}
  }, [meetings]);

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await apiCall('/Meetings', { method: 'GET' });
      const meetingsList = response.value || response || [];
      
      const convertedMeetings = meetingsList.map(m => {
        const startDate = new Date(m.startTime);
        const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][startDate.getDay()];
        return {
          id: m.meetingId,
          meetingId: m.meetingId,
          title: m.title,
          description: m.description || '',
          startTime: m.startTime,
          endTime: m.endTime,
          location: m.location || '',
          status: ['not_started', 'ongoing', 'completed', 'postponed'][m.status] || 'not_started',
          date: startDate.toLocaleDateString('vi-VN'),
          dayOfWeek: dayOfWeek,
          session: startDate.getHours() < 12 ? 'Buổi sáng' : 'Buổi chiều',
          time: startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          file_rev: m.file_rev || '',
          file_rev_url: m.file_rev_url || '',
          file_pre: m.file_pre || '',
          file_pre_url: m.file_pre_url || '',
          approved: m.status === 0,
        };
      });
      setMeetings(convertedMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        fetchMeetings();
      } catch (e) {
        console.error('Invalid user data:', e);
        logout();
      }
    }
  }, [fetchMeetings]);

  const login = async (username, password) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      const user = {
        username: response.username,
        role: response.role,
        fullName: response.fullName,
        userId: response.userId
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      await fetchMeetings();
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentMeeting(null);
    setDeviceStatus('ready');
    setMeetings([]);
  };

  const startMeeting = (meeting) => {
    setCurrentMeeting(meeting);
    setDeviceStatus('in_meeting');
  };

  const endMeeting = () => {
    setCurrentMeeting(null);
    setDeviceStatus('ready');
  };

  const createMeeting = async (payload) => {
    try {
      if (!payload.startTime || !payload.endTime) {
        throw new Error('Missing startTime or endTime');
    }
      
      const meetingData = {
        title: payload.title,
        description: payload.description || '',
        startTime: payload.startTime, // ISO đã chuẩn
        endTime: payload.endTime,
        location: payload.location || '',
        participants: payload.participants || []
      };
      
      const response = await apiCall('/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData)
      });
      
      await fetchMeetings();
      return { success: true, data: response };
    } catch (error) {
      console.error('Error creating meeting:', error);
      return { success: false, error: error.message };
    }
  };

  const updateSearchFilters = (filters) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
  };

  const getFilteredMeetings = useCallback(() => {
    const start = parseDmyToDate(searchFilters.startDate);
    const end = parseDmyToDate(searchFilters.endDate);
    const endOfDay = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : null;

    return meetings.filter(meeting => {
      if (activeTab !== 'all' && meeting.status !== activeTab) {
        return false;
      }
      if (searchFilters.filterOption === 'approved' && !meeting.approved) {
        return false;
      }
      if (searchFilters.filterOption === 'pending' && meeting.approved) {
        return false;
      }
      const mDate = parseDmyToDate(meeting.date);
      if (!mDate) return false;
      if (start && mDate < start) return false;
      if (endOfDay && mDate > endOfDay) return false;
      return true;
    });
  }, [meetings, activeTab, searchFilters]);

  const value = {
    isAuthenticated,
    currentUser,
    deviceStatus,
    currentMeeting,
    meetings,
    currentTime,
    activeTab,
    setActiveTab,
    searchFilters,
    updateSearchFilters,
    getFilteredMeetings,
    createMeeting,
    fetchMeetings,
    login,
    logout,
    startMeeting,
    endMeeting
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};