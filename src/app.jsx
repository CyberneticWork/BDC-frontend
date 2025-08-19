// This file has been refactored. Main logic moved to pages/Home.jsx.
// You can remove this file or use it for global providers if needed.

import React from "react";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100"></div>
    </>
  );
}

export default App;
