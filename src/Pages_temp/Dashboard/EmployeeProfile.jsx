import { useEffect, useState } from "react";
import employeeService from "@services/EmployeeDataService";

export default function EmployeeProfile({ employeeId }) {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await employeeService.getEmployeeDetails(employeeId);
        setEmployee(data);
      } catch (error) {
        console.error("Failed to load employee details", error);
      }
    };
    fetchData();
  }, [employeeId]);

  if (!employee) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">{employee.full_name}</h2>
      
      {/* Personal Information */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p>Email: {employee.contact_detail?.email ?? "Not provided"}</p>
        <p>Mobile: {employee.contact_detail?.mobile_line ?? "Not provided"}</p>
        <p>Landline: {employee.contact_detail?.land_line ?? "Not provided"}</p>
        <p>NIC: {employee.nic}</p>
        <p>DOB: {employee.dob}</p>
        <p>Gender: {employee.gender}</p>
        <p>Marital Status: {employee.marital_status ?? "Not specified"}</p>
      </div>

      {/* Address Information */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Address Information</h3>
        <p>Province: {employee.contact_detail?.province ?? "Not specified"}</p>
        <p>District: {employee.contact_detail?.district ?? "Not specified"}</p>
        <p>Permanent Address: {employee.contact_detail?.permanent_address ?? "Not provided"}</p>
        <p>Temporary Address: {employee.contact_detail?.temporary_address ?? "Not provided"}</p>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Emergency Contact</h3>
        <p>Name: {employee.contact_detail?.emg_name ?? "Not specified"}</p>
        <p>Relationship: {employee.contact_detail?.emg_relationship ?? "Not specified"}</p>
        <p>Contact Number: {employee.contact_detail?.emg_tel ?? "Not provided"}</p>
        <p>Address: {employee.contact_detail?.emg_address ?? "Not provided"}</p>
      </div>

      {/* Organization Information */}
      {employee.organization_assignment && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Organization Information</h3>
          <p>Company: {employee.organization_assignment.company?.name ?? "Not specified"}</p>
          <p>Department: {employee.organization_assignment.department?.name ?? "Not specified"}</p>
          <p>Designation: {employee.organization_assignment.designation?.name ?? "Not specified"}</p>
          <p>Employment Type: {employee.employment_type?.name ?? "Not specified"}</p>
        </div>
      )}

      {/* Compensation Information */}
      {employee.compensation && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Compensation Information</h3>
          <p>Basic Salary: Rs. {employee.compensation.basic_salary ?? "Not specified"}</p>
          <p>Bank: {employee.compensation.bank_name ?? "Not specified"}</p>
          <p>Branch: {employee.compensation.branch_name ?? "Not specified"}</p>
          <p>Account No: {employee.compensation.bank_account_no ?? "Not specified"}</p>
        </div>
      )}
    </div>
  );
}
