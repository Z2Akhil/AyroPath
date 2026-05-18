'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Plus, Trash2, Star, Loader, X, Check, AlertCircle } from 'lucide-react';
import { Address } from '@/types';
import { authApi } from '@/lib/api/authApi';
import { checkPincode } from '@/lib/api/clientApi';
import { useToast } from '@/providers/ToastProvider';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
    'Ladakh','Lakshadweep','Puducherry',
];

const emptyForm = { pincode: '', address: '', city: '', state: '', isDefault: false };
type PincodeStatus = 'idle' | 'checking' | 'ok' | 'unavailable' | 'error';

const INPUT = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:opacity-60';
const LABEL = 'block text-xs font-semibold text-gray-500 mb-1';

export default function ManageAddresses() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Pincode availability state
    const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>('idle');
    const [pincodeMsg, setPincodeMsg] = useState('');
    const checkedPin = useRef('');

    const loadAddresses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await authApi.getAddresses();
            if (res.success) setAddresses(res.addresses || []);
        } catch {
            toastError('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAddresses(); }, [loadAddresses]);

    // Auto-check pincode serviceability when 6 digits are entered
    useEffect(() => {
        if (form.pincode.length !== 6) {
            setPincodeStatus('idle');
            setPincodeMsg('');
            return;
        }
        if (form.pincode === checkedPin.current) return;

        let cancelled = false;
        checkedPin.current = form.pincode;
        setPincodeStatus('checking');
        setPincodeMsg('');

        checkPincode(form.pincode)
            .then(res => {
                if (cancelled) return;
                if (res?.status === 'Y') {
                    setPincodeStatus('ok');
                    setPincodeMsg('Available in your area');
                } else {
                    setPincodeStatus('unavailable');
                    setPincodeMsg('Sorry, we don\'t service this pincode yet');
                }
            })
            .catch(() => {
                if (cancelled) return;
                setPincodeStatus('error');
                setPincodeMsg('Could not verify pincode — please try again');
            });

        return () => { cancelled = true; };
    }, [form.pincode]);

    const openAdd = () => {
        setForm(emptyForm);
        setEditingId(null);
        setPincodeStatus('idle');
        setPincodeMsg('');
        checkedPin.current = '';
        setShowForm(true);
    };

    const openEdit = (addr: Address) => {
        // Combine all address parts into a single field
        const combined = [addr.houseNo, addr.roadName, addr.area, addr.locality]
            .filter(Boolean).join(', ');
        setForm({
            pincode: addr.pincode,
            address: combined,
            city: addr.city,
            state: addr.state,
            isDefault: addr.isDefault,
        });
        // Assume saved addresses had valid pincodes
        checkedPin.current = addr.pincode;
        setPincodeStatus('ok');
        setPincodeMsg('Available in your area');
        setEditingId(addr._id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setPincodeStatus('idle');
        setPincodeMsg('');
        checkedPin.current = '';
    };

    const canSave = pincodeStatus === 'ok'
        && form.address.trim()
        && form.city.trim()
        && form.state;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const payload = {
                houseNo: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                isDefault: form.isDefault,
            };
            if (editingId) {
                const res = await authApi.updateAddress(editingId, payload);
                if (res.success) { toastSuccess('Address updated'); await loadAddresses(); closeForm(); }
                else toastError(res.message || 'Failed to update');
            } else {
                const res = await authApi.addAddress(payload);
                if (res.success) { toastSuccess('Address added'); await loadAddresses(); closeForm(); }
                else toastError(res.message || 'Failed to add');
            }
        } catch (e: any) {
            toastError(e.message || 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await authApi.deleteAddress(id);
            if (res.success) { toastSuccess('Address removed'); setAddresses(a => a.filter(x => x._id !== id)); }
            else toastError(res.message || 'Failed to delete');
        } catch {
            toastError('Failed to delete address');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> Saved Addresses
                </h2>
                {!showForm && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add New
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="px-4 sm:px-5 py-4 border-b border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {editingId ? 'Edit Address' : 'New Address'}
                    </p>

                    {/* Pincode — first, triggers availability check */}
                    <div>
                        <label className={LABEL}>
                            Pincode <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.pincode}
                                onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                placeholder="6-digit pincode"
                                maxLength={6}
                                className={`${INPUT} pr-10 ${
                                    pincodeStatus === 'unavailable' || pincodeStatus === 'error'
                                        ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
                                        : pincodeStatus === 'ok'
                                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-400'
                                        : ''
                                }`}
                                disabled={saving}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {pincodeStatus === 'checking' && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
                                {pincodeStatus === 'ok' && <Check className="w-4 h-4 text-emerald-500" />}
                                {(pincodeStatus === 'unavailable' || pincodeStatus === 'error') && <AlertCircle className="w-4 h-4 text-red-400" />}
                            </div>
                        </div>
                        {pincodeMsg && (
                            <p className={`text-[11px] mt-1 font-medium ${
                                pincodeStatus === 'ok' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                                {pincodeMsg}
                            </p>
                        )}
                        {pincodeStatus === 'unavailable' && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Try a nearby pincode or check back later.
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <label className={LABEL}>
                            Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            placeholder="House no, street, area…"
                            className={INPUT}
                            disabled={saving || pincodeStatus !== 'ok'}
                        />
                    </div>

                    {/* City + State side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={LABEL}>
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                placeholder="City"
                                className={INPUT}
                                disabled={saving || pincodeStatus !== 'ok'}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                State <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.state}
                                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                                className={INPUT}
                                disabled={saving || pincodeStatus !== 'ok'}
                            >
                                <option value="">Select</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Default checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={form.isDefault}
                            onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                            className="w-4 h-4 rounded text-blue-600 border-gray-300"
                            disabled={saving}
                        />
                        <span className="text-xs font-medium text-gray-600">Set as default address</span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleSave}
                            disabled={saving || !canSave}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {saving ? 'Saving…' : editingId ? 'Update' : 'Save Address'}
                        </button>
                        <button
                            onClick={closeForm}
                            disabled={saving}
                            className="flex items-center justify-center gap-1.5 px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Address list */}
            <div className="px-4 sm:px-5 py-4">
                {loading ? (
                    <div className="flex justify-center py-5">
                        <Loader className="animate-spin text-blue-500 h-5 w-5" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-7">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-xs text-gray-400 font-medium">No addresses saved yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {addresses.map(addr => (
                            <div
                                key={addr._id}
                                className={`p-3.5 border rounded-xl flex justify-between gap-3 ${
                                    addr.isDefault ? 'border-blue-200 bg-blue-50/60' : 'border-gray-100 bg-gray-50/50'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    {addr.isDefault && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold mb-1">
                                            <Star className="w-2.5 h-2.5 fill-blue-700" /> Default
                                        </span>
                                    )}
                                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                                        {[addr.houseNo, addr.roadName, addr.area, addr.locality].filter(Boolean).join(', ')}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{addr.city}, {addr.state} – {addr.pincode}</p>
                                </div>
                                <div className="flex items-start gap-1 shrink-0">
                                    <button
                                        onClick={() => openEdit(addr)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr._id)}
                                        disabled={deletingId === addr._id}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === addr._id
                                            ? <Loader className="h-3.5 w-3.5 animate-spin" />
                                            : <Trash2 className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
