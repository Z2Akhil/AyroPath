'use client';

import React, { useState, useEffect } from 'react';
import {
    X, User, Package, Calendar, Clock, MapPin, Phone, Mail,
    AlertCircle, CheckCircle, Search, Info, ShoppingBag, Plus, Trash2, ChevronRight, ChevronLeft,
    Users, FileText, RefreshCw
} from 'lucide-react';
import { axiosInstance } from '@/lib/api/axiosInstance';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { CustomerUser } from '@/types/admin';

interface Product {
    _id: string;
    code: string;
    Id?: string;
    name: string;
    type: string;
    sellingPrice?: number;
    price: number;
    thyrocareRate?: number;
    b2cRate?: number;
    originalPrice?: number;
}

interface Beneficiary {
    name: string;
    age: string;
    gender: string;
}

interface BookOrderModalProps {
    user: CustomerUser;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

const BookOrderModal: React.FC<BookOrderModalProps> = ({ user, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    // Form states
    const [selectedPackages, setSelectedPackages] = useState<Product[]>([]);
    const [packages, setPackages] = useState<Product[]>([]);
    const [packageSearch, setPackageSearch] = useState('');
    const [packageLoading, setPackageLoading] = useState(false);
    const [hardCopyReport, setHardCopyReport] = useState(false);

    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
        { name: `${user.firstName} ${user.lastName || ''}`.trim(), age: '', gender: 'Male' }
    ]);

    const [contactInfo, setContactInfo] = useState({
        email: user.email || '',
        mobile: user.mobileNumber || '',
        address: {
            street: '', // Will be filled by user
            city: '',
            state: '',
            pincode: '',
            mobile: user.mobileNumber || ''
        }
    });

    const [pincodeStatus, setPincodeStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({ checking: false, available: null, message: '' });

    const [appointment, setAppointment] = useState({
        date: '',
        slot: '',
        slotId: ''
    });

    const [slots, setSlots] = useState<any[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [checkoutPricing, setCheckoutPricing] = useState<any>(null);
    const [pricingLoading, setPricingLoading] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setPackageLoading(true);
        try {
            const response = await axiosInstance.get('/client/products?type=ALL');
            if (response.data.success) {
                setPackages(response.data.products || []);
            }
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError('Failed to load packages');
        } finally {
            setPackageLoading(false);
        }
    };

    const togglePackage = (pkg: Product) => {
        const isSelected = selectedPackages.some(p => p.code === pkg.code || p._id === pkg._id);
        if (isSelected) {
            setSelectedPackages(selectedPackages.filter(p => p.code !== pkg.code && p._id !== pkg._id));
        } else {
            setSelectedPackages([...selectedPackages, pkg]);
        }
    };

    const checkPincode = async (pincode: string) => {
        if (!pincode || pincode.length !== 6) return;
        setPincodeStatus(prev => ({ ...prev, checking: true, message: '' }));
        try {
            const response = await axiosInstance.get(`/client/pincode/${pincode}`);
            if (response.data.success && response.data.data?.status === 'Y') {
                setPincodeStatus({ checking: false, available: true, message: '✅ Service available at this pincode' });
            } else {
                setPincodeStatus({ checking: false, available: false, message: '❌ Service not available at this pincode' });
            }
        } catch (err) {
            setPincodeStatus({ checking: false, available: false, message: '⚠️ Failed to verify pincode' });
        }
    };

    const fetchCheckoutPricing = async () => {
        if (selectedPackages.length === 0) return;

        setPricingLoading(true);
        try {
            const items = selectedPackages.map(pkg => ({
                productCode: pkg.code,
                productType: pkg.type?.toUpperCase() || 'TEST',
                sellingPrice: pkg.sellingPrice || pkg.price || 0,
                thyrocareRate: pkg.thyrocareRate || pkg.b2cRate || pkg.price || 0
            }));

            const response = await axiosInstance.post('/cart/get-checkout-pricing', {
                benCount: beneficiaries.length,
                items: items
            });

            if (response.data.success) {
                setCheckoutPricing(response.data);
            }
        } catch (err) {
            console.error('Error fetching checkout pricing:', err);
            setCheckoutPricing(null);
        } finally {
            setPricingLoading(false);
        }
    };

    const fetchSlots = async (date: string) => {
        if (!date || !contactInfo.address.pincode || selectedPackages.length === 0) return;

        setSlotsLoading(true);
        setSlots([]);
        setError('');

        try {
            const patients = beneficiaries.map((b, i) => ({
                Id: i + 1,
                Name: b.name,
                Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
                Age: parseInt(b.age),
            }));

            const items = selectedPackages.map((p) => ({
                Id: p.code,
                PatientQuantity: beneficiaries.length,
                PatientIds: beneficiaries.map((_, i) => i + 1),
            }));

            const payload = {
                pincode: contactInfo.address.pincode,
                date: date,
                patients,
                BenCount: beneficiaries.length,
                items,
            };

            const response = await axiosInstance.post('/client/appointment-slots', payload);

            if (response.data.success && response.data.data?.respId === "RES00001") {
                setSlots(response.data.data.lSlotDataRes || []);
            } else {
                setSlots([]);
                setError(response.data.data?.response || 'No slots available for this location/date');
            }
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError('Failed to fetch appointment slots. Please ensure pincode and beneficiaries are correct.');
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleNextStep = () => {
        if (step === 1 && selectedPackages.length === 0) {
            setError('Please select at least one package');
            return;
        }
        if (step === 2) {
            if (beneficiaries.some(b => !b.name || !b.age || !b.gender)) {
                setError('Please fill all beneficiary details');
                return;
            }
            if (!contactInfo.address.street || !contactInfo.address.city || !contactInfo.address.pincode) {
                setError('Please fill address details');
                return;
            }
            if (pincodeStatus.available !== true) {
                setError('Collection not available at this pincode');
                return;
            }
        }
        setError('');
        setStep(step + 1);

        if (step + 1 === 3) {
            fetchCheckoutPricing();
        }
    };

    const handleSubmit = async () => {
        if (!appointment.date || !appointment.slot) {
            setError('Please select an appointment date and slot');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const passon = checkoutPricing?.totalDiscount
                ? checkoutPricing.totalDiscount
                : selectedPackages.reduce((sum, p) => {
                    const original = p.originalPrice || p.thyrocareRate || p.b2cRate || p.price || 0;
                    const selling = p.sellingPrice || p.price || 0;
                    return sum + (original - selling);
                }, 0) * beneficiaries.length;

            const payload = {
                userId: user._id,
                packageIds: selectedPackages.map(p => p.code),
                packageNames: selectedPackages.map(p => p.name),
                packagePrices: selectedPackages.map(p => ({
                    price: p.sellingPrice || p.price || 0,
                    originalPrice: p.thyrocareRate || p.b2cRate || p.originalPrice || p.price || 0,
                    thyrocareRate: p.thyrocareRate || p.b2cRate || p.price || 0
                })),
                beneficiaries: beneficiaries.map(b => ({
                    name: b.name,
                    age: b.age,
                    gender: b.gender
                })),
                contactInfo: {
                    ...contactInfo,
                    mobile: contactInfo.address.mobile || contactInfo.mobile,
                    address: {
                        ...contactInfo.address,
                        landmark: ''
                    }
                },
                appointment: {
                    date: appointment.date,
                    slotId: appointment.slotId
                },
                selectedSlot: appointment.slot,
                reports: hardCopyReport ? 'Y' : 'N',
                totalDiscount: passon,
                collectionCharge: checkoutPricing?.collectionCharge || 0,
                grandTotal: checkoutPricing?.grandTotal || null
            };

            await adminOrderApi.bookOnBehalf(payload);
            onSuccess('Order booked successfully!');
            onClose();
        } catch (err: any) {
            console.error('Error booking order:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to book order');
        } finally {
            setLoading(false);
        }
    };

    const next7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
    });

    const filteredPackages = packages.filter(p =>
        p.name?.toLowerCase().includes(packageSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(packageSearch.toLowerCase())
    );

    const getProductTypeColor = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'TEST': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'PROFILE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'OFFER': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'POP': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-xl">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">
                                Book Test • <span className="text-indigo-100">{user.firstName} {user.lastName}</span>
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map(i => (
                                        <div key={`step-indicator-${i}`} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${step >= i ? 'bg-white' : 'bg-white/20'}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                                    Step {step}: {step === 1 ? 'Selection' : step === 2 ? 'Details' : 'Finalize'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center justify-between gap-3 text-red-700 animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-full">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Search tests, profiles or codes..."
                                        value={packageSearch}
                                        onChange={(e) => setPackageSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold outline-none"
                                    />
                                </div>
                                <div className="bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                    <div className="bg-indigo-600 text-white h-8 w-8 rounded-lg flex items-center justify-center font-black">
                                        {selectedPackages.length}
                                    </div>
                                    <span className="text-indigo-700 font-bold text-sm">Packages Selected</span>
                                </div>
                            </div>

                            {packageLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-60">
                                    <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                                    <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">Cataloging Products...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredPackages.map((pkg) => {
                                        const isSelected = selectedPackages.some(p => p.code === pkg.code || p._id === pkg._id);
                                        return (
                                            <div
                                                key={pkg._id}
                                                onClick={() => togglePackage(pkg)}
                                                className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 relative ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-lg scale-[1.02]'
                                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <h4 className="font-black text-gray-900 text-sm leading-tight uppercase group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                        {pkg.name}
                                                    </h4>
                                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 rotate-0 scale-110' : 'border-gray-200 rotate-45 opacity-50'}`}>
                                                        <Plus className={`h-4 w-4 text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getProductTypeColor(pkg.type)}`}>
                                                            {pkg.type || 'TEST'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold">{pkg.code}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                                            <p className="text-[10px] text-gray-400 line-through">₹{pkg.originalPrice}</p>
                                                        )}
                                                        <p className="text-lg font-black text-indigo-700 tracking-tight">₹{pkg.thyrocareRate || pkg.price}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Beneficiaries Side */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <h4 className="font-black text-gray-900 flex items-center gap-3">
                                        <Users className="h-6 w-6 text-indigo-600" />
                                        Patients Details
                                    </h4>
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-black text-gray-500 tracking-tight">
                                        {beneficiaries.length} / 10
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {beneficiaries.map((ben, index) => (
                                        <div key={`beneficiary-${index}`} className="group p-5 bg-white rounded-2xl border-2 border-gray-100 transition-all hover:border-indigo-600/30 hover:shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity" />

                                            {beneficiaries.length > 1 && (
                                                <button
                                                    onClick={() => setBeneficiaries(beneficiaries.filter((_, i) => i !== index))}
                                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}

                                            <div className="space-y-5">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Patient Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={ben.name}
                                                        onChange={(e) => {
                                                            const newBens = [...beneficiaries];
                                                            newBens[index].name = e.target.value;
                                                            setBeneficiaries(newBens);
                                                        }}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-gray-800"
                                                        placeholder="Enter name..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Age (Years)</label>
                                                        <input
                                                            type="number"
                                                            value={ben.age}
                                                            onChange={(e) => {
                                                                const newBens = [...beneficiaries];
                                                                newBens[index].age = e.target.value;
                                                                setBeneficiaries(newBens);
                                                            }}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-gray-800"
                                                            placeholder="e.g. 25"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Gender</label>
                                                        <select
                                                            value={ben.gender}
                                                            onChange={(e) => {
                                                                const newBens = [...beneficiaries];
                                                                newBens[index].gender = e.target.value;
                                                                setBeneficiaries(newBens);
                                                            }}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-gray-800"
                                                        >
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {beneficiaries.length < 10 && (
                                        <button
                                            onClick={() => setBeneficiaries([...beneficiaries, { name: '', age: '', gender: 'Male' }])}
                                            className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black uppercase text-xs tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all bg-gray-50/50 flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Add Another Patient
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Address Side */}
                            <div className="lg:col-span-7 space-y-8">
                                <h4 className="font-black text-gray-900 flex items-center gap-3 border-b pb-4">
                                    <MapPin className="h-6 w-6 text-indigo-600" />
                                    Collection Logistics
                                </h4>

                                <div className="p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-[32px] space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest block mb-2">Pickup Location Address</label>
                                            <textarea
                                                rows={3}
                                                value={contactInfo.address.street}
                                                onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, street: e.target.value } })}
                                                className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold text-gray-800"
                                                placeholder="Street name, landmark, building suite..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest block mb-2">Pincode (Verification Required)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={contactInfo.address.pincode}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setContactInfo({ ...contactInfo, address: { ...contactInfo.address, pincode: val } });
                                                        if (val.length === 6) checkPincode(val);
                                                        else setPincodeStatus({ checking: false, available: null, message: '' });
                                                    }}
                                                    className={`w-full px-5 py-4 bg-white border rounded-2xl focus:ring-4 outline-none pr-12 font-black tracking-widest ${pincodeStatus.available === true ? 'border-green-400 text-green-700 bg-green-50' :
                                                        pincodeStatus.available === false ? 'border-red-400 text-red-700 bg-red-50' : 'border-indigo-100'
                                                        }`}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {pincodeStatus.checking ? <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" /> :
                                                        pincodeStatus.available === true ? <CheckCircle className="h-6 w-6 text-green-500" /> :
                                                            pincodeStatus.available === false ? <X className="h-6 w-6 text-red-500" /> : null}
                                                </div>
                                            </div>
                                            {pincodeStatus.message && <p className={`text-[10px] font-black mt-2 uppercase tracking-tight ${pincodeStatus.available ? 'text-green-600' : 'text-red-600'}`}>{pincodeStatus.message}</p>}
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest block mb-2">City Name</label>
                                            <input
                                                type="text"
                                                value={contactInfo.address.city}
                                                onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, city: e.target.value } })}
                                                className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest block mb-2">State</label>
                                            <input
                                                type="text"
                                                value={contactInfo.address.state}
                                                onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, state: e.target.value } })}
                                                className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest block mb-1.5">Emergency Contact (Mobile)</label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                value={contactInfo.address.mobile}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setContactInfo(prev => ({
                                                        ...prev,
                                                        mobile: val,
                                                        address: { ...prev.address, mobile: val }
                                                    }));
                                                }}
                                                className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-black"
                                            />
                                        </div>
                                    </div>

                                    {/* Additional Options */}
                                    <div className="pt-6 border-t border-indigo-100">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-[28px] p-6 group hover:shadow-lg transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl transition-colors ${hardCopyReport ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 shadow-sm'}`}>
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-amber-900 text-sm uppercase tracking-tight">Hard Copy Report</h5>
                                                        <p className="text-[11px] text-amber-700/70 font-bold">Physical shipment to the address above</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setHardCopyReport(!hardCopyReport)}
                                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${hardCopyReport ? 'bg-amber-600' : 'bg-gray-200 shadow-inner'}`}
                                                >
                                                    <div className={`h-6 w-6 rounded-full bg-white shadow-xl transition-transform ${hardCopyReport ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                            {hardCopyReport && (
                                                <div className="mt-4 flex items-center gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/10 animate-pulse">
                                                    <Info className="h-4 w-4 text-amber-600" />
                                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Additional ₹75.00 Logistic Charge Applied</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Side: Slots */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="space-y-6">
                                    <h4 className="font-black text-gray-900 flex items-center gap-3">
                                        <Calendar className="h-6 w-6 text-indigo-600" />
                                        Scheduling
                                    </h4>

                                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                        {next7Days.map(date => {
                                            const d = new Date(date);
                                            const isSelected = appointment.date === date;
                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => {
                                                        setAppointment({ ...appointment, date, slot: '', slotId: '' });
                                                        fetchSlots(date);
                                                    }}
                                                    className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-[24px] border-2 transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-tight opacity-60">
                                                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                                                    </span>
                                                    <span className="text-2xl font-black my-0.5">{d.getDate()}</span>
                                                    <span className="text-[10px] font-bold opacity-60">
                                                        {d.toLocaleDateString(undefined, { month: 'short' })}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="font-black text-gray-900 flex items-center gap-3">
                                        <Clock className="h-6 w-6 text-indigo-600" />
                                        Availability
                                    </h4>

                                    {slotsLoading ? (
                                        <div className="py-24 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                            <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Contacting Phlebotomist...</p>
                                        </div>
                                    ) : slots.length > 0 ? (
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {slots.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setAppointment({ ...appointment, slot: s.slot, slotId: s.id })}
                                                    className={`py-3.5 px-2 rounded-xl text-[10px] font-black uppercase text-center transition-all border-2 ${appointment.slot === s.slot
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                        : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 shadow-sm'
                                                        }`}
                                                >
                                                    {s.slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center opacity-40">
                                            <Clock className="h-10 w-10 text-gray-300 mb-4" />
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                {appointment.date ? 'No slots for this date' : 'Select a date above'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Invoice Summary */}
                            <div className="lg:col-span-5">
                                <div className="bg-indigo-950 rounded-[40px] p-8 shadow-2xl text-white sticky top-0 border-4 border-white/5">
                                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                                        <h4 className="text-xl font-black uppercase tracking-tighter">Order Invoice</h4>
                                        <ShoppingBag className="h-7 w-7 text-indigo-400" />
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Cart Contents</p>
                                            <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-3 custom-scrollbar-light">
                                                {selectedPackages.map((p, index) => (
                                                    <div key={`cart-item-${p.code || p._id}-${index}`} className="flex justify-between items-center text-xs bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors">
                                                        <span className="font-black text-indigo-50 uppercase truncate max-w-[180px]">{p.name}</span>
                                                        <span className="font-black text-indigo-300 ml-4 shrink-0">₹{p.thyrocareRate || p.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            {pricingLoading ? (
                                                <div className="text-center py-6 opacity-50">
                                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Pricing Calculation...</p>
                                                </div>
                                            ) : checkoutPricing ? (
                                                <div className="space-y-3.5">
                                                    <div className="flex justify-between text-xs font-bold text-indigo-300/70">
                                                        <span>Subtotal ({beneficiaries.length} P)</span>
                                                        <span>₹{checkoutPricing.originalTotal?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-black text-green-400">
                                                        <span>Partner Discount</span>
                                                        <span>-₹{checkoutPricing.totalDiscount?.toFixed(2)}</span>
                                                    </div>
                                                    {checkoutPricing.collectionCharge > 0 && (
                                                        <div className="flex justify-between text-xs font-bold text-indigo-300/70">
                                                            <span>Home Collection Charge</span>
                                                            <span>+₹{checkoutPricing.collectionCharge?.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {hardCopyReport && (
                                                        <div className="flex justify-between text-xs font-bold text-indigo-300/70">
                                                            <span>Hard Copy Logistic</span>
                                                            <span>+₹75.00</span>
                                                        </div>
                                                    )}

                                                    <div className="pt-6 border-t border-white/20 mt-6 md:mt-10">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500 block mb-1">Total Payable</span>
                                                                <p className="text-[10px] font-bold text-indigo-200">Payment: POSTPAID (COD)</p>
                                                            </div>
                                                            <span className="text-4xl font-black text-white tracking-tighter">
                                                                ₹{((checkoutPricing.grandTotal || 0) + (hardCopyReport ? 75 : 0)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-center text-xs text-white/50 py-8 italic">Reviewing pricing variables...</p>
                                            )}
                                        </div>

                                        <div className="space-y-3 mt-10">
                                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <Calendar className="h-5 w-5 text-indigo-400" />
                                                <div>
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Schedule</p>
                                                    <p className="text-xs font-black text-white">{appointment.date || 'NOT SET'} @ {appointment.slot || 'NOT SET'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-b-3xl">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(step - 1)}
                        className="px-8 py-3.5 text-gray-400 font-black uppercase text-xs tracking-widest hover:text-gray-900 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {step === 1 ? 'Discard Booking' : 'Back to Step ' + (step - 1)}
                    </button>

                    <button
                        onClick={step === 3 ? handleSubmit : handleNextStep}
                        disabled={loading || slotsLoading || packageLoading}
                        className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-3 disabled:opacity-50 ${step === 3 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                    >
                        {loading ? 'Finalizing...' : step === 3 ? 'Confirm & Book Order' : 'Continue'}
                        {!loading && <ChevronRight className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default BookOrderModal;
