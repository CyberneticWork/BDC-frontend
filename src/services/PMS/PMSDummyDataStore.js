// Central in-memory PMS dummy data store.
// Persists across route changes until full page reload.

let initialized = false;

let recentReviews = [];
let upcomingDeadlines = [];
let kpiTasks = [];
let performanceReviews = [];
let reviewIdCounter = 1000; // start high to avoid clashes with seeded IDs
let kpiIdCounter = 100;

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function seed() {
  if (initialized) return;
  initialized = true;

  recentReviews = [
    { id: 1, employeeName: "John Smith", position: "Software Developer", reviewType: "Annual", date: "2025-08-15", status: "Completed", rating: 4.2 },
    { id: 2, employeeName: "Sarah Johnson", position: "Marketing Specialist", reviewType: "Quarterly", date: "2025-08-20", status: "Pending Manager", rating: null },
    { id: 3, employeeName: "Michael Wong", position: "Project Manager", reviewType: "Annual", date: "2025-08-12", status: "Completed", rating: 4.7 },
    { id: 4, employeeName: "Emma Davis", position: "UX Designer", reviewType: "Quarterly", date: "2025-08-22", status: "In Progress", rating: null },
  ];

  upcomingDeadlines = [
    { id: 1, name: "Q3 Performance Reviews", deadline: "2025-09-15", daysLeft: 18, type: "review" },
    { id: 2, name: "Annual Goal Setting", deadline: "2025-09-10", daysLeft: 13, type: "goals" },
    { id: 3, name: "Leadership Calibration", deadline: "2025-09-22", daysLeft: 25, type: "calibration" },
  ];

  // Seed KPI tasks (subset for demo)
  kpiTasks = [
    {
      id: 1,
      name: "Customer Satisfaction Score Report",
      description: "Compile monthly report on customer satisfaction metrics including survey results and feedback analysis",
      status: "active",
      department: "Customer Service",
      owner: "",
      priority: "high",
      assignees: ["1"],
      assigneeUpdates: [
        {
          employeeId: 1,
            updates: [
              { date: "2024-01-05T09:00:00Z", note: "Initial assignment", author: "Manager", progressPercentage: 0 },
              { date: "2024-02-01T14:30:00Z", note: "Submitted first draft of report with survey data analysis", author: "Sarah Johnson", documentName: "CSAT_Report_Draft.pdf", documentSize: "1.2 MB", documentType: "application/pdf", progressPercentage: 40,
                performanceMetrics: {
                  jobKnowledge: 60, qualityOfWork: 70, productivity: 50, communicationSkills: 75, teamwork: 65,
                  behaviorAtWork: 80, problemSolving: 55, attendance: 90, adaptability: 60, selfDevelopment: 50,
                  discipline: 85, adherenceToGuidelines: 70
                }
              }
            ]
        }
      ],
      startDate: "2023-12-01",
      endDate: "2024-03-31",
      lastUpdated: "2024-02-01T14:30:00Z",
      completionStatus: "in-progress",
      documentCount: 1,
      category: "Customer",
      frequency: "Monthly",
    }
  ];
  kpiIdCounter = kpiTasks.length + 1;

  // Seed performance reviews (mirroring existing static ones – truncated sample)
  performanceReviews = [
    {
      id: 1,
      taskId: null,
      employeeName: "John Smith",
      employeeId: "EMP001",
      position: "Software Developer",
      department: "Engineering",
      manager: "Michael Wong",
      type: "Annual Performance Review",
      status: "Completed",
      startDate: "2025-07-01",
      dueDate: "2025-08-15",
      completedDate: "2025-08-12",
      overallRating: 4.2,
      cycle: "2025 Annual",
      progress: 100,
      grade: "A-",
      supervisorComments: "John has shown exceptional skill in problem-solving...",
      lastUpdated: "2025-08-12T10:30:00Z",
      selfReportedProgress: 100,
      selfReportedLastUpdated: "2025-08-12T09:45:00Z",
      selfReportedAuthor: "John Smith",
      performanceMetrics: null
    }
  ];
  reviewIdCounter = performanceReviews.length + 2;
}

seed();

// Utility to generate review object for each new task assignment
function buildReviewFromTask(task, assigneeId) {
  const now = new Date().toISOString();
  return {
    id: reviewIdCounter++,
    taskId: task.id,
    employeeName: resolveEmployeeName(assigneeId),
    employeeId: "EMP" + assigneeId.toString().padStart(3, "0"),
    position: "", // unknown in dummy scope
    department: task.department || "",
    manager: task.creator?.name || "Supervisor",
    type: "Performance Review",
    status: "Draft",
    startDate: task.startDate,
    dueDate: task.endDate,
    completedDate: null,
    overallRating: null,
    cycle: deriveCycle(task.startDate),
    progress: 0,              // supervisor progress
    grade: null,
    supervisorComments: null,
    lastUpdated: now,
    selfReportedProgress: 0,
    selfReportedLastUpdated: null,
    selfReportedAuthor: null,
    performanceMetrics: null
  };
}

function deriveCycle(startDate) {
  const d = new Date(startDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()} Q${q}`;
}

function resolveEmployeeName(id) {
  const map = {
    1: "Sarah Johnson",
    2: "Mike Chen",
    3: "Emma Davis",
    4: "John Smith",
    5: "David Rodriguez",
  };
  return map[parseInt(id, 10)] || `Employee ${id}`;
}

// add a lightweight pub/sub so UI parts can refresh when store mutates
const _subscribers = new Set();
function notifySubscribers() {
  _subscribers.forEach(cb => {
    try { cb(); } catch (err) { console.error('PMSDummyDataStore subscriber error', err); }
  });
}

const PMSDummyDataStore = {
  // Dashboard
  getRecentReviews() { return clone(recentReviews); },
  getUpcomingDeadlines() { return clone(upcomingDeadlines); },

  // KPI Tasks
  getAllKpiTasks() { return clone(kpiTasks); },
  getEmployeeTasks(employeeId) {
    const idStr = String(employeeId);
    const idNum = parseInt(employeeId, 10);
    return kpiTasks.filter(t => {
      const assigned = (t.assignees || []).some(a => String(a) === idStr);
      const hasUpdates = (t.assigneeUpdates || []).some(au => au.employeeId === idNum);
      return assigned || hasUpdates;
    }).map(clone);
  },
  getTaskById: (taskId) => {
    return kpiTasks.find(task => task.id === taskId) || null;
  },
  
  // add subscription API
  subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    return () => _subscribers.delete(cb);
  },

  unsubscribe(cb) {
    _subscribers.delete(cb);
  },

  addKpiTask(task) {
    // Ensure ID and normalize assignees to strings
    const newTask = { 
      ...task, 
      id: task.id || kpiIdCounter++, 
      assignees: (task.assignees || []).map(a => String(a)),
      // Initialize assigneeUpdates for each assignee to ensure consistency
      assigneeUpdates: (task.assignees || []).map(assigneeId => ({
        employeeId: parseInt(assigneeId),
        updates: []
      }))
    };
    kpiTasks.push(newTask);
    
    console.log('New KPI task added:', newTask);
    
    // notify listeners that data changed
    notifySubscribers();
    return clone(newTask);
  },
  updateKpiTask(id, changes) {
    const idx = kpiTasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    kpiTasks[idx] = { ...kpiTasks[idx], ...changes, lastUpdated: new Date().toISOString() };

    notifySubscribers();
    return clone(kpiTasks[idx]);
  },
  deleteKpiTask(id) {
    kpiTasks = kpiTasks.filter(t => t.id !== id);
    // Optionally keep reviews (historical) – we leave them
  },
  updateTaskProgress(taskId, employeeId, progressData) {
    const idx = kpiTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    const task = kpiTasks[idx];
    const now = new Date().toISOString();

    let assigneeEntry = task.assigneeUpdates.find(a => a.employeeId === parseInt(employeeId));
    if (!assigneeEntry) {
      assigneeEntry = { employeeId: parseInt(employeeId), updates: [] };
      task.assigneeUpdates.push(assigneeEntry);
    }

    assigneeEntry.updates.push({
      date: progressData.date || now,
      note: progressData.note,
      author: progressData.author,
      documentName: progressData.documentName,
      documentSize: progressData.documentSize,
      documentType: progressData.documentType,
      progressPercentage: progressData.progressPercentage,
      performanceMetrics: progressData.performanceMetrics
    });

    task.documentCount = (task.documentCount || 0) + 1;
    task.lastUpdated = now;
    // Simple completion heuristic
    if (progressData.progressPercentage >= 100) {
      task.completionStatus = "completed";
    } else if (progressData.progressPercentage > 0) {
      task.completionStatus = "in-progress";
    }

    // This is the key part - only NOW create or update the performance review
    const employeeIdFormatted = "EMP" + employeeId.toString().padStart(3, "0");
    let existingReview = performanceReviews.find(r => 
      r.taskId === taskId && r.employeeId === employeeIdFormatted
    );
    
    if (!existingReview) {
      // Create performance review if none exists
      existingReview = buildReviewFromTask(task, employeeId);
      performanceReviews.push(existingReview);
      console.log('New performance review created after progress update:', existingReview);
    }
    
    // Always update these fields whether existing or new
    existingReview.selfReportedProgress = progressData.progressPercentage;
    existingReview.selfReportedLastUpdated = now;
    existingReview.selfReportedAuthor = progressData.author;
    existingReview.performanceMetrics = progressData.performanceMetrics;
    
    kpiTasks[idx] = task;
    notifySubscribers();
    console.log('Task progress updated:', task);
    console.log('Performance review updated:', existingReview);
    return clone(task);
  },

  // Performance Reviews
  getPerformanceReviews() { return clone(performanceReviews); },
  addPerformanceReview(review) {
    const newRev = { ...review, id: reviewIdCounter++ };
    performanceReviews.push(newRev);
    notifySubscribers();
    return clone(newRev);
  },
  updatePerformanceReview(id, updated) {
    const idx = performanceReviews.findIndex(r => r.id === id);
    if (idx === -1) return null;
    performanceReviews[idx] = { ...performanceReviews[idx], ...updated, lastUpdated: new Date().toISOString() };
    notifySubscribers();
    return clone(performanceReviews[idx]);
  }
};

export default PMSDummyDataStore;