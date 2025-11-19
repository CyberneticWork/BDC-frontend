import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, DollarSign, Tag, Users } from "lucide-react";
import {
  addAccount,
  getAccountList,
  updateAccount,
  deleteAccount,
  //addAccountGroup,
  //getAccountGroups
} from "../../services/Account/AccountService";

// Shared utilities for account types and sub-categories
const accountTypes = [
  "EQUITY",
  "EXPENSES",
  "LIABILITIES",
  "INCOME",
  "ASSETS"
];

const getAccountSubCategories = (accountType) => {
  switch (accountType) {
    case "ASSETS":
      return [
        "Bank Accounts",
        "Cash On Hand",
        "Accounts Receivables",
        "Fixed Assets",
        "Inventory"
      ];
    case "LIABILITIES":
      return {
        "Current Liabilities": [
          "Accounts Payable",
          "Credit Card Payables",
          "Accrued Liabilities",
          "Customer Deposits"
        ],
        "Long-term Liabilities": [
          "Notes Payable"
        ]
      };
    case "EQUITY":
      return [
        "Common Stock",
        "Retained Earnings",
        "Shareholders' Equity",
        "Draws"
      ];
    case "INCOME":
      return [
        "Sales",
        "Interest Income"
      ];
    case "EXPENSES":
      return [
        "Cost Of Goods Sold(COGS)",
        "Depreciation Expense",
        "Other Expenses"
      ];
    default:
      return [];
  }
};

// Chart of Account Modal Component
const ChartOfAccountModal = ({ isOpen, onClose, onSave, editAccount = null }) => {
  const [formData, setFormData] = useState({
    accountNumber: "",
    accountName: "",
    accountType: "",
    accountSubCategory: "",
    openingBalance: "",
  });

  useEffect(() => {
    if (editAccount) {
      setFormData({
        accountNumber: editAccount.accountNumber || "",
        accountName: editAccount.accountName || "",
        accountType: editAccount.accountType || "",
        accountSubCategory: editAccount.accountSubCategory || "",
        openingBalance: editAccount.openingBalance || "",
      });
    } else {
      setFormData({
        accountNumber: "",
        accountName: "",
        accountType: "",
        accountSubCategory: "",
        openingBalance: "",
      });
    }
  }, [editAccount, isOpen]);

  const handleAccountTypeChange = (accountType) => {
    setFormData({
      ...formData,
      accountType,
      accountSubCategory: "", // Reset sub-category when type changes
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.accountName && formData.accountType && formData.accountSubCategory) {
      const balanceType = ["ASSETS", "EXPENSES"].includes(formData.accountType) ? "DEBIT" : "CREDIT";
      onSave({
        ...formData,
        id: editAccount ? editAccount.id : Date.now(),
        openingBalance: parseFloat(formData.openingBalance) || 0,
        balanceType,
      });
      onClose();
    }
  };

  const balanceLabel = formData.accountType
    ? ["ASSETS", "EXPENSES"].includes(formData.accountType)
      ? "Debit"
      : "Credit"
    : "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {editAccount ? "Edit Chart of Account" : "Create Chart of Account"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart of Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
              placeholder="Enter account name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Category
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
              required
            >
              <option value="">Select Account Type</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {formData.accountType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Sub Category
              </label>
              <select
                value={formData.accountSubCategory}
                onChange={(e) => setFormData({ ...formData, accountSubCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
                required
              >
                <option value="">Select Sub Category</option>
                {formData.accountType === "LIABILITIES" ? (
                  <>
                    <optgroup label="Current Liabilities">
                      {getAccountSubCategories("LIABILITIES")["Current Liabilities"].map((subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Long-term Liabilities">
                      {getAccountSubCategories("LIABILITIES")["Long-term Liabilities"].map((subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  getAccountSubCategories(formData.accountType).map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Balance ({balanceLabel})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
              placeholder="Enter opening balance"
              disabled={!!editAccount}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm md:text-base"
            >
              {editAccount ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Account Category Modal Component
const AccountCategoryModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    accountType: "",
    accountCategoryName: ""
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        accountType: "",
        accountCategoryName: ""
      });
    }
  }, [isOpen]);

  const handleAccountTypeChange = (accountType) => {
    setFormData({
      ...formData,
      accountType,
      accountSubCategory: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.accountType && formData.accountCategoryName) {
      onSave({
        ...formData,
        id: Date.now()
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Create Account Category
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Category
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
              required
            >
              <option value="">Select Account Type</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {formData.accountType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Sub Category
              </label>
              <select
                value={formData.accountSubCategory}
                onChange={(e) => setFormData({ ...formData, accountSubCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
                required
              >
                <option value="">Select Sub Category</option>
                {formData.accountType === "LIABILITIES" ? (
                  <>
                    <optgroup label="Current Liabilities">
                      {getAccountSubCategories("LIABILITIES")["Current Liabilities"].map((subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Long-term Liabilities">
                      {getAccountSubCategories("LIABILITIES")["Long-term Liabilities"].map((subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  getAccountSubCategories(formData.accountType).map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm md:text-base"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
{}
// Account Group Modal Component (unchanged)
//  const AccountGroupModal = ({ isOpen, onClose, onSave }) => {
//   const [formData, setFormData] = useState({
//     accountGroupName: ""
//   });

//   useEffect(() => {
//     if (!isOpen) {
//       setFormData({
//         accountGroupName: ""
//       });
//     }
//   }, [isOpen]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (formData.accountGroupName) {
//       onSave({
//         ...formData,
//         id: Date.now()
//       });
//       onClose();
//     }
//   };

//   // const handleAccountGroupSubmit = (e) => {
//   //   e.preventDefault();
//   //   // console.log(formData.accountGroupName)
//   //   try {
//   //     addAccountGroup(formData.accountGroupName.trim())
//   //     alert("Group create Successfull")
//   //     onClose();
//   //   }catch(e) {
//   //     console.log(e)
//   //   }
   

//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg md:text-xl font-semibold text-gray-900">
//               Create Account Group
//             </h3>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 p-1"
//             >
//               <X className="h-5 w-5 md:h-6 md:w-6" />
//             </button>
//           </div>
//         </div>

//         <form className="p-4 md:p-6 space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Account Group Name
//             </label>
//             <input
//               type="text"
//               value={formData.accountGroupName}
//               onChange={(e) => setFormData({ ...formData, accountGroupName: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 text-sm md:text-base"
//               placeholder="Enter group name"
//               required
//             />
//           </div>

//           <div className="flex flex-col sm:flex-row gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm md:text-base"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleAccountGroupSubmit}
//               className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm md:text-base"
//             >
//               Create
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// Main Account List Component
const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountList = await getAccountList();
      setAccounts(accountList);
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (accountData) => {
    try {
      await addAccount(accountData);
      await loadAccounts();
      alert('Account created successfully!');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account');
    }
  };

  const handleUpdateAccount = async (accountData) => {
    try {
      await updateAccount(accountData.id, accountData);
      await loadAccounts();
      setEditingAccount(null);
      alert('Account updated successfully!');
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await deleteAccount(accountId);
        await loadAccounts();
        alert('Account deleted successfully!');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account');
      }
    }
  };

  const handleCreateCategory = (categoryData) => {
    addAccountCategory(categoryData);
    alert("Account Category created successfully!");
  };

  // const handleCreateGroup = (groupData) => {
  //   addAccountGroup(groupData);
  //   alert("Account Group created successfully!");
  // };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsChartModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Account List</h1>
        <p className="text-sm md:text-base text-gray-600">Manage your chart of accounts, categories, and groups</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setIsChartModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Create Chart of Account
        </button>
        {/* 
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Create Account Category
        </button>
        */}
        {/* 
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Create Account Group
        </button>
        */}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isMobile ? (
          <div className="divide-y divide-gray-200">
            {accounts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No accounts found.</p>
                <p className="text-xs text-gray-400 mt-1">Create your first account to get started.</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {account.accountName}
                      </h3>
                      <p className="text-xs text-gray-600">{account.accountType}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Edit Account"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3 text-blue-500" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {account.accountSubCategory}
                      </span>
                    </div>

                    {/* <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-green-500" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {account.accountGroup}
                      </span>
                    </div> */}

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span>${account.openingBalance?.toLocaleString() || "0.00"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sub Category
                  </th>
                 {/* <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Group
                  </th>*/}
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opening Balance
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-gray-500">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>No accounts found. Create your first account to get started.</p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountNumber}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountName}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {account.accountType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {account.accountSubCategory}
                        </span>
                      </td>
                      {/*<td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {account.accountGroup}
                        </span>
                      </td>*/}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${account.openingBalance?.toLocaleString() || "0.00"}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditAccount(account)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Account"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ChartOfAccountModal
        isOpen={isChartModalOpen}
        onClose={() => {
          setIsChartModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={editingAccount ? handleUpdateAccount : handleCreateAccount}
        editAccount={editingAccount}
      />

      <AccountCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleCreateCategory}
      />

      {/* 
      <AccountGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleCreateGroup}
      />
      */}
    </div>
  );
};

export default AccountList;