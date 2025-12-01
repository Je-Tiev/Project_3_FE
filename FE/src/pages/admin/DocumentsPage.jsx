import React, { useState } from 'react';
import { Eye, FileText, Download, Plus } from 'lucide-react';

const DocumentsPage = () => {
  const [documents] = useState([
    { id: 1, name: 'Meeting_Agenda_2024.pdf', meeting: 'Cuộc họp kiểm thử 4', uploadedBy: 'Admin', date: '07/11/2024', notes: '' },
    { id: 2, name: 'Report_Q4.pdf', meeting: 'Họp Ban Thường vụ', uploadedBy: 'User', date: '08/11/2024', notes: 'Important document' }
  ]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Documents</h1>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Upload New Document
        </button>
      </div>

      <div className="bg-white border border-secondary-dark rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Related Meeting</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark">
              {documents.map((doc, index) => (
                <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                  <td className="px-6 py-4 text-sm text-text font-medium">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-text">{doc.meeting}</td>
                  <td className="px-6 py-4 text-sm text-text">{doc.uploadedBy}</td>
                  <td className="px-6 py-4 text-sm text-text">{doc.date}</td>
                  <td className="px-6 py-4 text-sm text-text-light">{doc.notes || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-primary hover:bg-secondary rounded-button transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-primary hover:bg-secondary rounded-button transition-colors" title="Add Note">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-primary hover:bg-secondary rounded-button transition-colors" title="Download">
                        <Download className="w-4 h-4" />
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

export default DocumentsPage;

