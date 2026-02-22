'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';

interface DateRangePickerProps {
    onDateChange: (startDate: string, endDate: string) => void;
    loading?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDateChange, loading = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState('Last Year');
    const [customDates, setCustomDates] = useState({
        startDate: '',
        endDate: ''
    });

    const ranges = [
        {
            label: 'Today', getValue: () => {
                const today = new Date().toISOString().split('T')[0];
                return { start: today, end: today };
            }
        },
        {
            label: 'Last 7 Days', getValue: () => {
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return { start, end };
            }
        },
        {
            label: 'Last 30 Days', getValue: () => {
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return { start, end };
            }
        },
        {
            label: 'Last 90 Days', getValue: () => {
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return { start, end };
            }
        },
        {
            label: 'Last Year', getValue: () => {
                const end = new Date().toISOString().split('T')[0];
                const d = new Date();
                d.setFullYear(d.getFullYear() - 1);
                const start = d.toISOString().split('T')[0];
                return { start, end };
            }
        },
        {
            label: 'This Month', getValue: () => {
                const now = new Date();
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                return { start, end };
            }
        },
        { label: 'Custom Range', getValue: () => ({ start: customDates.startDate, end: customDates.endDate }) }
    ];

    const handleRangeSelect = (range: any) => {
        setSelectedRange(range.label);
        if (range.label !== 'Custom Range') {
            const { start, end } = range.getValue();
            onDateChange(start, end);
            setIsOpen(false);
        }
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customDates.startDate && customDates.endDate) {
            onDateChange(customDates.startDate, customDates.endDate);
            setIsOpen(false);
        }
    };

    // Initial load — fire with the default 'Last Year' range
    useEffect(() => {
        const defaultRange = ranges.find(r => r.label === 'Last Year');
        if (defaultRange) {
            const { start, end } = defaultRange.getValue();
            onDateChange(start, end);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all duration-200 text-sm font-medium text-gray-700"
                >
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{selectedRange === 'Custom Range' && customDates.startDate ? `${customDates.startDate} - ${customDates.endDate}` : selectedRange}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                    onClick={() => {
                        const range = ranges.find(r => r.label === selectedRange);
                        if (range) {
                            const { start, end } = range.getValue();
                            onDateChange(start, end);
                        }
                    }}
                    disabled={loading}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:text-blue-600 hover:border-blue-500 transition-all duration-200 disabled:opacity-50"
                    title="Refresh statistics"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 overflow-hidden">
                        {ranges.map((range) => (
                            <button
                                key={range.label}
                                onClick={() => handleRangeSelect(range)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 hover:bg-blue-50 ${selectedRange === range.label ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-700'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}

                        {selectedRange === 'Custom Range' && (
                            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50">
                                <form onSubmit={handleCustomSubmit} className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                                        <input
                                            type="date"
                                            value={customDates.startDate}
                                            onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                                        <input
                                            type="date"
                                            value={customDates.endDate}
                                            onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Apply Range
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DateRangePicker;
