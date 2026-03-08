import React from "react";
import ChangePasswordCard from "../../components/ChangePasswordCard";

const ChangePassword = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h1>
          <p className="text-gray-600">Update your account password securely</p>
        </div>

        <div className="flex justify-center">
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
