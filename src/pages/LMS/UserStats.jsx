import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import UserManagementService from "../../services/UserManagementService";

const accentMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-600" },
};

const Card = ({ title, value, icon: Icon, accent = "blue" }) => {
  const classes = accentMap[accent] || accentMap.blue;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${classes.bg}`}>
          <Icon className={`h-6 w-6 ${classes.text}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ page, totalPages, onPage }) => (
  <div className="flex items-center justify-end gap-2 mt-3">
    <button
      disabled={page <= 1}
      onClick={() => onPage(page - 1)}
      className="px-2 py-1 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 flex items-center gap-1"
    >
      <ChevronLeft className="h-4 w-4" /> Prev
    </button>
    <span className="text-sm text-gray-600">
      Page {page} of {Math.max(totalPages || 1, 1)}
    </span>
    <button
      disabled={page >= (totalPages || 1)}
      onClick={() => onPage(page + 1)}
      className="px-2 py-1 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 flex items-center gap-1"
    >
      Next <ChevronRight className="h-4 w-4" />
    </button>
  </div>
);

const Table = ({ columns, rows, emptyLabel, loading }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-6 text-center text-gray-500"
            >
              Loading...
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-6 text-center text-gray-500"
            >
              {emptyLabel}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-gray-800">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

export default function UserStats() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tab, setTab] = useState("courses"); // 'courses' | 'exams'

  const [coursePage, setCoursePage] = useState(1);
  const [coursePerPage] = useState(15);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseData, setCourseData] = useState({
    data: [],
    last_page: 1,
    total: 0,
  });
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [examPage, setExamPage] = useState(1);
  const [examPerPage] = useState(15);
  const [examSearch, setExamSearch] = useState("");
  const [examData, setExamData] = useState({
    data: [],
    last_page: 1,
    total: 0,
  });
  const [loadingExams, setLoadingExams] = useState(true);

  const [filterUserId, setFilterUserId] = useState("");
  const [filteredUser, setFilteredUser] = useState(null);

  // Fetch the user's details when filtering by user ID
  useEffect(() => {
    let cancelled = false;
    const loadUser = async (id) => {
      try {
        if (!id) {
          setFilteredUser(null);
          return;
        }
        const res = await UserManagementService.getUserById(id);
        if (!cancelled) setFilteredUser(res);
      } catch (e) {
        if (!cancelled) setFilteredUser(null);
        console.warn("Failed to fetch user details for id:", id, e);
      }
    };

    // Only attempt when numeric
    const trimmed = String(filterUserId).trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      loadUser(trimmed);
    } else {
      setFilteredUser(null);
    }

    return () => {
      cancelled = true;
    };
  }, [filterUserId]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const s = await LMSService.getLmsStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load stats", e);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const params = {
        page: coursePage,
        perPage: coursePerPage,
        search: courseSearch,
      };
      if (filterUserId) params.userId = filterUserId;
      const res = filterUserId
        ? await LMSService.getUserCourseProgress(filterUserId, params)
        : await LMSService.getAllUsersCourseProgress(params);
      setCourseData({
        data: res.data || [],
        last_page: res.last_page || 1,
        total: res.total || (res.data ? res.data.length : 0),
      });
    } catch (e) {
      console.error("Failed to load course progress", e);
      setCourseData({ data: [], last_page: 1, total: 0 });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const params = {
        page: examPage,
        perPage: examPerPage,
        search: examSearch,
      };
      if (filterUserId) params.userId = filterUserId;
      const res = filterUserId
        ? await LMSService.getUserExamProgress(filterUserId, params)
        : await LMSService.getAllUsersExamProgress(params);
      setExamData({
        data: res.data || [],
        last_page: res.last_page || 1,
        total: res.total || (res.data ? res.data.length : 0),
      });
    } catch (e) {
      console.error("Failed to load exam progress", e);
      setExamData({ data: [], last_page: 1, total: 0 });
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursePage, coursePerPage, courseSearch, filterUserId]);

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examPage, examPerPage, examSearch, filterUserId]);

  const courseColumns = useMemo(
    () => [
      {
        key: "user",
        label: "User",
        render: (row) => {
          const u = row.user || filteredUser;
          return u ? `${u.name}${u.email ? ` (${u.email})` : ""}` : "-";
        },
      },
      {
        key: "course",
        label: "Course",
        render: (row) =>
          row.course
            ? row.course.title
            : row.course?.title || row.course_title || "-",
      },
      {
        key: "enrolled_at",
        label: "Enrolled",
        render: (row) => formatDate(row.enrolled_at),
      },
      {
        key: "modules",
        label: "Modules",
        render: (row) =>
          `${row.completed_modules ?? row.completedModules ?? 0} / ${
            row.total_modules ?? row.totalModules ?? 0
          }`,
      },
      {
        key: "progress",
        label: "Progress",
        render: (row) =>
          `${row.progress_percentage ?? row.progressPercentage ?? 0}%`,
      },
      {
        key: "certificate_issued",
        label: "Certificate",
        render: (row) =>
          row.certificate_issued || row.certificateIssued ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              No
            </span>
          ),
      },
    ],
    [filteredUser]
  );

  const examColumns = useMemo(
    () => [
      {
        key: "user",
        label: "User",
        render: (row) => {
          const u = row.user || filteredUser;
          return u ? `${u.name}${u.email ? ` (${u.email})` : ""}` : "-";
        },
      },
      {
        key: "exam",
        label: "Exam",
        render: (row) =>
          row.exam
            ? `${row.exam.title} (Pass ${
                row.exam.passing_score ?? row.exam.passingScore ?? 0
              }%)`
            : "-",
      },
      {
        key: "attempts",
        label: "Attempts",
        render: (row) => row.attempts ?? 0,
      },
      {
        key: "best_score",
        label: "Best Score",
        render: (row) => `${row.best_score ?? row.bestScore ?? 0}%`,
      },
      {
        key: "last_attempt_at",
        label: "Last Attempt",
        render: (row) => formatDate(row.last_attempt_at || row.lastAttemptAt),
      },
      {
        key: "passed_any_attempt",
        label: "Passed",
        render: (row) =>
          row.passed_any_attempt || row.passedAnyAttempt ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              No
            </span>
          ),
      },
    ],
    [filteredUser]
  );

  const onRefresh = () => {
    if (tab === "courses") fetchCourses();
    else fetchExams();
    fetchStats();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LMS User Stats</h1>
          <p className="text-gray-600">
            Monitor learning progress across all users
          </p>
        </div>
        {/* <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button> */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card
          title="Users Enrolled"
          value={stats?.total_users_enrolled ?? "-"}
          icon={Users}
          accent="blue"
        />
        <Card
          title="Enrollments"
          value={stats?.total_enrollments ?? "-"}
          icon={BookOpen}
          accent="indigo"
        />
        <Card
          title="Certificates"
          value={stats?.total_certificates ?? "-"}
          icon={Award}
          accent="purple"
        />
        <Card
          title="Exams"
          value={stats?.total_exams ?? "-"}
          icon={Target}
          accent="green"
        />
        {/* <Card
          title="Exam Attempts"
          value={stats?.total_exam_attempts ?? "-"}
          icon={Target}
          accent="yellow"
        /> */}
        <Card
          title="Exam Pass Rate"
          value={`${stats?.exam_pass_rate ?? 0}%`}
          icon={TrendingUp}
          accent="pink"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              value={tab === "courses" ? courseSearch : examSearch}
              onChange={(e) =>
                tab === "courses"
                  ? setCourseSearch(e.target.value)
                  : setExamSearch(e.target.value)
              }
              placeholder="Search by user name/email, course/exam title"
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="w-full md:w-60">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by User ID (optional)
          </label>
          <input
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder="e.g. 12"
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setCoursePage(1);
            setExamPage(1);
            fetchCourses();
            fetchExams();
          }}
          className="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 inline-flex">
        <button
          onClick={() => setTab("courses")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "courses"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Course Progress
        </button>
        <button
          onClick={() => setTab("exams")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "exams"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Exam Progress
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        {tab === "courses" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Course Progress{" "}
                {filteredUser
                  ? `(${filteredUser.name})`
                  : filterUserId
                  ? `(User ${filterUserId})`
                  : ""}
              </h3>
              <Pagination
                page={coursePage}
                totalPages={courseData.last_page}
                onPage={setCoursePage}
              />
            </div>
            <Table
              columns={courseColumns}
              rows={courseData.data}
              emptyLabel="No course progress found"
              loading={loadingCourses}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Exam Progress{" "}
                {filteredUser
                  ? `(${filteredUser.name})`
                  : filterUserId
                  ? `(User ${filterUserId})`
                  : ""}
              </h3>
              <Pagination
                page={examPage}
                totalPages={examData.last_page}
                onPage={setExamPage}
              />
            </div>
            <Table
              columns={examColumns}
              rows={examData.data}
              emptyLabel="No exam progress found"
              loading={loadingExams}
            />
          </>
        )}
      </div>
    </div>
  );
}
