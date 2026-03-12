import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Briefcase, DollarSign, FileText } from "lucide-react";
import employeeService from "@services/EmployeeDataService";
import config from "@src/config";

export default function EmployeeDetailsView({ employeeId }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getEmployeeDetails(employeeId);
        setEmployee(data);
      } catch (err) {
        console.error("Failed to load employee details", err);
        setError("Failed to load employee details");
      } finally {
        setLoading(false);
      }
    };
    
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-600 text-center p-4">{error}</div>;
  if (!employee) return <div className="text-gray-600 text-center p-4">No employee data found</div>;

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employee.profile_photo_path && (
            <div className="col-span-full flex justify-center mb-4">
              <img 
                src={`${config.apiBaseUrl}/storage/${employee.profile_photo_path}`} 
                alt={employee.full_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
              />
            </div>
          )}
          <div><span className="font-medium">Full Name:</span> {employee.full_name}</div>
          <div><span className="font-medium">Name with Initials:</span> {employee.name_with_initials}</div>
          <div><span className="font-medium">Display Name:</span> {employee.display_name}</div>
          <div><span className="font-medium">NIC:</span> {employee.nic}</div>
          <div><span className="font-medium">DOB:</span> {employee.dob}</div>
          <div><span className="font-medium">Gender:</span> {employee.gender}</div>
          <div><span className="font-medium">Marital Status:</span> {employee.marital_status}</div>
          <div><span className="font-medium">Religion:</span> {employee.religion || 'N/A'}</div>
          <div><span className="font-medium">Country of Birth:</span> {employee.country_of_birth || 'N/A'}</div>
        </div>
      </div>

      {/* Contact Details */}
      {employee.contact_detail && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-medium">Email:</span> {employee.contact_detail.email}</div>
            <div><span className="font-medium">Mobile:</span> {employee.contact_detail.mobile_line}</div>
            <div><span className="font-medium">Land Line:</span> {employee.contact_detail.land_line || 'N/A'}</div>
            <div className="col-span-full"><span className="font-medium">Permanent Address:</span> {employee.contact_detail.permanent_address}</div>
            <div className="col-span-full"><span className="font-medium">Temporary Address:</span> {employee.contact_detail.temporary_address || 'N/A'}</div>
            <div><span className="font-medium">District:</span> {employee.contact_detail.district}</div>
            <div><span className="font-medium">Province:</span> {employee.contact_detail.province}</div>
          </div>
        </div>
      )}

      {/* Organization Details */}
      {employee.organization_assignment && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Organization Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><span className="font-medium">Company:</span> {employee.organization_assignment.company?.name}</div>
            <div><span className="font-medium">Department:</span> {employee.organization_assignment.department?.name || 'N/A'}</div>
            <div><span className="font-medium">Sub Department:</span> {employee.organization_assignment.sub_department?.name || 'N/A'}</div>
            <div><span className="font-medium">Designation:</span> {employee.organization_assignment.designation?.name}</div>
            <div><span className="font-medium">Date of Joining:</span> {employee.organization_assignment.date_of_joining}</div>
            <div><span className="font-medium">Employment Type:</span> {employee.employment_type?.name}</div>
          </div>
        </div>
      )}

      {/* Compensation Details */}
      {employee.compensation && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold">Compensation Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><span className="font-medium">Basic Salary:</span> Rs. {employee.compensation.basic_salary}</div>
            <div><span className="font-medium">Bank Name:</span> {employee.compensation.bank_name}</div>
            <div><span className="font-medium">Branch Name:</span> {employee.compensation.branch_name}</div>
            <div><span className="font-medium">Account No:</span> {employee.compensation.bank_account_no}</div>
            <div><span className="font-medium">EPF/ETF:</span> {employee.compensation.enable_epf_etf ? 'Enabled' : 'Disabled'}</div>
            <div><span className="font-medium">OT Active:</span> {employee.compensation.ot_active ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Spouse Details */}
      {employee.spouse && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl font-semibold">Spouse Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><span className="font-medium">Name:</span> {employee.spouse.name}</div>
            <div><span className="font-medium">NIC:</span> {employee.spouse.nic}</div>
            <div><span className="font-medium">Age:</span> {employee.spouse.age}</div>
            <div><span className="font-medium">DOB:</span> {employee.spouse.dob}</div>
          </div>
        </div>
      )}

      {/* Children Details */}
      {employee.children && employee.children.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-cyan-600" />
            <h2 className="text-xl font-semibold">Children Details</h2>
          </div>
          <div className="space-y-3">
            {employee.children.map((child, index) => (
              <div key={child.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium mb-2">Child {index + 1}</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {child.name}</div>
                  <div><span className="font-medium">Age:</span> {child.age}</div>
                  <div><span className="font-medium">DOB:</span> {child.dob}</div>
                  <div><span className="font-medium">NIC:</span> {child.nic || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {employee.documents && employee.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold">Documents</h2>
          </div>
          <ul className="space-y-2">
            {employee.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <a 
                  href={`${config.apiBaseUrl}/storage/${doc.document_path}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {doc.document_name} ({doc.document_type})
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
