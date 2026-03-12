import React, { useState } from "react";
import { X, User, Search, ChevronLeft, ChevronRight } from "lucide-react";

const SelectedEmployeesModal = ({ 
  isOpen, 
  onClose, 
  selectedEmployees = [], 
  allEmployees = [], 
  onRemoveEmployee,
  companyName = "",
  departmentName = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 8;

  if (!isOpen) return null;

  // Get employee details for selected IDs
  const selectedEmployeeDetails = selectedEmployees
    .map(id => allEmployees.find(emp => String(emp.id) === String(id)))
    .filter(Boolean); // Remove any undefined entries

  // Filter employees based on search
  const filteredEmployees = selectedEmployeeDetails.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(searchLower) ||
      emp.department.toLowerCase().includes(searchLower) ||
      String(emp.id).toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const startIndex = (currentPage - 1) * employeesPerPage;
  const endIndex = startIndex + employeesPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRemove = (employeeId) => {
    onRemoveEmployee(employeeId);
    // Reset to first page if current page becomes empty
    if (currentEmployees.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Selected Employees</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
              {companyName && (
                <span className="text-indigo-600 font-medium"> from {companyName}</span>
              )}
              {departmentName && (
                <span className="text-indigo-600 font-medium"> / {departmentName}</span>
              )}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search selected employees..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Employee List */}
        <div className="p-4">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching employees' : 'No employees selected'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding employees to your KPI assignment'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Employee Grid */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentEmployees.map((employee) => (
                  <div 
                    key={employee.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>ID: {employee.id}</span>
                          <span>•</span>
                          <span className="truncate">{employee.department}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(employee.id)}
                      className="ml-3 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-600">
            Total: {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} assigned
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedEmployeesModal;