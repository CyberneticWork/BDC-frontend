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
  ChevronRight
} from "lucide-react";

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

  // Sample financial data
  const [financialData, setFinancialData] = useState({
    revenue: {
      salesRevenue: 85000,
      serviceRevenue: 25000,
      otherRevenue: 3000
    },
    costOfGoodsSold: {
      directMaterials: 20000,
      directLabor: 15000,
      manufacturingOverhead: 8000
    },
    operatingExpenses: {
      salariesAndWages: 18000,
      rentExpense: 6000,
      utilitiesExpense: 2500,
      advertisingExpense: 4000,
      insuranceExpense: 1500,
      depreciationExpense: 3000,
      officeSupplies: 800,
      professionalFees: 2200
    },
    otherIncome: {
      interestIncome: 500,
      dividendIncome: 200,
      gainOnSale: 1500
    },
    otherExpenses: {
      interestExpense: 1200,
      lossOnSale: 300
    }
  });

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
  calculations.grossProfitMargin = (calculations.grossProfit / calculations.totalRevenue) * 100;
  calculations.operatingMargin = (calculations.operatingIncome / calculations.totalRevenue) * 100;
  calculations.netProfitMargin = (calculations.netIncome / calculations.totalRevenue) * 100;

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
    const baseClasses = "flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50";
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
          <span className={textClasses}>{title}</span>
        </div>
        <span className={`${textClasses} ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(Math.abs(amount))}
        </span>
      </div>
    );
  };

  const LineItem = ({ label, amount, indent = false }) => (
    <div className={`flex justify-between py-2 px-4 ${indent ? 'pl-12 bg-gray-25' : ''} hover:bg-gray-50`}>
      <span className="text-gray-700">{label}</span>
      <span className={`font-medium ${amount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Income Statement</h1>
              <p className="text-gray-600 mt-1">Profit & Loss Statement for {getPeriodLabel()}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculations.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculations.grossProfit)}</p>
                <p className="text-sm text-gray-500">{calculations.grossProfitMargin.toFixed(1)}% margin</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operating Income</p>
                <p className={`text-2xl font-bold ${calculations.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.operatingIncome)}
                </p>
                <p className="text-sm text-gray-500">{calculations.operatingMargin.toFixed(1)}% margin</p>
              </div>
              <DollarSign className={`h-8 w-8 ${calculations.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${calculations.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.netIncome)}
                </p>
                <p className="text-sm text-gray-500">{calculations.netProfitMargin.toFixed(1)}% margin</p>
              </div>
              {calculations.netIncome >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
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
          </div>
        </div>

        {/* Income Statement */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Statement</h3>
            <p className="text-sm text-gray-600">For the period: {getPeriodLabel()}</p>
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
          <div className="bg-blue-50 border-b border-gray-200">
            <div className="flex justify-between py-3 px-6">
              <span className="font-semibold text-blue-900">Gross Profit</span>
              <span className="font-bold text-blue-900">
                {formatCurrency(calculations.grossProfit)} ({calculations.grossProfitMargin.toFixed(1)}%)
              </span>
            </div>
          </div>

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
          <div className="bg-green-50 border-b border-gray-200">
            <div className="flex justify-between py-3 px-6">
              <span className="font-semibold text-green-900">Operating Income</span>
              <span className={`font-bold ${calculations.operatingIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {formatCurrency(calculations.operatingIncome)} ({calculations.operatingMargin.toFixed(1)}%)
              </span>
            </div>
          </div>

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
          <div className={`${calculations.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex justify-between py-4 px-6">
              <span className={`text-xl font-bold ${calculations.netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                Net Income
              </span>
              <span className={`text-xl font-bold ${calculations.netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {formatCurrency(calculations.netIncome)} ({calculations.netProfitMargin.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Financial Health Indicator */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Financial Health Indicators</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                calculations.grossProfitMargin > 40 ? 'text-green-600' : 
                calculations.grossProfitMargin > 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.grossProfitMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Gross Profit Margin</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                calculations.operatingMargin > 15 ? 'text-green-600' : 
                calculations.operatingMargin > 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.operatingMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Operating Margin</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                calculations.netProfitMargin > 10 ? 'text-green-600' : 
                calculations.netProfitMargin > 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.netProfitMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Net Profit Margin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
