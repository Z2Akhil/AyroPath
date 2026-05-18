'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/providers/ToastProvider';
import { CheckCircle2, Loader2, Mail, RefreshCw, User } from 'lucide-react';

interface LoginFormProps {
    onClose: () => void;
    onSwitchToRegister?: () => void;
    onForgotPassword?: () => void;
}

// Six individual OTP boxes with auto-advance, backspace, paste support
const OtpBoxes = ({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
}) => {
    const r0 = useRef<HTMLInputElement>(null);
    const r1 = useRef<HTMLInputElement>(null);
    const r2 = useRef<HTMLInputElement>(null);
    const r3 = useRef<HTMLInputElement>(null);
    const r4 = useRef<HTMLInputElement>(null);
    const r5 = useRef<HTMLInputElement>(null);
    const refs = [r0, r1, r2, r3, r4, r5];

    const focus = (i: number) => refs[i]?.current?.focus();

    const handleChange = (i: number, char: string) => {
        const digit = char.replace(/\D/g, '').slice(-1);
        const arr = value.split('');
        arr[i] = digit;
        const next = arr.join('').padEnd(6, '').slice(0, 6);
        onChange(next);
        if (digit && i < 5) focus(i + 1);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (value[i]) {
                const arr = value.split('');
                arr[i] = '';
                onChange(arr.join('').padEnd(6, '').slice(0, 6));
            } else if (i > 0) {
                focus(i - 1);
            }
        } else if (e.key === 'ArrowLeft' && i > 0) {
            focus(i - 1);
        } else if (e.key === 'ArrowRight' && i < 5) {
            focus(i + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(digits.padEnd(6, '').slice(0, 6));
        focus(Math.min(digits.length, 5));
    };

    return (
        <div className="flex gap-2.5 justify-center">
            {Array.from({ length: 6 }, (_, i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={e => e.target.select()}
                    disabled={disabled}
                    className={`
                        w-11 h-12 text-center text-lg font-bold border-2 rounded-xl
                        transition-all duration-150 outline-none bg-white
                        ${value[i]
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-800'}
                        focus:border-blue-500 focus:bg-blue-50
                        disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                />
            ))}
        </div>
    );
};

export default function LoginForm({ onClose }: LoginFormProps) {
    const { loginWithOTP, registerWithOTP, requestOTP } = useUser();
    const { success: toastSuccess } = useToast();

    // Phases within one single card
    const [phase, setPhase] = useState<'number' | 'otp' | 'name'>('number');

    const [mobile, setMobile] = useState('');
    const [otpValue, setOtpValue] = useState('      '); // 6 spaces = 6 empty boxes
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [showEmail, setShowEmail] = useState(false);

    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState('');

    const otpRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startTimer = (seconds = 60) => {
        setTimer(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    // Auto-send OTP when 10 digits are complete
    useEffect(() => {
        if (mobile.length === 10 && phase === 'number' && !sendingOtp && !otpSent) {
            sendOtp();
        }
    }, [mobile]);

    // Auto-verify when all 6 OTP digits are filled
    useEffect(() => {
        const filled = otpValue.trim().length === 6 && !/\s/.test(otpValue);
        if (filled && phase === 'otp' && !verifying) {
            verifyOtp();
        }
    }, [otpValue]);

    // Scroll OTP section into view
    useEffect(() => {
        if (phase === 'otp') {
            setTimeout(() => otpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
        }
        if (phase === 'name') {
            setTimeout(() => nameRef.current?.focus(), 200);
        }
    }, [phase]);

    const sendOtp = useCallback(async () => {
        setError('');
        setSendingOtp(true);
        try {
            const result = await requestOTP(mobile, 'login');
            if (result.success) {
                setOtpSent(true);
                setOtpValue('      ');
                setPhase('otp');
                startTimer();
            } else {
                setError(result.message || 'Could not send OTP. Try again.');
            }
        } catch {
            setError('Could not send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    }, [mobile, requestOTP]);

    const resendOtp = async () => {
        if (timer > 0) return;
        setError('');
        setOtpValue('      ');
        await sendOtp();
        toastSuccess('OTP resent');
    };

    const verifyOtp = useCallback(async () => {
        setError('');
        setVerifying(true);
        try {
            const result = await loginWithOTP(mobile, otpValue.trim());
            if (result.success && !result.isNewUser) {
                toastSuccess('Signed in!');
                onClose();
            } else if (result.success && result.isNewUser) {
                setPhase('name');
            } else {
                setOtpValue('      ');
                setError(result.message || 'Incorrect OTP. Try again.');
            }
        } catch {
            setOtpValue('      ');
            setError('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    }, [mobile, otpValue, loginWithOTP, onClose, toastSuccess]);

    const handleSubmitName = async () => {
        if (!name.trim()) { setError('Please enter your name'); return; }
        setError('');
        setSubmitting(true);
        try {
            const result = await registerWithOTP(mobile, name.trim(), showEmail && email.trim() ? email.trim() : undefined);
            if (result.success) {
                toastSuccess('Welcome to AyroPath!');
                onClose();
            } else {
                setError(result.message || 'Registration failed. Try again.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const changeMobile = () => {
        setMobile('');
        setOtpValue('      ');
        setOtpSent(false);
        setPhase('number');
        setError('');
    };

    return (
        <div className="space-y-6">
            {/* Branding */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Sign in / Sign up</h2>
                <p className="text-sm text-gray-500 mt-0.5">Enter your mobile to continue</p>
            </div>

            {/* Mobile field — always visible */}
            <div>
                <div className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white
                    transition-colors duration-200
                    ${phase !== 'number' ? 'border-green-400 bg-green-50' : 'border-gray-200 focus-within:border-blue-500'}
                `}>
                    <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>
                    <div className="w-px h-5 bg-gray-200 shrink-0" />
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={mobile}
                        onChange={e => {
                            if (phase === 'number') {
                                setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setError('');
                            }
                        }}
                        placeholder="Mobile number"
                        maxLength={10}
                        disabled={phase !== 'number' || sendingOtp}
                        className="flex-1 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 outline-none disabled:text-gray-700"
                        autoFocus
                    />
                    {sendingOtp && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
                    {phase !== 'number' && !sendingOtp && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                </div>

                {/* Change number link */}
                {phase !== 'number' && (
                    <button
                        onClick={changeMobile}
                        className="mt-1.5 ml-1 text-xs text-blue-600 hover:underline"
                    >
                        Change number
                    </button>
                )}
            </div>

            {/* OTP section — slides in after OTP sent */}
            {(phase === 'otp' || phase === 'name') && (
                <div ref={otpRef} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 text-center">
                            {phase === 'otp'
                                ? verifying ? 'Verifying…' : 'Enter the 6-digit OTP sent to your number'
                                : <span className="text-green-600 font-medium flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Mobile verified</span>
                            }
                        </p>

                        <OtpBoxes
                            value={otpValue}
                            onChange={setOtpValue}
                            disabled={verifying || phase === 'name'}
                        />

                        {phase === 'otp' && (
                            <div className="text-center">
                                {verifying ? (
                                    <span className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying…
                                    </span>
                                ) : (
                                    <button
                                        onClick={resendOtp}
                                        disabled={timer > 0}
                                        className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1 mx-auto"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Name section — slides in for new users */}
            {phase === 'name' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="h-px bg-gray-100" />
                    <p className="text-sm font-medium text-gray-700">Looks like you're new here! What should we call you?</p>

                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={nameRef}
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && !showEmail && handleSubmitName()}
                            placeholder="Your name"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-sm bg-white transition-colors"
                            disabled={submitting}
                        />
                    </div>

                    {!showEmail ? (
                        <button
                            type="button"
                            onClick={() => setShowEmail(true)}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                        >
                            <Mail className="w-3.5 h-3.5" /> Add email (optional)
                        </button>
                    ) : (
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email address (optional)"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-sm bg-white transition-colors"
                                disabled={submitting}
                                autoFocus
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSubmitName}
                        disabled={submitting || !name.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                            : 'Get Started →'}
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-red-600 text-center animate-in fade-in duration-200">{error}</p>
            )}

            {/* Footer */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline hover:text-gray-600" onClick={onClose}>Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="underline hover:text-gray-600" onClick={onClose}>Privacy Policy</a>
            </p>
        </div>
    );
}
