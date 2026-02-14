'use client';

import React from 'react';
import { Mail, Type, FileText, Eye, Tag } from 'lucide-react';

interface NotificationFormProps {
    emailType: string;
    setEmailType: (type: string) => void;
    subject: string;
    setSubject: (subject: string) => void;
    content: string;
    setContent: (content: string) => void;
    onPreview: () => void;
}

const NotificationForm: React.FC<NotificationFormProps> = ({
    emailType,
    setEmailType,
    subject,
    setSubject,
    content,
    setContent,
    onPreview
}) => {
    return (
        <div className="space-y-6">
            {/* Email Type Selection */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-blue-500" /> Notification Category
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        {
                            id: 'promotional',
                            label: 'Promotional',
                            description: 'Special offers, discounts, new services',
                            icon: Tag,
                            color: 'blue'
                        },
                        {
                            id: 'informational',
                            label: 'Informational',
                            description: 'System updates, policy changes, announcements',
                            icon: FileText,
                            color: 'indigo'
                        }
                    ].map((type) => {
                        const Icon = type.icon;
                        const isSelected = emailType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setEmailType(type.id)}
                                className={`p-4 rounded-2xl text-left transition-all duration-300 border-2 flex gap-4 ${isSelected
                                    ? `border-${type.color}-500 bg-${type.color}-50/50 shadow-lg shadow-${type.color}-500/10`
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? `bg-${type.color}-500 text-white` : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className={`font-bold text-sm ${isSelected ? `text-${type.color}-900` : 'text-gray-900'}`}>
                                        {type.label}
                                    </p>
                                    <p className="text-[11px] font-medium leading-relaxed opacity-70">
                                        {type.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Subject Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Type className="h-3 w-3" /> Subject Line
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter the notification subject..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm font-medium"
                    />
                </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Message Content
                    </label>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg uppercase border border-amber-100/50">Plain Text Preferred</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium mb-2 ml-1">Avoid HTML tags to ensure maximum email client compatibility.</p>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Compose your message here..."
                    rows={10}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm font-medium resize-none font-mono"
                />
            </div>

            <div className="pt-2">
                <button
                    onClick={onPreview}
                    disabled={!subject.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-bold disabled:opacity-50"
                >
                    <Eye className="h-4 w-4" />
                    Live Preview
                </button>
            </div>
        </div>
    );
};

export default NotificationForm;
