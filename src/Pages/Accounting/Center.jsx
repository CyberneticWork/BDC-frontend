import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import {
  getCenters,
  addCenter,
  updateCenter,
  deleteCenter
} from '../../services/AccountingService';
import { useResponsive } from '../../hooks/useResponsive';
import {
  ResponsivePageWrapper,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableHeaderCell,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell,
  ResponsiveButton,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveLoadingSpinner,
  ResponsiveBadge,
  ResponsiveModal
} from '../../components/Accounting/ResponsiveAccountingComponents';

const Center = () => {
  const responsive = useResponsive();
  const [centers, setCenters] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    centerName: ''
  });

  useEffect(() => {
    // Load initial data from service
    setCenters(getCenters());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const newCenter = addCenter(formData);
      setCenters(prev => [...prev, newCenter]);
      setFormData({ centerName: '' });
      setShowCreateForm(false);
      setLoading(false);
    }, 500);
  };

  const handleDelete = (id) => {
    deleteCenter(id);
    setCenters(prev => prev.filter(center => center.id !== id));
  };

  const filteredCenters = centers.filter(center =>
    center.centerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actions = (
    <>
      <div className="relative flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <ResponsiveInput
          type="text"
          placeholder="Search centers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full sm:w-64"
        />
      </div>
      <ResponsiveButton 
        variant="primary" 
        size={responsive.isMobile ? 'sm' : 'md'}
        onClick={() => setShowCreateForm(true)}
      >
        <Plus className="h-4 w-4" />
        {responsive.isMobile ? '' : 'Create Center'}
      </ResponsiveButton>
    </>
  );

  return (
    <ResponsivePageWrapper 
      title="Center Management" 
      subtitle="Manage your business centers"
      actions={actions}
    >

      {/* Centers Display */}
      {filteredCenters.length === 0 ? (
        <ResponsiveCard className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Centers Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first center</p>
          <ResponsiveButton
            variant="primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-4 w-4" />
            Create Center
          </ResponsiveButton>
        </ResponsiveCard>
      ) : responsive.isMobile ? (
        /* Mobile View - Card Layout */
        <div className="space-y-4">
          {filteredCenters.map((center) => (
            <ResponsiveCard key={center.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
                    {center.centerName}
                  </h3>
                  <ResponsiveBadge 
                    variant={center.status === 'Active' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {center.status}
                  </ResponsiveBadge>
                </div>
                <div className="ml-4 flex space-x-2 flex-shrink-0">
                  <ResponsiveButton
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-3 w-3" />
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(center.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </ResponsiveButton>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Created: {center.createdDate}
              </p>
            </ResponsiveCard>
          ))}
        </div>
      ) : (
        /* Desktop View - Grid and Table */
        <div className="space-y-8">
          {/* Grid View */}
          <ResponsiveGrid 
            cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            gap="gap-4 sm:gap-6"
          >
            {filteredCenters.map((center) => (
              <ResponsiveCard key={center.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {center.centerName}
                    </h3>
                    <ResponsiveBadge 
                      variant={center.status === 'Active' ? 'success' : 'danger'}
                      size="sm"
                      className="mb-2"
                    >
                      {center.status}
                    </ResponsiveBadge>
                    <p className="text-sm text-gray-500">
                      Created: {center.createdDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <ResponsiveButton
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(center.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ResponsiveButton>
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveGrid>

          {/* Table View */}
          <ResponsiveCard className="mt-8">
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Centers List</h3>
            </div>
            <ResponsiveTable>
              <ResponsiveTableHeader>
                <ResponsiveTableHeaderCell>Center Name</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Status</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Created Date</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Actions</ResponsiveTableHeaderCell>
              </ResponsiveTableHeader>
              <ResponsiveTableBody>
                {filteredCenters.map((center) => (
                  <ResponsiveTableRow key={center.id}>
                    <ResponsiveTableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {center.centerName}
                      </div>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <ResponsiveBadge 
                        variant={center.status === 'Active' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {center.status}
                      </ResponsiveBadge>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      {center.createdDate}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <div className="flex items-center gap-2">
                        <ResponsiveButton
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </ResponsiveButton>
                        <ResponsiveButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(center.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ResponsiveButton>
                      </div>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                ))}
              </ResponsiveTableBody>
            </ResponsiveTable>
          </ResponsiveCard>
        </div>
      )}

      {/* Create Center Modal */}
      <ResponsiveModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Center"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <ResponsiveFormGroup label="Center Name" required>
            <ResponsiveInput
              type="text"
              name="centerName"
              value={formData.centerName}
              onChange={handleInputChange}
              placeholder="Enter center name"
              required
            />
          </ResponsiveFormGroup>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <ResponsiveButton
              type="button"
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
              fullWidth={responsive.isMobile}
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              fullWidth={responsive.isMobile}
            >
              Create Center
            </ResponsiveButton>
          </div>
        </form>
      </ResponsiveModal>
    </ResponsivePageWrapper>
  );
};

export default Center;