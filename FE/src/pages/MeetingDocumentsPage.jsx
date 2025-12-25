import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, FileText, Download, Eye, File } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function MeetingDocumentsPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { meetings, currentUser } = useApp();
  
  const [meeting, setMeeting] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5075/api';

  useEffect(() => {
    const foundMeeting = meetings.find(m => `${m.id}` === `${meetingId}`);
    if (foundMeeting) {
      setMeeting(foundMeeting);
      fetchDocuments(meetingId);
    } else {
      navigate('/');
    }
  }, [meetingId, meetings, navigate]);

  const fetchDocuments = async (meetingId) => {
    setLoadingDocs(true);
    try {
      const response = await apiCall(
        `/Document/GetDocumentsByMeeting/meeting/${meetingId}`,
        { method: 'GET' }
      );
      const docs = Array.isArray(response) ? response : [];
      setDocuments(docs);
    } catch (error) {
      console.error('Lỗi tải documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/Document/DownloadDocument/${documentId}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Không thể tải file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Lỗi xem file:', error);
      alert('Không thể xem file!');
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/Document/DownloadDocument/${documentId}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Không thể tải file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi download:', error);
      alert('Không thể tải file!');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const iconClass = "w-5 h-5";
    if (['pdf'].includes(ext)) return <File className={`${iconClass} text-red-600`} />;
    if (['doc', 'docx'].includes(ext)) return <File className={`${iconClass} text-blue-600`} />;
    if (['xls', 'xlsx'].includes(ext)) return <File className={`${iconClass} text-green-600`} />;
    if (['ppt', 'pptx'].includes(ext)) return <File className={`${iconClass} text-orange-600`} />;
    return <FileText className={`${iconClass} text-gray-600`} />;
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="hover:bg-red-700 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold">{meeting.title}</h1>
                <p className="text-sm text-red-100">
                  {meeting.dayOfWeek}, {meeting.date} - {meeting.time}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{currentUser?.fullName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="mr-3" size={28} />
              Tài liệu cuộc họp
            </h2>

            {loadingDocs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getFileIcon(doc.fileName)}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-medium text-gray-800 truncate">
                            {doc.fileName}
                          </p>
                          <div className="flex items-center space-x-3 mt-2">
                            {doc.visibility && (
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  doc.visibility === 'Chung'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {doc.visibility}
                              </span>
                            )}
                            {doc.uploadDate && (
                              <p className="text-sm text-gray-500">
                                {new Date(doc.uploadDate).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 ml-4">
                        <button
                          onClick={() => handleViewDocument(doc.documentId, doc.fileName)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                          title="Xem"
                        >
                          <Eye size={18} />
                          Xem
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.documentId, doc.fileName)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                          title="Tải xuống"
                        >
                          <Download size={18} />
                          Tải
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Chưa có tài liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}