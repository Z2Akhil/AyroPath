import { Tag, FileText, Type } from 'lucide-react';

const NotificationForm = ({ 
  emailType, 
  setEmailType, 
  subject, 
  setSubject, 
  content, 
  setContent,
  onPreview 
}) => {
  
  const emailTypes = [
    { id: 'promotional', label: 'Promotional', description: 'Special offers, discounts, new services', icon: Tag },
    { id: 'informational', label: 'Informational', description: 'System updates, policy changes, announcements', icon: FileText }
  ];

  const handleEmailTypeChange = (typeId) => {
    setEmailType(typeId);
    setSelectedTemplate('blank');
    setSubject('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Email Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Email Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emailTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = emailType === type.id;
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleEmailTypeChange(type.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            Maximum 100 characters
          </span>
          <span className={`text-xs ${
            subject.length > 90 ? 'text-orange-600' : 'text-gray-500'
          }`}>
            {subject.length}/100
          </span>
        </div>
      </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your plain text email content here..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Plain text only - no HTML or formatting
            </span>
            <span className="text-xs text-gray-500">
              {content.length} characters
            </span>
          </div>
        </div>

      {/* Preview Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onPreview}
          disabled={!subject.trim()}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="h-4 w-4" />
          Preview Email
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Preview how your email will look before sending
        </p>
      </div>
    </div>
  );
};

// Add the missing Eye import
import { Eye } from 'lucide-react';

export default NotificationForm;
