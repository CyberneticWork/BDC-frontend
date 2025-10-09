import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Building,
  CreditCard,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X
} from "lucide-react";
import {
  getCashFlowData,
  getPreviousCashFlowData
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

const CashFlowStatement = () => {
  const responsive = useResponsive();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [expandedSections, setExpandedSections] = useState({
    operating: true,
    investing: true,
    financing: true
  });
  const [loading, setLoading] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previous-month");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample cash flow data
  const [cashFlowData, setCashFlowData] = useState(getCashFlowData());

  // Previous period data for comparison
  const previousPeriodData = getPreviousCashFlowData();

  const calculateTotals = (data) => {
    const operatingCashFlow = Object.values(data.operatingActivities).reduce((sum, val) => sum + val, 0);
    const investingCashFlow = Object.values(data.investingActivities).reduce((sum, val) => sum + val, 0);
    const financingCashFlow = Object.values(data.financingActivities).reduce((sum, val) => sum + val, 0);
    const netChangeInCash = operatingCashFlow + investingCashFlow + financingCashFlow;
    const endingCash = data.beginningCash + netChangeInCash;
    
    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netChangeInCash,
      endingCash,
      beginningCash: data.beginningCash
    };
  };

  const currentTotals = calculateTotals(cashFlowData);
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
    console.log('Exporting Cash Flow Statement to PDF...');
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

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current-month': return 'Current Month';
      case 'previous-month': return 'Previous Month';
      case 'quarter': return 'Current Quarter';
      case 'ytd': return 'Year to Date';
      case 'previous-year': return 'Previous Year';
      default: return 'Current Month';
    }
  };

  const SectionHeader = ({ title, amount, previousAmount, isExpanded, onToggle, icon: Icon, color }) => {
    const change = calculateChange(amount, previousAmount);
    
    return (
      <div 
        className={`flex items-center justify-between py-4 px-4 sm:px-6 cursor-pointer hover:bg-gray-50 bg-${color}-50 border-l-4 border-${color}-500`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600 flex-shrink-0`} />
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className={`font-semibold text-${color}-900 text-sm sm:text-base truncate`}>
            {title}
          </span>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <span className={`font-bold text-sm sm:text-lg ${
            amount >= 0 ? `text-${color}-600` : 'text-red-600'
          }`}>
            {amount >= 0 ? '' : '('}{formatCurrency(amount)}{amount < 0 ? ')' : ''}
          </span>
          <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(change)}
          </div>
        </div>
      </div>
    );
  };

  const LineItem = ({ label, amount, previousAmount, isNegative = false }) => {
    const change = calculateChange(amount, previousAmount);
    const displayAmount = Math.abs(amount);
    
    return (
      <div className="flex justify-between py-3 px-4 sm:px-12 hover:bg-gray-50 border-l border-gray-200">
        <span className="text-gray-700 text-sm sm:text-base pr-2 truncate">{label}</span>
        <div className="text-right flex-shrink-0">
          <span className={`font-medium text-sm sm:text-base ${
            amount >= 0 ? 'text-gray-900' : 'text-red-600'
          }`}>
            {amount < 0 && '('}{formatCurrency(displayAmount)}{amount < 0 && ')'}
          </span>
          <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(change)}
          </div>
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, icon: Icon, color, isPositive }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-lg sm:text-2xl font-bold truncate ${
            isPositive !== undefined 
              ? (isPositive ? 'text-green-600' : 'text-red-600')
              : `text-${color}-600`
          }`}>
            {typeof value === 'string' ? value : (
              <>
                {value >= 0 ? '' : '('}
                {formatCurrency(value)}
                {value < 0 ? ')' : ''}
              </>
            )}
          </p>
        </div>
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ml-2 ${
          isPositive !== undefined
            ? (isPositive ? 'text-green-600' : 'text-red-600')
            : `text-${color}-600`
        }`} />
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <ResponsiveButton
        variant="secondary"
        size={responsive.isMobile ? 'sm' : 'md'}
        onClick={handleRefresh}
        loading={loading}
        className="flex items-center gap-1 sm:gap-2"
      >
        <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
        {responsive.isMobile ? '' : 'Refresh'}
      </ResponsiveButton>
      <ResponsiveButton
        variant="primary"
        size={responsive.isMobile ? 'sm' : 'md'}
        onClick={exportToPDF}
        className="flex items-center gap-1 sm:gap-2"
      >
        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
        {responsive.isMobile ? '' : 'Export PDF'}
      </ResponsiveButton>
    </div>
  );

  return (
    <ResponsivePageWrapper 
      title="Cash Flow Statement" 
      subtitle={`Track cash inflows and outflows for ${getPeriodLabel()}`}
      actions={actions}
    >

      {/* Key Metrics - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <MetricCard
          title="Operating Cash Flow"
          value={currentTotals.operatingCashFlow}
          icon={Activity}
          color="green"
          isPositive={currentTotals.operatingCashFlow >= 0}
        />
        <MetricCard
          title="Investing Cash Flow"
          value={currentTotals.investingCashFlow}
          icon={Building}
          color="blue"
          isPositive={currentTotals.investingCashFlow >= 0}
        />
        <MetricCard
          title="Financing Cash Flow"
          value={currentTotals.financingCashFlow}
          icon={CreditCard}
          color="purple"
          isPositive={currentTotals.financingCashFlow >= 0}
        />
        <MetricCard
          title="Net Change in Cash"
          value={`${currentTotals.netChangeInCash >= 0 ? '+' : '-'}${formatCurrency(currentTotals.netChangeInCash)}`}
          icon={currentTotals.netChangeInCash >= 0 ? ArrowUpRight : ArrowDownRight}
          color={currentTotals.netChangeInCash >= 0 ? "green" : "red"}
        />
      </div>

      {/* Period Filter - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Report Period</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current-month">Current Month</option>
              <option value="previous-month">Previous Month</option>
              <option value="quarter">Current Quarter</option>
              <option value="ytd">Year to Date</option>
              <option value="previous-year">Previous Year</option>
            </select>
            <select
              value={comparisonPeriod}
              onChange={(e) => setComparisonPeriod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="previous-month">Compare to Previous Month</option>
              <option value="previous-quarter">Compare to Previous Quarter</option>
              <option value="previous-year">Compare to Previous Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cash Flow Statement */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cash Flow Statement</h3>
          <p className="text-xs sm:text-sm text-gray-600">For the period: {getPeriodLabel()}</p>
        </div>

        {/* Beginning Cash Balance */}
        <div className="bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-blue-900 text-sm sm:text-base">Beginning Cash Balance</span>
            <span className="font-bold text-blue-900 text-sm sm:text-base">{formatCurrency(currentTotals.beginningCash)}</span>
          </div>
        </div>

        {/* Operating Activities */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title={responsive.isMobile ? "Operating Activities" : "Cash Flows from Operating Activities"}
            amount={currentTotals.operatingCashFlow}
            previousAmount={previousTotals.operatingCashFlow}
            isExpanded={expandedSections.operating}
            onToggle={() => toggleSection('operating')}
            icon={Activity}
            color="green"
          />
          {expandedSections.operating && (
            <div className="bg-green-25">
              {Object.entries(cashFlowData.operatingActivities).map(([key, value]) => (
                <LineItem
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  amount={value}
                  previousAmount={previousPeriodData.operatingActivities[key]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Investing Activities */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title={responsive.isMobile ? "Investing Activities" : "Cash Flows from Investing Activities"}
            amount={currentTotals.investingCashFlow}
            previousAmount={previousTotals.investingCashFlow}
            isExpanded={expandedSections.investing}
            onToggle={() => toggleSection('investing')}
            icon={Building}
            color="blue"
          />
          {expandedSections.investing && (
            <div className="bg-blue-25">
              {Object.entries(cashFlowData.investingActivities).map(([key, value]) => (
                <LineItem
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  amount={value}
                  previousAmount={previousPeriodData.investingActivities[key]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Financing Activities */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title={responsive.isMobile ? "Financing Activities" : "Cash Flows from Financing Activities"}
            amount={currentTotals.financingCashFlow}
            previousAmount={previousTotals.financingCashFlow}
            isExpanded={expandedSections.financing}
            onToggle={() => toggleSection('financing')}
            icon={CreditCard}
            color="purple"
          />
          {expandedSections.financing && (
            <div className="bg-purple-25">
              {Object.entries(cashFlowData.financingActivities).map(([key, value]) => (
                <LineItem
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  amount={value}
                  previousAmount={previousPeriodData.financingActivities[key]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Net Change in Cash */}
        <div className={`${currentTotals.netChangeInCash >= 0 ? 'bg-green-100' : 'bg-red-100'} px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold text-sm sm:text-base ${
              currentTotals.netChangeInCash >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              Net Change in Cash
            </span>
            <span className={`font-bold text-sm sm:text-base ${
              currentTotals.netChangeInCash >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {currentTotals.netChangeInCash >= 0 ? '+' : ''}{formatCurrency(currentTotals.netChangeInCash)}
            </span>
          </div>
        </div>

        {/* Ending Cash Balance */}
        <div className="bg-blue-100 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-blue-900 text-base sm:text-lg">Ending Cash Balance</span>
            <span className="font-bold text-blue-900 text-base sm:text-lg">{formatCurrency(currentTotals.endingCash)}</span>
          </div>
        </div>
      </div>

      {/* Cash Flow Analysis */}
      <ResponsiveCard>
        <ResponsiveGrid cols="grid-cols-1 lg:grid-cols-2" gap="gap-4 sm:gap-6">
          {/* Cash Flow Trends */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Cash Flow Analysis</h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Operating Cash Flow Margin</span>
                <span className={`font-semibold text-sm sm:text-base ${
                  (currentTotals.operatingCashFlow / 100000) > 0.15 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {((currentTotals.operatingCashFlow / 100000) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Free Cash Flow</span>
                <span className={`font-semibold text-sm sm:text-base ${
                  (currentTotals.operatingCashFlow - 15000) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(currentTotals.operatingCashFlow - 15000)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Cash Conversion Cycle</span>
                <span className="font-semibold text-blue-600 text-sm sm:text-base">45 days</span>
              </div>
            </div>
          </div>

          {/* Cash Flow Health Indicators */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Financial Health Indicators</h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Operating Cash Flow</span>
                <div className="flex items-center gap-2">
                  {currentTotals.operatingCashFlow > 0 ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  <span className={`text-xs sm:text-sm ${
                    currentTotals.operatingCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentTotals.operatingCashFlow > 0 ? 'Positive' : 'Negative'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Investment in Growth</span>
                <div className="flex items-center gap-2">
                  {currentTotals.investingCashFlow < 0 ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                  )}
                  <span className={`text-xs sm:text-sm ${
                    currentTotals.investingCashFlow < 0 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {currentTotals.investingCashFlow < 0 ? 'Investing' : 'Divesting'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm sm:text-base">Overall Cash Position</span>
                <div className="flex items-center gap-2">
                  {currentTotals.netChangeInCash >= 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  <span className={`text-xs sm:text-sm ${
                    currentTotals.netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentTotals.netChangeInCash >= 0 ? 'Improving' : 'Declining'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ResponsiveGrid>
      </ResponsiveCard>
    </ResponsivePageWrapper>
  );
};

export default CashFlowStatement;