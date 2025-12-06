import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

const DateRangePicker = ({ 
  onDateChange, 
  loading = false,
  defaultPeriod = 'last30days'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const periods = [
    { id: 'today', label: 'Today', getDates: () => {
      const today = new Date();
      return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    }},
    { id: 'yesterday', label: 'Yesterday', getDates: () => {
      const yesterday = subDays(new Date(), 1);
      return { startDate: format(yesterday, 'yyyy-MM-dd'), endDate: format(yesterday, 'yyyy-MM-dd') };
    }},
    { id: 'last7days', label: 'Last 7 days', getDates: () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      return { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') };
    }},
    { id: 'last30days', label: 'Last 30 days', getDates: () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 29);
      return { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') };
    }},
    { id: 'thismonth', label: 'This month', getDates: () => {
      const startDate = startOfMonth(new Date());
      const endDate = new Date();
      return { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') };
    }},
    { id: 'lastmonth', label: 'Last month', getDates: () => {
      const now = new Date();
      const startDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') };
    }},
    { id: 'thisyear', label: 'This year', getDates: () => {
      const startDate = startOfYear(new Date());
      const endDate = new Date();
      return { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') };
    }},
    { id: 'custom', label: 'Custom range', getDates: () => {
      return { startDate: customStartDate, endDate: customEndDate };
    }}
  ];

  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    
    if (periodId === 'custom') {
      setShowCustomPicker(true);
      return;
    }
    
    setShowCustomPicker(false);
    const period = periods.find(p => p.id === periodId);
    if (period && period.getDates) {
      const dates = period.getDates();
      if (dates.startDate && dates.endDate) {
        onDateChange(dates.startDate, dates.endDate);
      }
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onDateChange(customStartDate, customEndDate);
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateCancel = () => {
    setShowCustomPicker(false);
    setSelectedPeriod(defaultPeriod);
  };

  const selectedPeriodLabel = periods.find(p => p.id === selectedPeriod)?.label || 'Select period';

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
          >
            <span className="text-sm font-medium text-gray-700">{selectedPeriodLabel}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          
          {showCustomPicker && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="p-4">
                <div className="space-y-3">
                  {periods.map((period) => (
                    <button
                      key={period.id}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedPeriod === period.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handlePeriodChange(period.id)}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                
                {selectedPeriod === 'custom' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCustomDateApply}
                          disabled={!customStartDate || !customEndDate}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            !customStartDate || !customEndDate
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Apply
                        </button>
                        <button
                          onClick={handleCustomDateCancel}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop for closing dropdown when clicking outside */}
      {showCustomPicker && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowCustomPicker(false)}
        />
      )}
    </div>
  );
};

export default DateRangePicker;
