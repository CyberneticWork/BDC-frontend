import React from "react";
import ChangePasswordCard from "../../components/ChangePasswordCard";

const ChangePassword = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative">
            <h1 className="text-4xl font-bold text-white mb-2">Change Password</h1>
            <p className="text-blue-100 text-lg">Update your account password securely</p>
          </div>
        </div>

        <div className="flex justify-center">
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
