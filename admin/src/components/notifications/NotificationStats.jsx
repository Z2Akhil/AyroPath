import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, TrendingUp, AlertCircle, Loader } from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';

const NotificationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationApi.getNotificationStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          border: 'border-blue-500',
          icon: 'text-blue-500',
          bg: 'bg-blue-50'
        };
      case 'orange':
        return {
          border: 'border-orange-500',
          icon: 'text-orange-500',
          bg: 'bg-orange-50'
        };
      case 'green':
        return {
          border: 'border-green-500',
          icon: 'text-green-500',
          bg: 'bg-green-50'
        };
      case 'red':
        return {
          border: 'border-red-500',
          icon: 'text-red-500',
          bg: 'bg-red-50'
        };
      default:
        return {
          border: 'border-gray-500',
          icon: 'text-gray-500',
          bg: 'bg-gray-50'
        };
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <Loader className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Error Loading Statistics</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
          <div className="p-3 rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const overall = stats?.overall || {
    totalNotifications: 0,
    totalRecipients: 0,
    totalSent: 0,
    totalFailed: 0,
    completedNotifications: 0
  };

  const successRate = overall.totalRecipients > 0 
    ? Math.round((overall.totalSent / overall.totalRecipients) * 100)
    : 0;

  const pendingNotifications = overall.totalNotifications - overall.completedNotifications;

  const statCards = [
    {
      title: 'Total Notifications',
      value: overall.totalNotifications.toString(),
      change: `${overall.completedNotifications} completed`,
      icon: Mail,
      color: 'blue',
      description: 'Total notifications sent'
    },
    {
      title: 'Total Recipients',
      value: overall.totalRecipients.toString(),
      change: `${overall.totalSent} sent • ${overall.totalFailed} failed`,
      icon: Clock,
      color: 'orange',
      description: 'Total email recipients'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      change: successRate >= 90 ? 'Excellent' : successRate >= 70 ? 'Good' : 'Needs improvement',
      icon: CheckCircle,
      color: successRate >= 90 ? 'green' : successRate >= 70 ? 'orange' : 'red',
      description: 'Overall delivery success rate'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const colorClasses = getColorClasses(stat.color);
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${colorClasses.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <span className={`text-sm ${
                      stat.color === 'green' ? 'text-green-600' : 
                      stat.color === 'red' ? 'text-red-600' : 
                      'text-orange-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-full ${colorClasses.bg}`}>
                <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationStats;
