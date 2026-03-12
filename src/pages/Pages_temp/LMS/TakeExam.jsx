import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Award,
  Target,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import { useAuth } from "../../contexts/AuthContext";

const TakeExam = ({ examId, onBack }) => {
  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // Start with 30 minutes as default
  const [showResults, setShowResults] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const examData = await LMSService.getExam(examId);
      console.log("Loaded exam:", examData);
      console.log("Exam questions:", examData.questions);
      setExam(examData);
      setUserAnswers(new Array(examData.questions.length).fill(null));

      // Parse duration: support numeric minutes or strings like "30" or "30 minutes"
      let minutes = 30;
      if (typeof examData.duration === "number") {
        minutes = examData.duration;
      } else if (typeof examData.duration === "string") {
        const m = examData.duration.match(/(\d+)/);
        if (m) minutes = parseInt(m[1]);
      }
      const timeInSeconds = Math.max(0, Math.floor(minutes * 60));
      console.log("Setting timer to:", timeInSeconds, "seconds");
      setTimeLeft(timeInSeconds || 0);
    } catch (err) {
      setError("Failed to load exam");
      console.error("Error loading exam:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only start timer if exam is loaded, exam has started, and timeLeft > 0
    if (exam && examStarted && timeLeft > 0 && !showResults && !isSubmitted) {
      console.log("Starting timer with:", timeLeft, "seconds remaining");
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        console.log("Timer tick:", newTimeLeft);
        setTimeLeft(newTimeLeft);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      exam &&
      examStarted &&
      timeLeft === 0 &&
      !showResults &&
      !isSubmitted
    ) {
      console.log("Time is up, auto-submitting exam");
      handleSubmitExam();
    }
  }, [timeLeft, showResults, isSubmitted, exam, examStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;

    try {
      console.log("Submitting exam...");
      setIsSubmitted(true);
      // Replace null answers with -1 to indicate unanswered
      const processedAnswers = userAnswers.map((answer) =>
        answer === null ? -1 : answer
      );
      console.log("Processed answers:", processedAnswers);
      console.log("Exam questions length:", exam.questions.length);
      console.log("Answers array length:", processedAnswers.length);
      const results = await LMSService.submitExam(examId, processedAnswers);
      console.log("Exam results:", results);
      setExamResults(results);
      setShowResults(true);
    } catch (err) {
      setError("Failed to submit exam");
      setIsSubmitted(false); // Allow retry on error
      console.error("Error submitting exam:", err);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
    }
  };

  const handleStartExam = () => {
    console.log("Starting exam");
    setExamStarted(true);
  };

  // Force show exam interface if not submitted
  const shouldShowResults = isSubmitted;

  console.log(
    "TakeExam render - showResults:",
    showResults,
    "examResults:",
    !!examResults,
    "isSubmitted:",
    isSubmitted,
    "exam:",
    !!exam,
    "shouldShowResults:",
    shouldShowResults
  );

  // Check if exam is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Check for errors
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  // Check if exam is loaded
  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Exam Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested exam could not be found.
          </p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  // Check if exam has questions
  if (!exam.questions || exam.questions.length === 0) {
    console.log("Exam has no questions");
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Exam Not Available
            </h2>
            <p className="text-gray-600 mb-6">
              This exam doesn't have any questions yet. Please contact the exam
              creator.
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("About to check results condition:", shouldShowResults);
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {exam.title}
            </h1>
            <p className="text-gray-600 mb-6">{exam.description}</p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Duration: {exam.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-green-500 mr-2" />
                  <span>Total Questions: {exam.questions.length}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleStartExam}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowResults && !examResults) {
    console.log("Waiting for results");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your results...</p>
        </div>
      </div>
    );
  }

  if (shouldShowResults && examResults) {
    console.log("Showing results");
    {
      console.log("Current exam results:", examResults);
    }
    const passed =
      examResults.passed ||
      Number(examResults.score) >= Number(exam.passing_score || 0);
    const displayName = user?.name || user?.fullName || "Participant";
    const issuedDate = new Date().toLocaleDateString();

    // helper to print certificate only
    const handlePrintCertificate = () => {
      const certEl = document.getElementById("exam-certificate");
      if (!certEl) return window.print();
      const win = window.open("", "PRINT", "height=800,width=1000");
      if (!win) return;
      win.document.write(
        `<!DOCTYPE html><html><head><title>Certificate</title><link rel="stylesheet" href="/app.css" />`
      );
      // minimal tailwind classes might not work outside build; inline basic styles for certainty
      win.document.write(`<style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:40px; background:#f8fafc; }
        .cert-container { background:white; border:10px solid #1d4ed8; padding:40px; position:relative; }
        .cert-inner { border:4px solid #93c5fd; padding:40px; text-align:center; }
        h1 { font-size:42px; margin:0 0 10px; letter-spacing:2px; }
        h2 { font-size:26px; margin:10px 0 5px; }
        .name { font-size:32px; font-weight:600; margin:15px 0; }
        .meta { margin-top:30px; display:flex; justify-content:space-between; font-size:14px; }
        .signature { margin-top:50px; display:flex; justify-content:space-between; }
        .sig-line { border-top:1px solid #0f172a; width:220px; padding-top:6px; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
      </style></head><body>`);
      win.document.write(certEl.outerHTML);
      win.document.write("</body></html>");
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 400);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Exams
            </button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600">Exam Results</p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                examResults.passed
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {examResults.passed ? (
                <Award className="h-10 w-10" />
              ) : (
                <X className="h-10 w-10" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {examResults.passed ? "Congratulations!" : "Exam Completed"}
            </h2>
            <p className="text-gray-600 mb-4">
              {examResults.passed
                ? "You have successfully passed the exam!"
                : "You did not meet the passing criteria. Try again!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {examResults.score}%
              </div>
              <div className="text-sm text-gray-600">Your Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {examResults.correct_answers}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {examResults.total_questions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Passing Score Required:
              </span>
              <span className="font-medium">{exam.passing_score}%</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Your Score:</span>
              <span
                className={`font-medium ${
                  examResults.passed ? "text-green-600" : "text-red-600"
                }`}
              >
                {examResults.score}%
              </span>
            </div>
          </div>
        </div>

        {console.log("exam:", exam)}

        {/* Certificate */}
        {/* {passed && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-300 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,#3b82f6,transparent_70%)]" />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Award className="h-6 w-6 text-yellow-500 mr-2" />
                Certificate of Achievement
              </h3>
              <button
                onClick={handlePrintCertificate}
                className="text-sm px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow"
              >
                Print / Download
              </button>
            </div>
            <div
              id="exam-certificate"
              className="cert-container ring-1 ring-blue-200 rounded-xl p-8 bg-white"
            >
              <div className="cert-inner">
                <h1 className="text-4xl font-extrabold tracking-wide text-blue-700 mb-2">
                  Certificate
                </h1>
                <p className="uppercase tracking-widest text-sm text-gray-500 mb-6">
                  Of Achievement
                </p>
                <p className="text-gray-600 text-sm">This is to certify that</p>
                <div className="name text-3xl font-bold text-gray-800 my-4">
                  {displayName}
                </div>
                <p className="text-gray-600 mb-4">
                  has successfully passed the examination
                </p>
                <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                  {exam.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  with a score of werg{" "}
                  <span className="font-semibold text-green-600">
                    {examResults.score}%
                  </span>{" "}
                  (Required: {exam.passing_score}%)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Date Issued
                    </div>
                    <div className="font-medium text-gray-800">
                      {issuedDate}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Exam ID
                    </div>
                    <div className="font-medium text-gray-800">{exam.id}</div>
                  </div>
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Unique Code
                    </div>
                    <div className="font-medium text-gray-800">
                      CERT-{String(exam.id).padStart(4, "0")}-
                      {String(examResults.score).padStart(2, "0")}
                    </div>
                  </div>
                </div>
                <div className="signature mt-12 flex justify-between">
                  <div className="text-center">
                    <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-blue-200 to-indigo-200 rounded" />
                    <div className="text-xs uppercase tracking-wider text-gray-600">
                      Authorized Signature
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-green-200 to-emerald-200 rounded" />
                    <div className="text-xs uppercase tracking-wider text-gray-600">
                      Exam Coordinator
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Detailed Results */}
        {/* <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Question Review
          </h3>
         
          <div className="space-y-4">
            {examResults.results.map((result, index) => {
              const question = exam.questions[index];
              return (
                <div
                  key={result.question_id}
                  className={`p-4 rounded-lg border ${
                    result.is_correct
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Question {index + 1}: {question.question}
                    </h4>
                    <div className="flex items-center">
                      {result.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded ${
                        optionIndex === result.user_answer && !result.is_correct
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {option}
                      {optionIndex === result.user_answer && !result.is_correct && (
                        <span className="ml-2 text-red-600 font-medium">
                          (Your Answer)
                        </span>
                      )}
                    </div>
                  ))}

                  {question.explanation && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div> */}
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredQuestions = userAnswers.filter(
    (answer) => answer !== null
  ).length;

  const getQuestionStatus = (index) => {
    if (userAnswers[index] !== null) return "answered";
    return "unanswered";
  };

  // Ensure current question exists
  if (!currentQuestion) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Question
            </h2>
            <p className="text-gray-600 mb-6">
              There was an error loading the current question.
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Exams
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-gray-600">{exam.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-red-600 font-medium">
              <Clock className="h-5 w-5 mr-2" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / exam.questions.length) * 100
              }%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Question {currentQuestionIndex + 1} of {exam.questions.length}
          </span>
          <span>{answeredQuestions} answered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? "bg-blue-600 text-white"
                      : getQuestionStatus(index) === "answered"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    userAnswers[currentQuestionIndex] === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={index}
                    checked={userAnswers[currentQuestionIndex] === index}
                    onChange={() =>
                      handleAnswerSelect(currentQuestionIndex, index)
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-4">
                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <button
                    onClick={handleSubmitExam}
                    disabled={userAnswers.some((answer) => answer === null)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
