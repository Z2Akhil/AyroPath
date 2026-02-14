'use client';

import React from 'react';
import { X, Smartphone, Monitor, Mail, User, Info } from 'lucide-react';

interface EmailPreviewProps {
    subject: string;
    content: string;
    emailType: string;
    recipientCount: number;
    onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
    subject,
    content,
    emailType,
    recipientCount,
    onClose
}) => {
    const [device, setDevice] = React.useState<'mobile' | 'desktop'>('desktop');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <EyeIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Notification Preview</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${emailType === 'promotional' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {emailType}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <User className="h-2.5 w-2.5" /> {recipientCount} Recipients
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Device Toggle */}
                        <div className="bg-white border border-gray-100 rounded-xl p-1 flex shadow-sm">
                            <button
                                onClick={() => setDevice('desktop')}
                                className={`p-2 rounded-lg transition-all duration-200 ${device === 'desktop' ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Monitor className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setDevice('mobile')}
                                className={`p-2 rounded-lg transition-all duration-200 ${device === 'mobile' ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Smartphone className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-1 bg-gray-100/50 flex flex-col">
                    {/* Metadata Display */}
                    <div className="mx-auto w-full max-w-[800px] p-4">
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3 mb-4">
                            <div className="flex gap-4 items-start">
                                <span className="text-xs font-bold text-gray-400 uppercase w-16 pt-0.5">Subject</span>
                                <p className="text-sm font-bold text-gray-900">{subject || 'No Subject Defined'}</p>
                            </div>
                            <div className="flex gap-4 items-start">
                                <span className="text-xs font-bold text-gray-400 uppercase w-16 pt-0.5">From</span>
                                <p className="text-sm font-medium text-gray-600">AyroPath Admin &lt;noreply@ayropath.com&gt;</p>
                            </div>
                        </div>

                        {/* Email Body Frame */}
                        <div
                            className={`mx-auto bg-white shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${device === 'mobile' ? 'max-w-[375px] rounded-[32px]' : 'max-w-full rounded-2xl'
                                }`}
                            style={{ minHeight: '500px' }}
                        >
                            {/* Internal Browser Frame logic for Mobile */}
                            {device === 'mobile' && (
                                <div className="h-10 border-b border-gray-50 flex items-center justify-center gap-1">
                                    <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
                                </div>
                            )}

                            <div className="p-8">
                                {/* Brand Logo Placeholder */}
                                <div className="flex justify-center mb-8">
                                    <div className="h-10 w-32 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 tracking-tighter">
                                        AYROPATH
                                    </div>
                                </div>

                                {/* Main Content Render */}
                                <div
                                    className="prose prose-sm max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">No content written yet...</p>' }}
                                />

                                {/* Footer Section */}
                                <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                        © 2026 AyroPath Healthcare. All rights reserved.<br />
                                        You are receiving this because you are a registered user of AyroPath.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-full">
                        <Info className="h-3.5 w-3.5" />
                        Recipients will see their own names if [USER_NAME] tag is used
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                    >
                        Finished Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

const EyeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export default EmailPreview;
