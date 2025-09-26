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
  ArrowDownRight
} from "lucide-react";

const CashFlowStatement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [expandedSections, setExpandedSections] = useState({
    operating: true,
    investing: true,
    financing: true
  });
  const [loading, setLoading] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previous-month");

  // Sample cash flow data
  const [cashFlowData, setCashFlowData] = useState({
    operatingActivities: {
      netIncome: 25000,
      depreciationAmortization: 5000,
      changeInAccountsReceivable: -3000,
      changeInInventory: 2000,
      changeInAccountsPayable: 1500,
      changeInAccruedExpenses: 800,
      otherOperatingActivities: -500
    },
    investingActivities: {
      purchaseOfEquipment: -15000,
      saleOfInvestments: 8000,
      purchaseOfInvestments: -5000,
      otherInvestingActivities: 1000
    },
    financingActivities: {
      proceedsFromLongTermDebt: 20000,
      repaymentOfLongTermDebt: -8000,
      dividendsPaid: -5000,
      stockRepurchase: -3000,
      otherFinancingActivities: 500
    },
    beginningCash: 18000
  });

  // Previous period data for comparison
  const previousPeriodData = {
    operatingActivities: {
      netIncome: 22000,
      depreciationAmortization: 4500,
      changeInAccountsReceivable: -2000,
      changeInInventory: 1500,
      changeInAccountsPayable: 1000,
      changeInAccruedExpenses: 600,
      otherOperatingActivities: -300
    },
    investingActivities: {
      purchaseOfEquipment: -10000,
      saleOfInvestments: 5000,
      purchaseOfInvestments: -3000,
      otherInvestingActivities: 500
    },
    financingActivities: {
      proceedsFromLongTermDebt: 15000,
      repaymentOfLongTermDebt: -6000,
      dividendsPaid: -4000,
      stockRepurchase: -2000,
      otherFinancingActivities: 200
    },
    beginningCash: 15000
  };

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
        className={`flex items-center justify-between py-4 px-6 cursor-pointer hover:bg-gray-50 bg-${color}-50 border-l-4 border-${color}-500`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 text-${color}-600`} />
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className={`font-semibold text-${color}-900`}>{title}</span>
        </div>
        <div className="text-right">
          <span className={`font-bold text-lg ${
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
      <div className="flex justify-between py-3 px-12 hover:bg-gray-50 border-l border-gray-200">
        <span className="text-gray-700">{label}</span>
        <div className="text-right">
          <span className={`font-medium ${
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
              <p className="text-gray-600 mt-1">Track cash inflows and outflows for {getPeriodLabel()}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operating Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  currentTotals.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentTotals.operatingCashFlow >= 0 ? '' : '('}
                  {formatCurrency(currentTotals.operatingCashFlow)}
                  {currentTotals.operatingCashFlow < 0 ? ')' : ''}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${
                currentTotals.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Investing Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  currentTotals.investingCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {currentTotals.investingCashFlow >= 0 ? '' : '('}
                  {formatCurrency(currentTotals.investingCashFlow)}
                  {currentTotals.investingCashFlow < 0 ? ')' : ''}
                </p>
              </div>
              <Building className={`h-8 w-8 ${
                currentTotals.investingCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financing Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  currentTotals.financingCashFlow >= 0 ? 'text-purple-600' : 'text-red-600'
                }`}>
                  {currentTotals.financingCashFlow >= 0 ? '' : '('}
                  {formatCurrency(currentTotals.financingCashFlow)}
                  {currentTotals.financingCashFlow < 0 ? ')' : ''}
                </p>
              </div>
              <CreditCard className={`h-8 w-8 ${
                currentTotals.financingCashFlow >= 0 ? 'text-purple-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Change in Cash</p>
                <p className={`text-2xl font-bold ${
                  currentTotals.netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentTotals.netChangeInCash >= 0 ? '+' : '-'}{formatCurrency(currentTotals.netChangeInCash)}
                </p>
              </div>
              {currentTotals.netChangeInCash >= 0 ? (
                <ArrowUpRight className="h-8 w-8 text-green-600" />
              ) : (
                <ArrowDownRight className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div className="flex gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cash Flow Statement</h3>
            <p className="text-sm text-gray-600">For the period: {getPeriodLabel()}</p>
          </div>

          {/* Beginning Cash Balance */}
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="font-semibold text-blue-900">Beginning Cash Balance</span>
              <span className="font-bold text-blue-900">{formatCurrency(currentTotals.beginningCash)}</span>
            </div>
          </div>

          {/* Operating Activities */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Cash Flows from Operating Activities"
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
              title="Cash Flows from Investing Activities"
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
              title="Cash Flows from Financing Activities"
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
          <div className={`${currentTotals.netChangeInCash >= 0 ? 'bg-green-100' : 'bg-red-100'} px-6 py-4 border-b border-gray-200`}>
            <div className="flex justify-between">
              <span className={`font-semibold ${
                currentTotals.netChangeInCash >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                Net Change in Cash
              </span>
              <span className={`font-bold ${
                currentTotals.netChangeInCash >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {currentTotals.netChangeInCash >= 0 ? '+' : ''}{formatCurrency(currentTotals.netChangeInCash)}
              </span>
            </div>
          </div>

          {/* Ending Cash Balance */}
          <div className="bg-blue-100 px-6 py-4">
            <div className="flex justify-between">
              <span className="font-bold text-blue-900 text-lg">Ending Cash Balance</span>
              <span className="font-bold text-blue-900 text-lg">{formatCurrency(currentTotals.endingCash)}</span>
            </div>
          </div>
        </div>

        {/* Cash Flow Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Flow Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Cash Flow Analysis</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Operating Cash Flow Margin</span>
                <span className={`font-semibold ${
                  (currentTotals.operatingCashFlow / 100000) > 0.15 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {((currentTotals.operatingCashFlow / 100000) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Free Cash Flow</span>
                <span className={`font-semibold ${
                  (currentTotals.operatingCashFlow - 15000) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(currentTotals.operatingCashFlow - 15000)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cash Conversion Cycle</span>
                <span className="font-semibold text-blue-600">45 days</span>
              </div>
            </div>
          </div>

          {/* Cash Flow Health Indicators */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Financial Health Indicators</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Operating Cash Flow</span>
                <div className="flex items-center gap-2">
                  {currentTotals.operatingCashFlow > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={currentTotals.operatingCashFlow > 0 ? 'text-green-600' : 'text-red-600'}>
                    {currentTotals.operatingCashFlow > 0 ? 'Positive' : 'Negative'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Investment in Growth</span>
                <div className="flex items-center gap-2">
                  {currentTotals.investingCashFlow < 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={currentTotals.investingCashFlow < 0 ? 'text-green-600' : 'text-yellow-600'}>
                    {currentTotals.investingCashFlow < 0 ? 'Investing' : 'Divesting'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Cash Position</span>
                <div className="flex items-center gap-2">
                  {currentTotals.netChangeInCash >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={currentTotals.netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {currentTotals.netChangeInCash >= 0 ? 'Improving' : 'Declining'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowStatement;
