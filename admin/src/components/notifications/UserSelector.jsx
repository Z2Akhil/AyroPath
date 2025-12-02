import React, { useState, useEffect } from 'react';
import { Search, Check, User, Mail, Phone, Filter, Users, UserCheck, Globe, ChevronLeft, ChevronRight, Loader, RefreshCw } from 'lucide-react';

const UserSelector = ({ users, selectedUsers, setSelectedUsers, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectionMode, setSelectionMode] = useState('multiple'); // 'single', 'multiple', 'all'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive', 'verified'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter users based on search term and active filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobileNumber?.includes(searchTerm);
    
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && user.isActive) ||
      (activeFilter === 'inactive' && !user.isActive) ||
      (activeFilter === 'verified' && user.emailVerified);
    
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  const handleSelectAllOnPage = () => {
    const pageUserIds = paginatedUsers.map(user => user._id);
    const allPageSelected = pageUserIds.every(id => 
      selectedUsers.some(user => user._id === id)
    );
    
    if (allPageSelected) {
      // Deselect all users on current page
      setSelectedUsers(prev => 
        prev.filter(user => !pageUserIds.includes(user._id))
      );
    } else {
      // Select all users on current page
      const usersToAdd = paginatedUsers.filter(user => 
        !selectedUsers.some(selected => selected._id === user._id)
      );
      setSelectedUsers(prev => [...prev, ...usersToAdd]);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleUserSelect = (userId) => {
    if (selectionMode === 'single') {
      // For single selection, replace the selection
      const user = users.find(u => u._id === userId);
      setSelectedUsers(user ? [user] : []);
    } else {
      // For multiple selection, toggle selection
      setSelectedUsers(prev => {
        const isSelected = prev.some(user => user._id === userId);
        if (isSelected) {
          return prev.filter(user => user._id !== userId);
        } else {
          const user = users.find(u => u._id === userId);
          return user ? [...prev, user] : prev;
        }
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      // Deselect all
      setSelectedUsers([]);
    } else {
      // Select all filtered users
      setSelectedUsers([...filteredUsers]);
    }
  };

  const handleSelectAllUsers = () => {
    setSelectionMode('all');
    setSelectedUsers([...users]);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getVerificationColor = (emailVerified) => {
    return emailVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Mode Tabs */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectionMode('single');
              setSelectedUsers([]);
            }}
            className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectionMode === 'single'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Single User</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setSelectionMode('multiple');
              setSelectedUsers([]);
            }}
            className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectionMode === 'multiple'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Multiple Users</span>
          </button>
          
          <button
            type="button"
            onClick={handleSelectAllUsers}
            className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectionMode === 'all'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">All Users</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Refresh users list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filter:
          </span>
          {['all', 'active', 'inactive', 'verified'].map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' && 'All Users'}
              {filter === 'active' && 'Active Only'}
              {filter === 'inactive' && 'Inactive Only'}
              {filter === 'verified' && 'Verified Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {selectedUsers.length} user(s) selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAllOnPage}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select/Deselect Page
            </button>
            <span className="text-gray-400">|</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Selected users:</p>
            <div className="flex flex-wrap gap-1">
              {selectedUsers.slice(0, 5).map(user => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs"
                >
                  <User className="h-3 w-3 text-gray-500" />
                  {user.firstName} {user.lastName}
                  <button
                    type="button"
                    onClick={() => handleUserSelect(user._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedUsers.length > 5 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  +{selectedUsers.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No users found matching your search</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedUsers.map(user => {
                const isSelected = selectedUsers.some(selected => selected._id === user._id);
                
                return (
                  <div
                    key={user._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleUserSelect(user._id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div className={`flex-shrink-0 h-5 w-5 border rounded flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      
                      {/* User Avatar */}
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.firstName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getVerificationColor(user.emailVerified)}`}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{user.mobileNumber || 'No phone'}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {filteredUsers.length > itemsPerPage && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
            </p>
            <p className="text-xs text-gray-600">
              {selectedUsers.length} selected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
