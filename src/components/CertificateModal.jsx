import React from "react";
import { Award, Clock, Target, X, Download } from "lucide-react";

const CertificateModal = ({
  selectedCertificate,
  onClose,
  displayName,
  certificateType = "course", // "course" or "exam"
}) => {
  // Handle printing certificate in a new window
  const handlePrintCertificate = () => {
    const certEl = document.getElementById(
      certificateType === "exam" ? "exam-certificate" : "progress-certificate"
    );
    if (!certEl) return window.print();
    const win = window.open("", "PRINT", "height=800,width=1000");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>${
        certificateType === "exam" ? "Exam" : "Course"
      } Certificate</title><link rel="stylesheet" href="/app.css" />`
    );
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

  if (!selectedCertificate) return null;

  // Handle different certificate data structures
  const getCertificateTitle = () => {
    if (certificateType === "exam") {
      return (
        selectedCertificate.examTitle || selectedCertificate.title || "Exam"
      );
    }
    return selectedCertificate.type === "exam"
      ? selectedCertificate.exam_title || selectedCertificate.course_title
      : selectedCertificate.course_title;
  };

  const getCertificateId = () => {
    if (certificateType === "exam") {
      return selectedCertificate.examId || selectedCertificate.id;
    }
    return selectedCertificate.type === "exam"
      ? selectedCertificate.id.replace("exam-", "")
      : selectedCertificate.course_id || selectedCertificate.id;
  };

  const getCertificateCode = () => {
    if (certificateType === "exam") {
      return (
        selectedCertificate.certificateId ||
        `EXAM-${String(
          selectedCertificate.examId || selectedCertificate.id
        ).padStart(4, "0")}`
      );
    }
    return selectedCertificate.type === "exam"
      ? `EXAM-${String(selectedCertificate.id.replace("exam-", "")).padStart(
          4,
          "0"
        )}`
      : `CERT-${String(
          selectedCertificate.course_id || selectedCertificate.id
        ).padStart(4, "0")}-${selectedCertificate.id}`;
  };

  const getIssueDate = () => {
    if (certificateType === "exam") {
      return selectedCertificate.issueDate
        ? new Date(selectedCertificate.issueDate).toLocaleDateString()
        : new Date().toLocaleDateString();
    }
    return selectedCertificate.issued_date || new Date().toLocaleDateString();
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-0 top-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            id={
              certificateType === "exam"
                ? "exam-certificate"
                : "progress-certificate"
            }
            className="cert-container ring-1 ring-blue-200 rounded-xl p-8 bg-white"
          >
            <div className="cert-inner">
              <h1 className="text-4xl font-extrabold tracking-wide text-blue-700 mb-2">
                {certificateType === "exam"
                  ? "Certificate of Achievement"
                  : "Certificate"}
              </h1>
              <p className="uppercase tracking-widest text-sm text-gray-500 mb-6">
                {certificateType === "exam"
                  ? "Of Achievement"
                  : "Of Course Completion"}
              </p>
              <p className="text-gray-600 text-sm">This is to certify that</p>
              <div className="name text-3xl font-bold text-gray-800 my-4">
                {displayName}
              </div>
              <p className="text-gray-600 mb-4">
                {certificateType === "exam"
                  ? "has successfully passed the examination"
                  : "has successfully completed the course"}
              </p>
              <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                {getCertificateTitle()}
              </h2>

              {certificateType === "exam" && selectedCertificate.score && (
                <p className="text-gray-600 mb-6">
                  with a score of{" "}
                  <span className="font-semibold text-green-600">
                    {selectedCertificate.score}%
                  </span>{" "}
                  (Required:{" "}
                  {selectedCertificate.passingScore ||
                    selectedCertificate.passing_score}
                  %)
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
                <div className="p-3 rounded bg-blue-50">
                  <div className="text-xs uppercase text-gray-500 mb-1">
                    Date Issued
                  </div>
                  <div className="font-medium text-gray-800">
                    {getIssueDate()}
                  </div>
                </div>
                <div className="p-3 rounded bg-blue-50">
                  <div className="text-xs uppercase text-gray-500 mb-1">
                    {certificateType === "exam"
                      ? "Exam ID"
                      : selectedCertificate.type === "exam"
                      ? "Exam ID"
                      : "Course ID"}
                  </div>
                  <div className="font-medium text-gray-800">
                    {getCertificateId()}
                  </div>
                </div>
                <div className="p-3 rounded bg-blue-50">
                  <div className="text-xs uppercase text-gray-500 mb-1">
                    Certificate Code
                  </div>
                  <div className="font-medium text-gray-800">
                    {getCertificateCode()}
                  </div>
                </div>
              </div>

              {certificateType !== "exam" &&
                selectedCertificate.type === "exam" &&
                selectedCertificate.score && (
                  <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center justify-center">
                      <Target className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Score: {selectedCertificate.score}% (Passing Score:{" "}
                        {selectedCertificate.passing_score}%)
                      </span>
                    </div>
                  </div>
                )}

              <div className="signature mt-12 flex justify-between">
                {/* <div className="text-center">
                  <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-blue-200 to-indigo-200 rounded" />
                  <div className="text-xs uppercase tracking-wider text-gray-600">
                    {certificateType === "exam"
                      ? "Authorized Signature"
                      : selectedCertificate.type === "exam"
                      ? "Exam Administrator"
                      : "Course Instructor"}
                  </div>
                </div> */}
                {/* <div className="text-center">
                  <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-green-200 to-emerald-200 rounded" />
                  <div className="text-xs uppercase tracking-wider text-gray-600">
                    {certificateType === "exam"
                      ? "Exam Coordinator"
                      : "Learning Coordinator"}
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handlePrintCertificate}
              className="flex items-center px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow"
            >
              <Download className="h-4 w-4 mr-2" />
              Print / Download Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
