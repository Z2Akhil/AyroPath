import { useState, useEffect } from 'react';
import { Mail, CheckCircle, Send, Eye, Users, AlertCircle, History, FileText, Loader } from 'lucide-react';
import NotificationStats from '../components/notifications/NotificationStats';
import NotificationForm from '../components/notifications/NotificationForm';
import UserSelector from '../components/notifications/UserSelector';
import EmailPreview from '../components/notifications/EmailPreview';
import NotificationHistory from '../components/notifications/NotificationHistory';
import { notificationApi } from '../api/notificationApi';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [emailType, setEmailType] = useState('promotional');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    if (activeTab === 'compose') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const response = await notificationApi.getUsersForNotification(1, 50);
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setUsersError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccessMessage('');

      const notificationData = {
        subject: subject.trim(),
        content: content.trim(),
        emailType,
        userIds: selectedUsers.map(user => user._id)
      };

      const response = await notificationApi.sendNotification(notificationData);
      
      if (response.success) {
        setSuccessMessage(`Notification sent successfully to ${selectedUsers.length} user(s)! Notification ID: ${response.data.notificationId}`);
        // Reset form
        setSubject('');
        setContent('');
        setSelectedUsers([]);
        // Refresh stats
        if (activeTab === 'history') {
          // If we're on history tab, we might want to refresh the history list
          // This would require passing a refresh function to NotificationHistory
        }
      } else {
        setError(response.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handlePreview = () => {
    if (!subject.trim()) {
      setError('Subject is required for preview');
      return;
    }
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-100 rounded mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats Cards */}
        <NotificationStats />

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('compose')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'compose'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Compose New
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="h-4 w-4" />
                History
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'compose' ? (
          <>
            {/* Main Content - 2 column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column: Email Composition */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
                </div>
                
                <NotificationForm
                  emailType={emailType}
                  setEmailType={setEmailType}
                  subject={subject}
                  setSubject={setSubject}
                  content={content}
                  setContent={setContent}
                  onPreview={handlePreview}
                />
              </div>

              {/* Right Column: Recipient Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Select Recipients</h2>
                </div>
                
                {usersError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700 text-sm">{usersError}</p>
                    <button
                      onClick={fetchUsers}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                <UserSelector
                  users={users}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  loading={usersLoading}
                  onRefresh={fetchUsers}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Ready to send to <span className="font-semibold text-blue-600">{selectedUsers.length}</span> selected user(s)</p>
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedUsers.slice(0, 3).map(user => user.email).join(', ')}
                      {selectedUsers.length > 3 && ` and ${selectedUsers.length - 3} more...`}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handlePreview}
                    disabled={!subject.trim()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  
                  <button
                    onClick={handleSendNotification}
                    disabled={sending || selectedUsers.length === 0 || !subject.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Preview Modal */}
            {previewOpen && (
              <EmailPreview
                subject={subject}
                content={content}
                emailType={emailType}
                recipientCount={selectedUsers.length}
                onClose={() => setPreviewOpen(false)}
              />
            )}
          </>
        ) : (
          /* History Tab Content */
          <NotificationHistory />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
