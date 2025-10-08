import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  CreditCard,
  PieChart,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import {
  getBalanceSheetData,
  getPreviousBalanceSheetData
} from '../../services/AccountingService';
import { useResponsive } from '../../hooks/useResponsive';
import {
  ResponsivePageWrapper,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveButton,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveLoadingSpinner,
  ResponsiveBadge,
  ResponsiveAlert
} from '../../components/Accounting/ResponsiveAccountingComponents';

const BalanceSheet = () => {
  const responsive = useResponsive();
  const [selectedDate, setSelectedDate] = useState("2024-01-31");
  const [expandedSections, setExpandedSections] = useState({
    currentAssets: true,
    fixedAssets: true,
    currentLiabilities: true,
    longTermLiabilities: true,
    equity: true
  });
  const [loading, setLoading] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previous-month");

  // Sample balance sheet data
  const [balanceSheetData, setBalanceSheetData] = useState(getBalanceSheetData());

  // Previous period data for comparison
  const previousPeriodData = getPreviousBalanceSheetData();

  const calculateTotals = (data) => {
    const currentAssets = Object.values(data.assets.currentAssets).reduce((sum, val) => sum + val, 0);
    const fixedAssets = Object.values(data.assets.fixedAssets).reduce((sum, val) => sum + val, 0);
    const totalAssets = currentAssets + fixedAssets;
    
    const currentLiabilities = Object.values(data.liabilities.currentLiabilities).reduce((sum, val) => sum + val, 0);
    const longTermLiabilities = Object.values(data.liabilities.longTermLiabilities).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = currentLiabilities + longTermLiabilities;
    
    const totalEquity = Object.values(data.equity).reduce((sum, val) => sum + val, 0);
    
    return {
      currentAssets,
      fixedAssets,
      totalAssets,
      currentLiabilities,
      longTermLiabilities,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
    };
  };

  const currentTotals = calculateTotals(balanceSheetData);
  const previousTotals = calculateTotals(previousPeriodData);

  const calculateChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const exportToPDF = () => {
    console.log('Exporting Balance Sheet to PDF...');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const SectionHeader = ({ title, amount, previousAmount, isExpanded, onToggle, isTotal = false }) => {
    const change = calculateChange(amount, previousAmount);
    const baseClasses = "flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50";
    const levelClasses = isTotal ? 'bg-blue-50 border-t-2 border-blue-500' : 'bg-gray-50 border-b border-gray-200';
    const textClasses = isTotal ? 'font-bold text-blue-900' : 'font-semibold text-gray-900';
    
    return (
      <div className={`${baseClasses} ${levelClasses}`} onClick={onToggle}>
        <div className="flex items-center gap-2">
          {!isTotal && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          )}
          <span className={textClasses}>{title}</span>
        </div>
        <div className="text-right">
          <span className={textClasses}>{formatCurrency(amount)}</span>
          {!isTotal && (
            <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(change)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const LineItem = ({ label, amount, previousAmount, indent = false, isNegative = false }) => {
    const change = calculateChange(amount, previousAmount);
    const displayAmount = isNegative ? -Math.abs(amount) : Math.abs(amount);
    
    return (
      <div className={`flex justify-between py-2 px-4 ${indent ? 'pl-12 bg-gray-25' : ''} hover:bg-gray-50`}>
        <span className="text-gray-700">{label}</span>
        <div className="text-right">
          <span className={`font-medium ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
            {isNegative && '('}{formatCurrency(amount)}{isNegative && ')'}
          </span>
          <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(change)}
          </div>
        </div>
      </div>
    );
  };

  // Calculate key financial ratios
  const ratios = {
    currentRatio: currentTotals.currentAssets / currentTotals.currentLiabilities,
    debtToEquity: currentTotals.totalLiabilities / currentTotals.totalEquity,
    equityRatio: currentTotals.totalEquity / currentTotals.totalAssets,
    workingCapital: currentTotals.currentAssets - currentTotals.currentLiabilities
  };

  const actions = (
    <>
      <ResponsiveButton
        variant="secondary"
        size={responsive.isMobile ? 'sm' : 'md'}
        onClick={handleRefresh}
        loading={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {responsive.isMobile ? '' : 'Refresh'}
      </ResponsiveButton>
      <ResponsiveButton
        variant="primary"
        size={responsive.isMobile ? 'sm' : 'md'}
        onClick={exportToPDF}
      >
        <Download className="h-4 w-4" />
        {responsive.isMobile ? '' : 'Export PDF'}
      </ResponsiveButton>
    </>
  );

  return (
    <ResponsivePageWrapper 
      title="Balance Sheet" 
      subtitle={`Financial position as of ${new Date(selectedDate).toLocaleDateString()}`}
      actions={actions}
    >

      {/* Key Metrics */}
      <ResponsiveGrid 
        cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} 
        gap="gap-4 sm:gap-6" 
        className="mb-4 sm:mb-6"
      >
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Assets</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{formatCurrency(currentTotals.totalAssets)}</p>
            </div>
            <Building className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Liabilities</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatCurrency(currentTotals.totalLiabilities)}</p>
            </div>
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Equity</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(currentTotals.totalEquity)}</p>
            </div>
            <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 ml-2" />
          </div>
        </ResponsiveCard>
        <ResponsiveCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Balance Status</p>
              <p className={`text-base sm:text-lg font-bold truncate ${
                currentTotals.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentTotals.isBalanced ? 'Balanced' : 'Out of Balance'}
              </p>
            </div>
            {currentTotals.isBalanced ? (
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 ml-2" />
            ) : (
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0 ml-2" />
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Date and Comparison Selectors */}
      <ResponsiveCard className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
          <ResponsiveGrid 
            cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} 
            gap="gap-4" 
            className="flex-1"
          >
            <ResponsiveFormGroup label="As of Date">
              <ResponsiveInput
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </ResponsiveFormGroup>
            <ResponsiveFormGroup label="Compare to">
              <ResponsiveSelect
                value={comparisonPeriod}
                onChange={(e) => setComparisonPeriod(e.target.value)}
              >
                <option value="previous-month">Previous Month</option>
                <option value="previous-quarter">Previous Quarter</option>
                <option value="previous-year">Previous Year</option>
              </ResponsiveSelect>
            </ResponsiveFormGroup>
          </ResponsiveGrid>
        </div>
      </ResponsiveCard>

        {/* Balance Sheet */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Balance Sheet</h3>
            <p className="text-sm text-gray-600">As of {new Date(selectedDate).toLocaleDateString()}</p>
          </div>

          {/* ASSETS */}
          <div className="border-b border-gray-200">
            <div className="bg-blue-100 px-6 py-3">
              <h4 className="font-bold text-blue-900 text-lg">ASSETS</h4>
            </div>
            
            {/* Current Assets */}
            <div className="border-b border-gray-100">
              <SectionHeader
                title="Current Assets"
                amount={currentTotals.currentAssets}
                previousAmount={previousTotals.currentAssets}
                isExpanded={expandedSections.currentAssets}
                onToggle={() => toggleSection('currentAssets')}
              />
              {expandedSections.currentAssets && (
                <div className="bg-gray-25">
                  {Object.entries(balanceSheetData.assets.currentAssets).map(([key, value]) => (
                    <LineItem
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      amount={value}
                      previousAmount={previousPeriodData.assets.currentAssets[key]}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Assets */}
            <div className="border-b border-gray-100">
              <SectionHeader
                title="Fixed Assets"
                amount={currentTotals.fixedAssets}
                previousAmount={previousTotals.fixedAssets}
                isExpanded={expandedSections.fixedAssets}
                onToggle={() => toggleSection('fixedAssets')}
              />
              {expandedSections.fixedAssets && (
                <div className="bg-gray-25">
                  {Object.entries(balanceSheetData.assets.fixedAssets).map(([key, value]) => (
                    <LineItem
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      amount={value}
                      previousAmount={previousPeriodData.assets.fixedAssets[key]}
                      isNegative={value < 0}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Total Assets */}
            <SectionHeader
              title="TOTAL ASSETS"
              amount={currentTotals.totalAssets}
              previousAmount={previousTotals.totalAssets}
              isExpanded={false}
              onToggle={() => {}}
              isTotal
            />
          </div>

          {/* LIABILITIES & EQUITY */}
          <div>
            <div className="bg-red-100 px-6 py-3">
              <h4 className="font-bold text-red-900 text-lg">LIABILITIES & EQUITY</h4>
            </div>
            
            {/* Current Liabilities */}
            <div className="border-b border-gray-100">
              <SectionHeader
                title="Current Liabilities"
                amount={currentTotals.currentLiabilities}
                previousAmount={previousTotals.currentLiabilities}
                isExpanded={expandedSections.currentLiabilities}
                onToggle={() => toggleSection('currentLiabilities')}
              />
              {expandedSections.currentLiabilities && (
                <div className="bg-gray-25">
                  {Object.entries(balanceSheetData.liabilities.currentLiabilities).map(([key, value]) => (
                    <LineItem
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      amount={value}
                      previousAmount={previousPeriodData.liabilities.currentLiabilities[key]}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Long-term Liabilities */}
            <div className="border-b border-gray-100">
              <SectionHeader
                title="Long-term Liabilities"
                amount={currentTotals.longTermLiabilities}
                previousAmount={previousTotals.longTermLiabilities}
                isExpanded={expandedSections.longTermLiabilities}
                onToggle={() => toggleSection('longTermLiabilities')}
              />
              {expandedSections.longTermLiabilities && (
                <div className="bg-gray-25">
                  {Object.entries(balanceSheetData.liabilities.longTermLiabilities).map(([key, value]) => (
                    <LineItem
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      amount={value}
                      previousAmount={previousPeriodData.liabilities.longTermLiabilities[key]}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Total Liabilities */}
            <div className="bg-red-50">
              <div className="flex justify-between py-3 px-6 font-semibold text-red-900">
                <span>Total Liabilities</span>
                <span>{formatCurrency(currentTotals.totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="border-b border-gray-100">
              <SectionHeader
                title="Equity"
                amount={currentTotals.totalEquity}
                previousAmount={previousTotals.totalEquity}
                isExpanded={expandedSections.equity}
                onToggle={() => toggleSection('equity')}
              />
              {expandedSections.equity && (
                <div className="bg-gray-25">
                  {Object.entries(balanceSheetData.equity).map(([key, value]) => (
                    <LineItem
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      amount={value}
                      previousAmount={previousPeriodData.equity[key]}
                      isNegative={value < 0}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Total Liabilities & Equity */}
            <SectionHeader
              title="TOTAL LIABILITIES & EQUITY"
              amount={currentTotals.totalLiabilitiesAndEquity}
              previousAmount={previousTotals.totalLiabilitiesAndEquity}
              isExpanded={false}
              onToggle={() => {}}
              isTotal
            />
          </div>
        </div>

        {/* Financial Ratios */}
        <ResponsiveCard className="mb-4 sm:mb-6">
          <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-4 sm:mb-6">Key Financial Ratios</h4>
          <ResponsiveGrid 
            cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} 
            gap="gap-4 sm:gap-6"
          >
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-xl sm:text-2xl font-bold ${
                ratios.currentRatio > 2 ? 'text-green-600' : 
                ratios.currentRatio > 1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {ratios.currentRatio.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Current Ratio</div>
              <div className="text-xs text-gray-500 mt-1">Current Assets / Current Liabilities</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-xl sm:text-2xl font-bold ${
                ratios.debtToEquity < 1 ? 'text-green-600' : 
                ratios.debtToEquity < 2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {ratios.debtToEquity.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Debt-to-Equity</div>
              <div className="text-xs text-gray-500 mt-1">Total Liabilities / Total Equity</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-xl sm:text-2xl font-bold ${
                ratios.equityRatio > 0.5 ? 'text-green-600' : 
                ratios.equityRatio > 0.3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(ratios.equityRatio * 100).toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Equity Ratio</div>
              <div className="text-xs text-gray-500 mt-1">Total Equity / Total Assets</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-xl sm:text-2xl font-bold ${
                ratios.workingCapital > 10000 ? 'text-green-600' : 
                ratios.workingCapital > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatCurrency(ratios.workingCapital)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Working Capital</div>
              <div className="text-xs text-gray-500 mt-1">Current Assets - Current Liabilities</div>
            </div>
          </ResponsiveGrid>
        </ResponsiveCard>

        {/* Balance Check Alert */}
        {!currentTotals.isBalanced && (
          <ResponsiveAlert
            variant="danger"
            title="Balance Sheet is Out of Balance"
            className="mt-4 sm:mt-6"
          >
            Total Assets ({formatCurrency(currentTotals.totalAssets)}) does not equal 
            Total Liabilities & Equity ({formatCurrency(currentTotals.totalLiabilitiesAndEquity)}). 
            Please review your account balances.
          </ResponsiveAlert>
        )}
    </ResponsivePageWrapper>
  );
};

export default BalanceSheet;
