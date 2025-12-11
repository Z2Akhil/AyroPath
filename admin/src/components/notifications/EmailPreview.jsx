import { X, Mail, Smartphone, Monitor, Send, Clock, Users } from 'lucide-react';

const EmailPreview = ({ subject, content, emailType, recipientCount, onClose }) => {
  const getEmailTypeLabel = (type) => {
    switch (type) {
      case 'promotional':
        return 'Promotional Email';
      case 'informational':
        return 'Informational Email';
      case 'custom':
        return 'Custom Email';
      default:
        return 'Email';
    }
  };

  const formatContent = (text) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Email Preview</h2>
              <p className="text-sm text-gray-600">Preview how your email will appear to recipients</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Preview Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Desktop</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Mobile</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{recipientCount} recipient(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Will send immediately</span>
              </div>
            </div>
          </div>

          {/* Email Preview Container */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Email Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">AyroPath</h3>
                    <p className="text-blue-100 text-sm">Health Diagnostics</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {getEmailTypeLabel(emailType)}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-8 bg-white">
              {/* Subject */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{subject || 'No subject'}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>{`From: AyroPath <noreply@ayropath.com>`}</span>
                  <span>To: {recipientCount} recipient(s)</span>
                </div>
              </div>

              {/* Content */}
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {content ? formatContent(content) : 'No content provided'}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">AyroPath Team</h4>
                    <p className="text-sm text-gray-600">Your trusted health diagnostics partner</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>AyroPath Health Diagnostics</p>
                  <p>123 Health Street, Medical City, MC 12345</p>
                  <p>Contact: admin@ayropath.com | Phone:+91 9973956949</p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-400">
                    This email was sent to you as a registered user of AyroPath.
                    If you no longer wish to receive these emails, you can update your preferences in your account settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Preview (Collapsed by default) */}
          <div className="mt-6">
            <details className="group">
              <summary className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Mobile Preview</span>
                </div>
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                <div className="w-64 mx-auto border-2 border-gray-800 rounded-3xl p-2 bg-gray-900">
                  <div className="h-12 bg-gray-800 rounded-t-2xl flex items-center justify-center">
                    <div className="h-1 w-16 bg-gray-700 rounded"></div>
                  </div>
                  <div className="h-[400px] bg-white p-4 overflow-y-auto">
                    <div className="mb-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="mt-6 text-center text-xs text-gray-500">
                      Mobile preview - content appears here
                    </div>
                  </div>
                  <div className="h-8 bg-gray-800 rounded-b-2xl"></div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>This is a preview. No email will be sent until you confirm.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>

              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
                title="Backend integration required"
              >
                <Send className="h-4 w-4" />
                Send Now
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 text-center">
              ⚠️ This is a UI prototype. The "Send Now" button is disabled until backend integration is implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
