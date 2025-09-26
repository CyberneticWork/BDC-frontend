import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { 
  getAccountList, 
  addAccount, 
  updateAccount, 
  deleteAccount, 
  addAccountCategory, 
  addAccountGroup,
  getAccountCategories,
  getAccountGroups 
} from "../../services/AccountingService";

// Chart of Account Modal Component
const ChartOfAccountModal = ({ isOpen, onClose, onSave, editAccount = null }) => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountSubCategory: "",
    accountGroup: "",
    openingBalance: ""
  });

  const accountSubCategories = [
    "Income",
    "Current Liabilities", 
    "Fix Assets",
    "Current Assets",
    "Expenses",
    "Non Current Liabilities"
  ];

  const accountGroups = [
    "Bank",
    "Investors Accounts", 
    "Payable",
    "Receivable",
    "Inventory",
    "Income",
    "Distribution Expenses"
  ];

  useEffect(() => {
    if (editAccount) {
      setFormData({
        accountName: editAccount.accountName || "",
        accountSubCategory: editAccount.accountSubCategory || "",
        accountGroup: editAccount.accountGroup || "",
        openingBalance: editAccount.openingBalance || ""
      });
    } else {
      setFormData({
        accountName: "",
        accountSubCategory: "",
        accountGroup: "",
        openingBalance: ""
      });
    }
  }, [editAccount, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.accountName && formData.accountSubCategory && formData.accountGroup) {
      onSave({
        ...formData,
        id: editAccount ? editAccount.id : Date.now(),
        openingBalance: parseFloat(formData.openingBalance) || 0
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {editAccount ? "Edit Chart of Account" : "Create Chart of Account"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart of Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter account name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Sub Category
            </label>
            <select
              value={formData.accountSubCategory}
              onChange={(e) => setFormData({...formData, accountSubCategory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Sub Category</option>
              {accountSubCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Group
            </label>
            <select
              value={formData.accountGroup}
              onChange={(e) => setFormData({...formData, accountGroup: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Account Group</option>
              {accountGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => setFormData({...formData, openingBalance: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter opening balance"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

  const accountTypes = [
    "EQUITY",
    "EXPENSES", 
    "LIABILITIES",
    "INCOME",
    "ASSETS"
  ];

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        accountType: "",
        accountCategoryName: ""
      });
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Account Category
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({...formData, accountType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Category Name
            </label>
            <input
              type="text"
              value={formData.accountCategoryName}
              onChange={(e) => setFormData({...formData, accountCategoryName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter category name"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Account Group Modal Component
const AccountGroupModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    accountGroupName: ""
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        accountGroupName: ""
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.accountGroupName) {
      onSave({
        ...formData,
        id: Date.now()
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Account Group
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Group Name
            </label>
            <input
              type="text"
              value={formData.accountGroupName}
              onChange={(e) => setFormData({...formData, accountGroupName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Account List Component
const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const accountList = getAccountList();
    setAccounts(accountList);
  };

  const handleCreateAccount = (accountData) => {
    addAccount(accountData);
    loadAccounts();
  };

  const handleUpdateAccount = (accountData) => {
    updateAccount(accountData.id, accountData);
    loadAccounts();
    setEditingAccount(null);
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      deleteAccount(accountId);
      loadAccounts();
    }
  };

  const handleCreateCategory = (categoryData) => {
    addAccountCategory(categoryData);
    // You can add a success message here
    alert("Account Category created successfully!");
  };

  const handleCreateGroup = (groupData) => {
    addAccountGroup(groupData);
    // You can add a success message here
    alert("Account Group created successfully!");
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsChartModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account List</h1>
        <p className="text-gray-600">Manage your chart of accounts, categories, and groups</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setIsChartModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Chart of Account
        </button>
        
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Account Category
        </button>
        
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Account Group
        </button>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No accounts found. Create your first account to get started.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.accountName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {account.accountSubCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {account.accountGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${account.openingBalance?.toLocaleString() || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      </div>

      {/* Modals */}
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
      
      <AccountGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleCreateGroup}
      />
    </div>
  );
};

export default AccountList;