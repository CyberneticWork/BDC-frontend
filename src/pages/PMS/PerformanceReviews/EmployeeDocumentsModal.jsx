import React, { useState, useEffect } from 'react';
import { X, Download, User, Calendar, File, Loader2, BarChart } from 'lucide-react';
import PMSService from "@services/PMS/PMSService";

const EmployeeDocumentsModal = ({ isOpen, onClose, review, useDatabase = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // Fetch documents when modal opens
  useEffect(() => {
    if (isOpen && review && review.id) {
      fetchDocumentsFromDatabase();
    } else {
      setDocuments([]);
    }
  }, [isOpen, review]);

  const fetchDocumentsFromDatabase = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await PMSService.getAssignmentDocuments(review.id);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Filter documents based on search term and active filter
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.note && doc.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(doc.date) >= oneWeekAgo;
    }
    return matchesSearch;
  });

  // Helper to get file icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return '📷';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    return '📁';
  };

  // Generate sample content based on document type
  const generateSampleContent = (document) => {
    const fileType = document.documentType || '';
    
    if (fileType.includes('image')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#f0f0f0"/>
        <text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle">
          ${document.documentName} - Placeholder Image
        </text>
        <text x="400" y="340" font-family="Arial" font-size="18" text-anchor="middle">
          Document submitted by ${document.author} on ${new Date(document.date).toLocaleDateString()}
        </text>
      </svg>`;
    } 
    
    if (fileType.includes('pdf')) {
      return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 90 >>
stream
BT
/F1 24 Tf
100 700 Td
(${document.documentName} - Sample PDF) Tj
/F1 12 Tf
0 -50 Td
(Document submitted by ${document.author}) Tj
0 -20 Td
(Date: ${new Date(document.date).toLocaleDateString()}) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000251 00000 n
0000000391 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
458
%%EOF`;
    }
    
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return `ID,Name,Date,Progress
1,${document.documentName},${new Date(document.date).toLocaleDateString()},${document.progressPercentage || 'N/A'}
2,Task Progress,${new Date().toLocaleDateString()},Sample Data
3,KPI Update,${new Date().toLocaleDateString()},Sample Data`;
    }
    
    return `${document.documentName}
    
Submitted by: ${document.author}
Date: ${new Date(document.date).toLocaleDateString()}
Progress: ${document.progressPercentage || 'N/A'}%

${document.note || 'No additional notes provided.'}

This is a sample document generated for demonstration purposes.
In a real application, this would be the actual file content uploaded by the employee.`;
  };

  // Download function that creates and downloads a file
  const handleDownload = (document) => {
    setIsLoading(true);
    setDownloadingId(document.documentName);
    
    setTimeout(() => {
      try {
        const content = generateSampleContent(document);
        let mimeType = 'text/plain';
        let fileExtension = '.txt';
        
        if (document.documentType?.includes('pdf')) {
          mimeType = 'application/pdf';
          fileExtension = '.pdf';
        } else if (document.documentType?.includes('image')) {
          mimeType = 'image/svg+xml';
          fileExtension = '.svg';
        } else if (document.documentType?.includes('spreadsheet') || document.documentType?.includes('excel')) {
          mimeType = 'text/csv';
          fileExtension = '.csv';
        } else if (document.documentType?.includes('word') || document.documentType?.includes('document')) {
          mimeType = 'application/msword';
          fileExtension = '.doc';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const safeName = document.documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeName}${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Error downloading document:', error);
        alert('Failed to download the document. Please try again.');
      } finally {
        setIsLoading(false);
        setDownloadingId(null);
      }
    }, 800);
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submitted Documents</h2>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{review.employeeName}</span> • {review.position || 'Employee'}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ✓ Database Data • Assignment ID: {review.id}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <File className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Task: {review.taskName}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Documents from database task progress submissions
                </p>
                {review.selfReportedLastUpdated && (
                  <p className="text-xs text-indigo-600 mt-2">
                    Last update: {new Date(review.selfReportedLastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-2 rounded-lg text-sm font-medium ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('all')}
              >
                All Documents
              </button>
              <button 
                className={`px-3 py-2 rounded-lg text-sm font-medium ${activeFilter === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('recent')}
              >
                Recent (7 days)
              </button>
            </div>
          </div>

          {isLoadingDocs ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((doc, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                      <span className="text-2xl">{getFileIcon(doc.documentType)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 truncate">{doc.documentName}</h4>
                          <p className="text-sm text-gray-500">{doc.documentSize}</p>
                        </div>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                          disabled={isLoading && downloadingId === doc.documentName}
                        >
                          {isLoading && downloadingId === doc.documentName ? (
                            <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>Submitted by {doc.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{new Date(doc.date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {doc.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-700">{doc.note}</p>
                    </div>
                  )}
                  
                  {doc.progressPercentage !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 flex items-center gap-1">
                          <BarChart className="h-3 w-3 text-gray-400" />
                          Progress at submission:
                        </span>
                        <span className="font-medium text-indigo-600">{doc.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            doc.progressPercentage < 30 ? 'bg-red-500' : 
                            doc.progressPercentage < 70 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${doc.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <File className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? 'No documents match your search criteria.' : 'No documents have been submitted for this assignment yet.'}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocumentsModal;