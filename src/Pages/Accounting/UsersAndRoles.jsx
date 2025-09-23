import React from "react";

const UsersAndRoles = () => {
  return (
    <div className="users-and-roles">
      <h1>Users & Roles</h1>
      <p>Manage admin, accountant, staff permissions.</p>
      {/* Placeholder for user management */}
      <ul>
        <li>Admin: Full Access</li>
        <li>Accountant: Accounting Access</li>
        <li>Staff: Limited Access</li>
      </ul>
      <button>Add New User</button>
    </div>
  );
};

export default UsersAndRoles;
