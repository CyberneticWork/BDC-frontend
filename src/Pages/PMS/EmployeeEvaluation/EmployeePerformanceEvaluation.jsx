import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  User, 
  BarChart2,
  ArrowUpRight, 
  X,
  Loader2,
  ChevronDown,
  FileText,
  Award
} from "lucide-react";
import PMSDummyDataStore from "@services/PMS/PMSDummyDataStore";

const EmployeePerformanceEvaluation = () => {
  // States for filtering and data
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDetails, setViewDetails] = useState(false);
  
  // Fetch employees on mount
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    // Using dummy data for now
    const dummyEmployees = [
      { id: "1", name: "Sarah Johnson", department: "Customer Service" },
      { id: "2", name: "Mike Chen", department: "Sales" },
      { id: "3", name: "Emma Davis", department: "Design" },
      { id: "4", name: "John Smith", department: "Engineering" }
    ];
    setEmployees(dummyEmployees);
  }, []);
  
  // Function to get grade from percentage
  const getGrade = (percentage) => {
    if (percentage >= 81) return { grade: "A+", label: "Excellent" };
    if (percentage >= 61) return { grade: "A", label: "Above Average" };
    if (percentage >= 41) return { grade: "B", label: "Average" };
    if (percentage >= 21) return { grade: "B-", label: "Below Average" };
    return { grade: "C", label: "Poor Performance" };
  };
  
  // Function to calculate performance
  const calculatePerformance = (tasks) => {
    if (!tasks || tasks.length === 0) {
      return {
        percentage: 0,
        grade: "N/A", 
        label: "Insufficient Data",
        taskCount: 0,
        details: []
      };
    }
    
    let totalScore = 0;
    const calculationDetails = [];
    
    tasks.forEach(task => {
      const supervisorProgress = task.progress || 0;
      const totalWeight = task.weights ? task.weights.reduce((sum, w) => sum + (w.percentage || 0), 0) : 0;
      
      // Formula: supervisorProgress * totalWeight for this task
      const taskScore = (supervisorProgress * totalWeight) / 100;
      totalScore += taskScore;
      
      calculationDetails.push({
        taskId: task.id,
        taskName: task.name,
        supervisorProgress: supervisorProgress,
        totalWeight: totalWeight,
        taskScore: taskScore
      });
    });
    
    // Average = sum of all task scores / number of tasks
    const average = totalScore / tasks.length;
    
    // Final percentage = (Average / 60) * 100 (as per the formula provided)
    const finalPercentage = Math.min(100, Math.max(0, Math.round((average / 60) * 100)));
    
    const { grade, label } = getGrade(finalPercentage);
    
    return {
      percentage: finalPercentage,
      grade,
      label,
      taskCount: tasks.length,
      details: calculationDetails
    };
  };
  
  // Handle evaluate button click
  const handleEvaluate = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        // Validate inputs
        if (!dateRange.startDate || !dateRange.endDate || !selectedEmployee) {
          alert("Please select date range and employee");
          setIsLoading(false);
          return;
        }
        
        // Get all performance reviews for the employee in the date range
        const allReviews = PMSDummyDataStore.getPerformanceReviews();
        const employeeReviews = allReviews.filter(review => {
          const reviewDate = new Date(review.lastUpdated);
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          
          return (
            review.employeeId === `EMP${selectedEmployee.padStart(3, '0')}` &&
            reviewDate >= startDate &&
            reviewDate <= endDate &&
            review.progress > 0 // Only include reviews with supervisor progress
          );
        });
        
        // Get the tasks associated with these reviews
        const relatedTasks = employeeReviews.map(review => {
          const task = PMSDummyDataStore.getTaskById(review.taskId);
          if (task) {
            // Use the progress from the review, not the task
            return {
              ...task,
              progress: review.progress // This is supervisor's progress
            };
          }
          return null;
        }).filter(Boolean);
        
        setFilteredTasks(relatedTasks);
        
        // Calculate evaluation
        const result = calculatePerformance(relatedTasks);
        setEvaluationResult(result);
        
      } catch (error) {
        console.error("Error calculating performance:", error);
      } finally {
        setIsLoading(false);
      }
    }, 800); // Simulate API delay
  };
  
  // Filter employees by search term
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get grade badge color
  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-yellow-100 text-yellow-700';
      case 'B-': return 'bg-orange-100 text-orange-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          Employee Performance Evaluation
        </h1>
        <p className="text-gray-600 mt-2">
          Calculate and grade employee performance based on completed tasks
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min={dateRange.startDate}
                required
              />
            </div>
          </div>
          
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employee by name or department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {searchTerm && filteredEmployees.length > 0 && (
              <div className="mt-2 max-h-40 overflow-auto border border-gray-100 rounded-lg bg-white shadow-sm absolute z-10 w-full md:max-w-[300px]">
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                      selectedEmployee === emp.id ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedEmployee(emp.id);
                      setSearchTerm(emp.name);
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.department}</div>
                    </div>
                    {selectedEmployee === emp.id && (
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {searchTerm && filteredEmployees.length === 0 && (
              <div className="mt-2 p-3 text-center text-sm text-gray-500 border border-gray-100 rounded-lg absolute z-10 w-full md:max-w-[300px] bg-white">
                No employees found matching your search criteria
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleEvaluate}
            disabled={isLoading || !dateRange.startDate || !dateRange.endDate || !selectedEmployee}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isLoading || !dateRange.startDate || !dateRange.endDate || !selectedEmployee
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <BarChart2 className="h-4 w-4" />
                <span>Calculate Performance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {evaluationResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Results Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Performance Evaluation Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {dateRange.startDate} to {dateRange.endDate} • {evaluationResult.taskCount} tasks analyzed
                </p>
              </div>
              <button 
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                onClick={() => {
                  // In a real app, you'd implement export functionality
                  alert('Export functionality would be implemented here');
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
          {/* Results Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Grade Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Final Grade</h3>
                  <div className={`px-2.5 py-1 rounded-full text-sm font-medium ${getGradeBadgeClass(evaluationResult.grade)}`}>
                    {evaluationResult.grade}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{evaluationResult.label}</div>
                <div className="text-sm text-gray-500">
                  Based on supervisor ratings and task weights
                </div>
              </div>
              
              {/* Percentage Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Performance Score</h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-indigo-600">{evaluationResult.percentage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        evaluationResult.percentage < 30 ? 'bg-red-500' : 
                        evaluationResult.percentage < 60 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${evaluationResult.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  Formula: (Average / 60) * 100
                </div>
              </div>
              
              {/* Task Summary Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Task Summary</h3>
                <div className="text-3xl font-bold text-gray-900">{evaluationResult.taskCount}</div>
                <div className="text-sm text-gray-500 mt-2">
                  Tasks evaluated within selected period
                </div>
                <button 
                  onClick={() => setViewDetails(!viewDetails)}
                  className="mt-4 text-sm text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                >
                  {viewDetails ? 'Hide Details' : 'View Calculation Details'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${viewDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Calculation Details */}
            {viewDetails && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Calculation Details</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supervisor Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task Weight Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Calculation
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluationResult.details.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {detail.taskName || `Task #${detail.taskId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {detail.supervisorProgress}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {detail.totalWeight}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {detail.supervisorProgress}% × {detail.totalWeight}% ÷ 100
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {detail.taskScore.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          Average = Sum of Scores / Number of Tasks:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          {(evaluationResult.details.reduce((sum, detail) => sum + detail.taskScore, 0) / evaluationResult.taskCount).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          Final Percentage = (Average / 60) × 100:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          {evaluationResult.percentage}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Performance Scale Reference */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Performance Grade Scale</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage Range
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">A+</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">81-100%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Excellent</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">A</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">61-80%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Above Average</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">B</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">41-60%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Average</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">B-</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">21-40%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Below Average</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">C</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1-20%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Poor Performance</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 italic">
                    Formula: Average = (Supervisor's Progress + Total Weight Percentage) / 2, Final Percentage = (Average / 60) * 100
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* No Results State */}
      {!evaluationResult && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Results Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Select a date range and employee, then click "Calculate Performance" to generate an evaluation report.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceEvaluation;