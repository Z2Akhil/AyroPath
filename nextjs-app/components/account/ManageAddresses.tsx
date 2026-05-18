'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, Loader, X, Check } from 'lucide-react';
import { Address } from '@/types';
import { authApi } from '@/lib/api/authApi';
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

const emptyForm = {
    houseNo: '', roadName: '', area: '', locality: '', city: '', state: '', pincode: '', isDefault: false,
};

export default function ManageAddresses() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
    const openEdit = (addr: Address) => {
        setForm({
            houseNo: addr.houseNo, roadName: addr.roadName || '', area: addr.area || '',
            locality: addr.locality || '', city: addr.city, state: addr.state,
            pincode: addr.pincode, isDefault: addr.isDefault,
        });
        setEditingId(addr._id);
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

    const handleSave = async () => {
        if (!form.houseNo.trim() || !form.city.trim() || !form.state.trim() || !form.pincode) {
            toastError('House no, city, state, and pincode are required');
            return;
        }
        if (!/^\d{6}$/.test(form.pincode)) {
            toastError('Pincode must be exactly 6 digits');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const res = await authApi.updateAddress(editingId, form);
                if (res.success) { toastSuccess('Address updated'); await loadAddresses(); closeForm(); }
                else toastError(res.message || 'Failed to update');
            } else {
                const res = await authApi.addAddress(form);
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" /> Manage Addresses
                </h2>
                {!showForm && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus className="h-4 w-4" /> Add New
                    </button>
                )}
            </div>

            {/* Address Form */}
            {showForm && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                    <h3 className="font-medium text-gray-800 text-sm mb-2">
                        {editingId ? 'Edit Address' : 'Add New Address'}
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">House No / Building Name <span className="text-red-500">*</span></label>
                            <input
                                value={form.houseNo}
                                onChange={e => setForm(f => ({ ...f, houseNo: e.target.value }))}
                                placeholder="e.g. Flat 4B, Sunrise Apartments"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Road Name</label>
                            <input
                                value={form.roadName}
                                onChange={e => setForm(f => ({ ...f, roadName: e.target.value }))}
                                placeholder="e.g. MG Road"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
                            <input
                                value={form.area}
                                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                                placeholder="e.g. Koramangala"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Locality</label>
                            <input
                                value={form.locality}
                                onChange={e => setForm(f => ({ ...f, locality: e.target.value }))}
                                placeholder="e.g. Sector 12"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                            <input
                                value={form.city}
                                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                placeholder="e.g. Bengaluru"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">State <span className="text-red-500">*</span></label>
                            <select
                                value={form.state}
                                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            >
                                <option value="">Select state</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Pincode <span className="text-red-500">*</span></label>
                            <input
                                value={form.pincode}
                                onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                placeholder="6-digit pincode"
                                maxLength={6}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={saving}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={form.isDefault}
                                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded"
                                disabled={saving}
                            />
                            <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editingId ? 'Update' : 'Save Address'}
                        </button>
                        <button
                            onClick={closeForm}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Address List */}
            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader className="animate-spin text-blue-500 h-6 w-6" />
                </div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No addresses saved yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map(addr => (
                        <div
                            key={addr._id}
                            className={`p-4 border rounded-lg flex justify-between gap-3 ${addr.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                            <div className="flex-1 min-w-0">
                                {addr.isDefault && (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold mb-1">
                                        <Star className="w-3 h-3 fill-blue-700" /> Default
                                    </span>
                                )}
                                <p className="text-sm font-medium text-gray-800 leading-snug">
                                    {addr.houseNo}
                                    {addr.roadName && `, ${addr.roadName}`}
                                    {addr.area && `, ${addr.area}`}
                                    {addr.locality && `, ${addr.locality}`}
                                </p>
                                <p className="text-sm text-gray-500">{addr.city}, {addr.state} – {addr.pincode}</p>
                            </div>
                            <div className="flex items-start gap-1 shrink-0">
                                <button
                                    onClick={() => openEdit(addr)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(addr._id)}
                                    disabled={deletingId === addr._id}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deletingId === addr._id
                                        ? <Loader className="h-4 w-4 animate-spin" />
                                        : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
