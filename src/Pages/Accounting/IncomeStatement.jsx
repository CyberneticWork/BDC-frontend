import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { getIncomeStatementData } from '../../services/AccountingService';

const IncomeStatement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    cogs: true,
    operatingExpenses: true,
    otherIncome: true,
    otherExpenses: true
  });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sample financial data
  const [financialData, setFinancialData] = useState(getIncomeStatementData());

  const calculations = {
    totalRevenue: Object.values(financialData.revenue).reduce((sum, val) => sum + val, 0),
    totalCOGS: Object.values(financialData.costOfGoodsSold).reduce((sum, val) => sum + val, 0),
    totalOperatingExpenses: Object.values(financialData.operatingExpenses).reduce((sum, val) => sum + val, 0),
    totalOtherIncome: Object.values(financialData.otherIncome).reduce((sum, val) => sum + val, 0),
    totalOtherExpenses: Object.values(financialData.otherExpenses).reduce((sum, val) => sum + val, 0)
  };

  calculations.grossProfit = calculations.totalRevenue - calculations.totalCOGS;
  calculations.operatingIncome = calculations.grossProfit - calculations.totalOperatingExpenses;
  calculations.netOtherIncome = calculations.totalOtherIncome - calculations.totalOtherExpenses;
  calculations.netIncome = calculations.operatingIncome + calculations.netOtherIncome;
  calculations.grossProfitMargin = calculations.totalRevenue > 0 ? (calculations.grossProfit / calculations.totalRevenue) * 100 : 0;
  calculations.operatingMargin = calculations.totalRevenue > 0 ? (calculations.operatingIncome / calculations.totalRevenue) * 100 : 0;
  calculations.netProfitMargin = calculations.totalRevenue > 0 ? (calculations.netIncome / calculations.totalRevenue) * 100 : 0;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const exportToPDF = () => {
    // This would typically generate and download a PDF
    console.log('Exporting Income Statement to PDF...');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyCompact = (amount) => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
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

  const SectionHeader = ({ title, amount, isExpanded, onToggle, isSubtotal = false, level = 0 }) => {
    const baseClasses = "flex items-center justify-between py-3 px-3 md:px-4 cursor-pointer hover:bg-gray-50";
    const levelClasses = level > 0 ? 'bg-gray-50 border-l-4 border-blue-500' : 'bg-white border-b border-gray-200';
    const textClasses = isSubtotal ? 'font-semibold text-gray-900' : 'font-medium text-gray-800';
    
    return (
      <div className={`${baseClasses} ${levelClasses}`} onClick={onToggle}>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className={`${textClasses} text-sm md:text-base`}>{title}</span>
        </div>
        <span className={`${textClasses} text-sm md:text-base ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {isMobile ? formatCurrencyCompact(Math.abs(amount)) : formatCurrency(Math.abs(amount))}
        </span>
      </div>
    );
  };

  const LineItem = ({ label, amount, indent = false }) => (
    <div className={`flex justify-between py-2 px-3 md:px-4 ${indent ? 'pl-6 md:pl-12 bg-gray-25' : ''} hover:bg-gray-50`}>
      <span className="text-gray-700 text-sm md:text-base">{label}</span>
      <span className={`font-medium text-sm md:text-base ${amount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
        {isMobile ? formatCurrencyCompact(Math.abs(amount)) : formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );

  const SummaryLine = ({ title, amount, margin, isHighlight = false, isTotal = false }) => (
    <div className={`flex justify-between py-3 px-3 md:px-6 ${
      isTotal ? 
        `${calculations.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}` : 
        isHighlight ? 'bg-blue-50' : 'bg-green-50'
    } border-b border-gray-200`}>
      <span className={`${isTotal ? 'text-xl' : 'text-base'} font-bold ${
        isTotal ? 
          calculations.netIncome >= 0 ? 'text-green-900' : 'text-red-900' :
          isHighlight ? 'text-blue-900' : 'text-green-900'
      }`}>
        {title}
      </span>
      <div className="text-right">
        <div className={`${isTotal ? 'text-xl' : 'text-base'} font-bold ${
          isTotal ? 
            calculations.netIncome >= 0 ? 'text-green-900' : 'text-red-900' :
            isHighlight ? 'text-blue-900' : amount >= 0 ? 'text-green-900' : 'text-red-900'
        }`}>
          {isMobile ? formatCurrencyCompact(Math.abs(amount)) : formatCurrency(Math.abs(amount))}
        </div>
        {margin !== undefined && (
          <div className={`text-xs ${isTotal ? 'text-green-800' : isHighlight ? 'text-blue-800' : 'text-green-800'}`}>
            ({margin.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Income Statement</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Profit & Loss Statement for {getPeriodLabel()}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToPDF}
                className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  {isMobile ? formatCurrencyCompact(calculations.totalRevenue) : formatCurrency(calculations.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Gross Profit</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">
                  {isMobile ? formatCurrencyCompact(calculations.grossProfit) : formatCurrency(calculations.grossProfit)}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{calculations.grossProfitMargin.toFixed(1)}% margin</p>
              </div>
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Operating Income</p>
                <p className={`text-lg md:text-2xl font-bold ${calculations.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isMobile ? formatCurrencyCompact(calculations.operatingIncome) : formatCurrency(calculations.operatingIncome)}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{calculations.operatingMargin.toFixed(1)}% margin</p>
              </div>
              <DollarSign className={`h-6 w-6 md:h-8 md:w-8 ${calculations.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-lg md:text-2xl font-bold ${calculations.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isMobile ? formatCurrencyCompact(calculations.netIncome) : formatCurrency(calculations.netIncome)}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{calculations.netProfitMargin.toFixed(1)}% margin</p>
              </div>
              {calculations.netIncome >= 0 ? (
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base w-full md:w-auto"
            >
              <option value="current-month">Current Month</option>
              <option value="previous-month">Previous Month</option>
              <option value="quarter">Current Quarter</option>
              <option value="ytd">Year to Date</option>
              <option value="previous-year">Previous Year</option>
            </select>
          </div>
        </div>

        {/* Income Statement */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Profit & Loss Statement</h3>
            <p className="text-xs md:text-sm text-gray-600">For the period: {getPeriodLabel()}</p>
          </div>

          {/* Revenue Section */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Revenue"
              amount={calculations.totalRevenue}
              isExpanded={expandedSections.revenue}
              onToggle={() => toggleSection('revenue')}
              isSubtotal
            />
            {expandedSections.revenue && (
              <div className="bg-gray-25">
                {Object.entries(financialData.revenue).map(([key, value]) => (
                  <LineItem
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    amount={value}
                    indent
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cost of Goods Sold */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Cost of Goods Sold"
              amount={-calculations.totalCOGS}
              isExpanded={expandedSections.cogs}
              onToggle={() => toggleSection('cogs')}
              isSubtotal
            />
            {expandedSections.cogs && (
              <div className="bg-gray-25">
                {Object.entries(financialData.costOfGoodsSold).map(([key, value]) => (
                  <LineItem
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    amount={-value}
                    indent
                  />
                ))}
              </div>
            )}
          </div>

          {/* Gross Profit */}
          <SummaryLine
            title="Gross Profit"
            amount={calculations.grossProfit}
            margin={calculations.grossProfitMargin}
            isHighlight
          />

          {/* Operating Expenses */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Operating Expenses"
              amount={-calculations.totalOperatingExpenses}
              isExpanded={expandedSections.operatingExpenses}
              onToggle={() => toggleSection('operatingExpenses')}
              isSubtotal
            />
            {expandedSections.operatingExpenses && (
              <div className="bg-gray-25">
                {Object.entries(financialData.operatingExpenses).map(([key, value]) => (
                  <LineItem
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    amount={-value}
                    indent
                  />
                ))}
              </div>
            )}
          </div>

          {/* Operating Income */}
          <SummaryLine
            title="Operating Income"
            amount={calculations.operatingIncome}
            margin={calculations.operatingMargin}
          />

          {/* Other Income */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Other Income"
              amount={calculations.totalOtherIncome}
              isExpanded={expandedSections.otherIncome}
              onToggle={() => toggleSection('otherIncome')}
              isSubtotal
            />
            {expandedSections.otherIncome && (
              <div className="bg-gray-25">
                {Object.entries(financialData.otherIncome).map(([key, value]) => (
                  <LineItem
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    amount={value}
                    indent
                  />
                ))}
              </div>
            )}
          </div>

          {/* Other Expenses */}
          <div className="border-b border-gray-100">
            <SectionHeader
              title="Other Expenses"
              amount={-calculations.totalOtherExpenses}
              isExpanded={expandedSections.otherExpenses}
              onToggle={() => toggleSection('otherExpenses')}
              isSubtotal
            />
            {expandedSections.otherExpenses && (
              <div className="bg-gray-25">
                {Object.entries(financialData.otherExpenses).map(([key, value]) => (
                  <LineItem
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    amount={-value}
                    indent
                  />
                ))}
              </div>
            )}
          </div>

          {/* Net Income */}
          <SummaryLine
            title="Net Income"
            amount={calculations.netIncome}
            margin={calculations.netProfitMargin}
            isTotal
          />
        </div>

        {/* Financial Health Indicator */}
        <div className="mt-4 md:mt-6 bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h4 className="font-semibold text-gray-900 mb-4 text-base md:text-lg">Financial Health Indicators</h4>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center">
              <div className={`text-lg md:text-2xl font-bold ${
                calculations.grossProfitMargin > 40 ? 'text-green-600' : 
                calculations.grossProfitMargin > 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.grossProfitMargin.toFixed(1)}%
              </div>
              <div className="text-xs md:text-sm text-gray-600">Gross Margin</div>
            </div>
            <div className="text-center">
              <div className={`text-lg md:text-2xl font-bold ${
                calculations.operatingMargin > 15 ? 'text-green-600' : 
                calculations.operatingMargin > 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.operatingMargin.toFixed(1)}%
              </div>
              <div className="text-xs md:text-sm text-gray-600">Operating Margin</div>
            </div>
            <div className="text-center">
              <div className={`text-lg md:text-2xl font-bold ${
                calculations.netProfitMargin > 10 ? 'text-green-600' : 
                calculations.netProfitMargin > 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.netProfitMargin.toFixed(1)}%
              </div>
              <div className="text-xs md:text-sm text-gray-600">Net Margin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;