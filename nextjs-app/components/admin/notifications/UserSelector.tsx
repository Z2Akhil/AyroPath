'use client';

import React, { useState, useMemo } from 'react';
import { Search, Users, Check, RefreshCw, Filter, User, Globe, MousePointer2 } from 'lucide-react';

interface UserSelectorProps {
    users: any[];
    selectedUsers: any[];
    setSelectedUsers: (users: any[]) => void;
    loading?: boolean;
    onRefresh: () => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
    users,
    selectedUsers,
    setSelectedUsers,
    loading = false,
    onRefresh
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectionMode, setSelectionMode] = useState<'single' | 'multiple' | 'all'>('multiple');

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.mobile?.includes(searchTerm);

            if (filterType === 'all') return matchesSearch;
            if (filterType === 'active') return matchesSearch && user.isActive !== false;
            if (filterType === 'inactive') return matchesSearch && user.isActive === false;
            if (filterType === 'verified') return matchesSearch && user.isVerified;
            return matchesSearch && user.role === filterType;
        });
    }, [users, searchTerm, filterType]);

    const toggleUser = (user: any) => {
        if (selectionMode === 'single') {
            setSelectedUsers([user]);
            return;
        }

        const isSelected = selectedUsers.some(u => u._id === user._id);
        if (isSelected) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const selectAllFiltered = () => {
        if (selectionMode === 'single') return;
        const newSelected = [...selectedUsers];
        filteredUsers.forEach(user => {
            if (!newSelected.some(u => u._id === user._id)) {
                newSelected.push(user);
            }
        });
        setSelectedUsers(newSelected);
    };

    const deselectAllFiltered = () => {
        const filteredIds = new Set(filteredUsers.map(u => u._id));
        setSelectedUsers(selectedUsers.filter(u => !filteredIds.has(u._id)));
    };

    const handleAllUsersMode = () => {
        setSelectionMode('all');
        setSelectedUsers([...users]);
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Selection Mode Tabs */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { id: 'single', label: 'Single', icon: MousePointer2 },
                    { id: 'multiple', label: 'Multiple', icon: Users },
                    { id: 'all', label: 'All Users', icon: Globe }
                ].map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => {
                            setSelectionMode(mode.id as any);
                            if (mode.id === 'all') setSelectedUsers([...users]);
                            else if (selectionMode === 'all') setSelectedUsers([]);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border-2 ${selectionMode === mode.id
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                            }`}
                    >
                        <mode.icon className="h-3.5 w-3.5" />
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, email or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                    />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['all', 'active', 'inactive', 'verified'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterType === type
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Selection Stats */}
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Found {filteredUsers.length} matches
                </p>
                {selectionMode !== 'single' && (
                    <div className="flex gap-4">
                        <button onClick={selectAllFiltered} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Select Page</button>
                        <button onClick={deselectAllFiltered} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest">Clear Filtered</button>
                    </div>
                )}
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto max-h-[450px] pr-2 space-y-2.5 custom-scrollbar">
                {loading && users.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-[20px] animate-pulse"></div>
                    ))
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4 border-2 border-dashed border-gray-100 rounded-[32px]">
                        <User className="h-10 w-10 opacity-10" />
                        <p className="text-sm font-bold opacity-50">No users match your criteria</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const isSelected = selectedUsers.some(u => u._id === user._id);
                        return (
                            <button
                                key={user._id}
                                onClick={() => toggleUser(user)}
                                className={`w-full group text-left p-4 rounded-[20px] transition-all duration-300 border-2 ${isSelected
                                    ? 'bg-blue-50/50 border-blue-500 shadow-lg shadow-blue-500/5'
                                    : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black transition-transform group-active:scale-90 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {user.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="overflow-hidden space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-bold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                    {user.name}
                                                </p>
                                                {user.role === 'admin' && (
                                                    <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md uppercase">Admin</span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${isSelected ? 'text-blue-600/70' : 'text-gray-400 font-medium'}`}>
                                                {user.email} • {user.mobile || 'No Phone'}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected ? (
                                        <div className="bg-blue-600 rounded-xl p-1.5 text-white shadow-md shadow-blue-500/30">
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-lg border-2 border-gray-100 group-hover:border-gray-200 transition-colors"></div>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Selected Footer */}
            <div className="pt-2">
                <div className={`p-4 rounded-[24px] transition-all duration-500 border ${selectedUsers.length > 0
                    ? 'bg-gray-900 border-gray-800 text-white shadow-xl shadow-gray-900/20'
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedUsers.length > 0 ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1.5">Recipients Selected</p>
                                <p className="text-xl font-black leading-none">{selectedUsers.length}</p>
                            </div>
                        </div>
                        {selectedUsers.length > 0 && (
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="text-[10px] font-black text-red-400 hover:text-red-300 py-2 px-3 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-widest"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSelector;
