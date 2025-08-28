import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  Plus, 
  Search, 
  Star, 
  ChevronDown, 
  CheckSquare, 
  Clock,
  FileText,
  Edit,
  MoreHorizontal,
  ArrowDownUp
} from 'lucide-react';

const PerformanceReviews = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    type: [],
    department: [],
    period: '',
  });

  // Sample review data
  const reviewData = [
    {
      id: 1,
      employeeName: "John Smith",
      employeeId: "EMP001",
      position: "Software Developer",
      department: "Engineering",
      manager: "Michael Wong",
      type: "Annual Performance Review",
      status: "Completed",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: "2025-08-12",
      overallRating: 4.2,
      cycle: "2025 Annual",
    },
    {
      id: 2,
      employeeName: "Sarah Johnson",
      employeeId: "EMP025",
      position: "Marketing Specialist",
      department: "Marketing",
      manager: "Lisa Chen",
      type: "Quarterly Review",
      status: "In Progress",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
    },
    {
      id: 3,
      employeeName: "David Rodriguez",
      employeeId: "EMP014",
      position: "Sales Representative",
      department: "Sales",
      manager: "Robert Johnson",
      type: "Annual Performance Review",
      status: "Pending Manager",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Annual",
    },
    {
      id: 4,
      employeeName: "Emily Davis",
      employeeId: "EMP032",
      position: "UX Designer",
      department: "Design",
      manager: "Michael Wong",
      type: "Quarterly Review",
      status: "Draft",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
    },
    {
      id: 5,
      employeeName: "James Wilson",
      employeeId: "EMP017",
      position: "Product Manager",
      department: "Product",
      manager: "Lisa Chen",
      type: "Annual Performance Review",
      status: "Completed",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: "2025-08-10",
      overallRating: 4.7,
      cycle: "2025 Annual",
    },
    {
      id: 6,
      employeeName: "Linda Martinez",
      employeeId: "EMP028",
      position: "Customer Support Specialist",
      department: "Support",
      manager: "Robert Johnson",
      type: "Quarterly Review",
      status: "Pending Employee",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
    },
  ];

  // Filter reviews based on active tab and search query
  const filteredReviews = reviewData.filter(review => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'inProgress' && review.status === 'In Progress') ||
      (activeTab === 'pending' && (review.status === 'Pending Manager' || review.status === 'Pending Employee')) ||
      (activeTab === 'completed' && review.status === 'Completed') ||
      (activeTab === 'draft' && review.status === 'Draft');

    const matchesSearch = 
      review.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    // Check if review matches selected filters
    const matchesStatus = selectedFilters.status.length === 0 || 
                         selectedFilters.status.includes(review.status);
    const matchesType = selectedFilters.type.length === 0 || 
                       selectedFilters.type.includes(review.type);
    const matchesDepartment = selectedFilters.department.length === 0 || 
                            selectedFilters.department.includes(review.department);
    const matchesPeriod = !selectedFilters.period || 
                         review.cycle.includes(selectedFilters.period);

    return matchesTab && matchesSearch && matchesStatus && 
           matchesType && matchesDepartment && matchesPeriod;
  });

  // Helper function to get appropriate status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending Manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Employee':
        return 'bg-purple-100 text-purple-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'period') {
        newFilters.period = value;
      } else {
        if (newFilters[filterType].includes(value)) {
          newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
        } else {
          newFilters[filterType] = [...newFilters[filterType], value];
        }
      }
      
      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      status: [],
      type: [],
      department: [],
      period: '',
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600">Manage and track employee performance evaluations</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Review</span>
        </button>
      </div>

      {/* Tabs and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setActiveTab('inProgress')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'inProgress'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'completed'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'draft'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64"
                placeholder="Search employee or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={`border ${showFilters ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} rounded-lg px-3 py-2 flex items-center gap-2`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Filters</h3>
              <button
                className="text-sm text-indigo-600 hover:text-indigo-800"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-1">
                  {['Completed', 'In Progress', 'Pending Manager', 'Pending Employee', 'Draft'].map(status => (
                    <div key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`status-${status}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.status.includes(status)}
                        onChange={() => handleFilterChange('status', status)}
                      />
                      <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Type
                </label>
                <div className="space-y-1">
                  {['Annual Performance Review', 'Quarterly Review', 'Probation Review'].map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.type.includes(type)}
                        onChange={() => handleFilterChange('type', type)}
                      />
                      <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <div className="space-y-1">
                  {['Engineering', 'Marketing', 'Sales', 'Design', 'Product', 'Support'].map(dept => (
                    <div key={dept} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`dept-${dept}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.department.includes(dept)}
                        onChange={() => handleFilterChange('department', dept)}
                      />
                      <label htmlFor={`dept-${dept}`} className="ml-2 text-sm text-gray-700">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Period
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedFilters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                >
                  <option value="">All Periods</option>
                  <option value="2025 Annual">2025 Annual</option>
                  <option value="2025 Q3">2025 Q3</option>
                  <option value="2025 Q2">2025 Q2</option>
                  <option value="2025 Q1">2025 Q1</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Employee
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Department
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Review Type
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Cycle
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Due Date
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Rating
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.employeeName}</div>
                        <div className="text-xs text-gray-500">{review.position}</div>
                        <div className="text-xs text-gray-400">ID: {review.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.cycle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(review.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.overallRating ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" fill="currentColor" />
                          <span className="text-sm font-medium text-gray-800">{review.overallRating}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 p-1">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 p-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-lg font-medium text-gray-600">No reviews found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredReviews.length}</span> of{" "}
                <span className="font-medium">{filteredReviews.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-5 w-5 transform rotate-90" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-indigo-500 bg-indigo-50 text-sm font-medium text-indigo-600">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-5 w-5 transform -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">In Progress</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'In Progress').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pending Approval</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Pending Manager' || r.status === 'Pending Employee').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Completed').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Draft</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Draft').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReviews;
