'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useCart } from "@/providers/CartProvider";
import { useOrderSuccess } from "@/providers/OrderSuccessProvider";
import { useToast } from "@/providers/ToastProvider";
import { axiosInstance } from "@/lib/api/axiosInstance";
import CartApi, { CartCheckoutPricingResponse } from "@/lib/api/cartApi";
import { checkPincode, getAppointmentSlots, SlotData } from "@/lib/api/clientApi";
import { getInitialFormData, saveContactInfo } from "@/lib/utils/localStorage";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import AuthModal from "../ui/AuthModal";
import { MapPin, Calendar, Clock, User as UserIcon, AlertCircle, CheckCircle2, Info, Plus, Trash2, ArrowRight } from 'lucide-react';

interface BookingFormProps {
    pkgName: string | string[];
    priceInfo: {
        displayPrice: number;
        originalPrice: number;
        discountPercentage: number;
        discountAmount: number;
        hasDiscount?: boolean;
    };
    pkgId: string | string[];
    items: any[];
    hasDiscount?: boolean;
    discountPercentage?: number;
    discountAmount?: number;
}

const BookingForm: React.FC<BookingFormProps> = ({ pkgName, priceInfo, pkgId, items }) => {
    const pkgNames = Array.isArray(pkgName) ? pkgName : [pkgName];
    const { user } = useUser();
    const { cart, clearCart } = useCart();
    const { showSuccessCard } = useOrderSuccess();
    const { success: toastSuccess, error: toastError } = useToast();

    const [numPersons, setNumPersons] = useState(1);
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);
    const [pincode, setPincode] = useState("");
    const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [wantHardcopy, setWantHardcopy] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        email: "",
        mobile: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            landmark: ""
        }
    });
    const [saveContactForFuture, setSaveContactForFuture] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [checkoutPricing, setCheckoutPricing] = useState<CartCheckoutPricingResponse | null>(null);
    const [pricingLoading, setPricingLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const initialData = getInitialFormData();
            setContactInfo({
                email: user.email || initialData.contactInfo.email,
                mobile: user.mobileNumber || initialData.contactInfo.mobile,
                address: {
                    street: user.address || initialData.contactInfo.address.street,
                    city: user.city || initialData.contactInfo.address.city,
                    state: user.state || initialData.contactInfo.address.state,
                    pincode: initialData.contactInfo.address.pincode,
                    landmark: initialData.contactInfo.address.landmark
                }
            });
            if (initialData.contactInfo.address.pincode) {
                setPincode(initialData.contactInfo.address.pincode);
            }
        }
    }, [user]);

    useEffect(() => {
        const fetchInitialPricing = async () => {
            if (items && items.length > 0) {
                setPricingLoading(true);
                try {
                    const result = await CartApi.getCheckoutPricing(numPersons, items);
                    if (result.success) {
                        setCheckoutPricing(result);
                    }
                } catch (error) {
                    console.error('Error fetching initial checkout pricing:', error);
                } finally {
                    setPricingLoading(false);
                }
            }
        };

        fetchInitialPricing();
    }, [items, numPersons]);

    const handlePersonsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value);
        setNumPersons(count);
        setSelectedBeneficiaries(prev =>
            Array.from({ length: count }, (_, i) => prev[i] || { name: "", age: "", gender: "" })
        );
    };

    const handleBeneficiaryChange = (index: number, field: string, value: string) => {
        const updatedBeneficiaries = [...selectedBeneficiaries];
        updatedBeneficiaries[index] = { ...updatedBeneficiaries[index], [field]: value };
        setSelectedBeneficiaries(updatedBeneficiaries);
    };

    const handleContactInfoChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setContactInfo(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setContactInfo(prev => ({ ...prev, [field]: value }));
        }
    };

    const handlePincodeCheck = async () => {
        if (!pincode || pincode.length !== 6) {
            setPincodeStatus("⚠️ Please enter a valid 6-digit pincode.");
            return;
        }

        try {
            setLoading(true);
            setPincodeStatus(null);
            const response = await checkPincode(pincode);

            if (response?.status === "Y" && response?.respId === "RES00001") {
                setPincodeStatus(`✅ Service is available in ${response.response}`);
                toastSuccess("Service available!");
            } else {
                setPincodeStatus(`❌ ${response?.response || "Service not available"}`);
                toastError("Service not available in this area");
            }
        } catch (error) {
            setPincodeStatus("❌ Error checking pincode");
            toastError("Failed to check pincode");
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointmentSlots = async () => {
        if (!appointmentDate || !pincode || pincode.length !== 6 || !pincodeStatus?.includes("✅")) {
            return;
        }

        const incomplete = selectedBeneficiaries.some(b => !b.name || !b.age || !b.gender);
        if (incomplete) return;

        try {
            setLoading(true);
            const patients = selectedBeneficiaries.map((b, i) => ({
                Id: i + 1,
                Name: b.name,
                Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
                Age: parseInt(b.age),
            }));

            let payloadItems = [];
            if (Array.isArray(pkgId)) {
                payloadItems = pkgId.map((id) => ({
                    Id: id,
                    PatientQuantity: numPersons,
                    PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
                }));
            } else {
                payloadItems = [{
                    Id: pkgId,
                    PatientQuantity: numPersons,
                    PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
                }];
            }

            const response = await getAppointmentSlots({
                pincode,
                date: appointmentDate,
                patients,
                items: payloadItems,
            });

            if (response?.respId === "RES00001") {
                setAvailableSlots(response.lSlotDataRes || []);
            } else {
                setAvailableSlots([]);
                toastError(response?.response || "No slots available");
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        if (!pincodeStatus?.includes("✅")) {
            toastError("Please check pincode availability first");
            return;
        }

        if (selectedBeneficiaries.some(b => !b.name || !b.age || !b.gender)) {
            toastError("Please complete all beneficiary information");
            return;
        }

        if (!contactInfo.email || !contactInfo.mobile || !contactInfo.address.street) {
            toastError("Please complete all contact information");
            return;
        }

        if (!appointmentDate || !selectedSlot) {
            toastError("Please select appointment date and time slot");
            return;
        }

        try {
            setLoading(true);

            const finalAmount = checkoutPricing?.grandTotal
                ? (checkoutPricing.grandTotal + (wantHardcopy ? 75 : 0))
                : ((priceInfo.displayPrice * numPersons) + (wantHardcopy ? 75 : 0));

            const totalOriginalPrice = checkoutPricing?.originalTotal || (priceInfo.originalPrice * numPersons);
            const totalDiscountAmount = checkoutPricing?.totalDiscount || ((priceInfo.originalPrice - priceInfo.displayPrice) * numPersons);

            const orderData = {
                packageId: pkgId,
                packageName: pkgNames.join(", "),
                packagePrice: priceInfo.displayPrice, // Unit price
                totalAmount: finalAmount, // Total price including persons and charges
                originalPrice: totalOriginalPrice,
                discountPercentage: priceInfo.discountPercentage,
                discountAmount: totalDiscountAmount,
                beneficiaries: selectedBeneficiaries,
                contactInfo: {
                    ...contactInfo,
                    address: {
                        ...contactInfo.address,
                        pincode,
                    },
                },
                appointment: {
                    date: appointmentDate,
                    slotId: selectedSlot,
                    slot: availableSlots.find(slot => slot.id === selectedSlot)?.slot || ""
                },
                selectedSlot: availableSlots.find(slot => slot.id === selectedSlot)?.slot || "",
                reports: wantHardcopy ? "Y" : "N"
            };

            const { data: result } = await axiosInstance.post("/orders/create", orderData);

            if (result.success) {
                if (saveContactForFuture) {
                    saveContactInfo(contactInfo);
                }

                showSuccessCard({
                    orderId: result.data.orderId,
                    packageName: pkgNames.join(", "),
                    amount: finalAmount.toFixed(2)
                });

                toastSuccess("Order placed successfully!");
                clearCart();
            } else {
                toastError(result.message || "Order creation failed");
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            toastError(error.response?.data?.message || "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const isBeneficiariesValid = selectedBeneficiaries.every(b =>
        b.name && b.name.length <= 50 && b.age && parseInt(b.age) >= 1 && parseInt(b.age) <= 100 && b.gender
    );

    const isContactValid = contactInfo.email && /^[0-9]{10}$/.test(contactInfo.mobile) && contactInfo.address.street;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">{pkgNames.length === 1 ? pkgNames[0] : "Health Package Combo"}</h2>
                    <p className="opacity-90 mt-1 font-medium italic">Book Now, Pay Later • No Hidden Charges</p>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Persons Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-blue-500" />
                            Number of Persons
                        </label>
                        <select
                            value={numPersons}
                            onChange={handlePersonsChange}
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 transition-all outline-none"
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1} {i + 1 === 1 ? 'Person' : 'Persons'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-inner">
                        <h3 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider">Price Breakdown</h3>
                        {pricingLoading ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Calculating best price...</span>
                            </div>
                        ) : checkoutPricing ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Package Price × {numPersons}</span>
                                    <span className="font-semibold">₹{checkoutPricing.originalTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span>Total Discount</span>
                                    <span className="font-bold">-₹{checkoutPricing.totalDiscount.toFixed(2)}</span>
                                </div>
                                {checkoutPricing.collectionCharge > 0 && (
                                    <div className="flex justify-between items-center text-sm text-amber-600">
                                        <span>Collection Charge</span>
                                        <span className="font-semibold">+₹{checkoutPricing.collectionCharge.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-blue-200 flex justify-between items-center">
                                    <span className="text-gray-900 font-bold">Total Payable</span>
                                    <span className="text-2xl font-black text-blue-700">₹{checkoutPricing.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">Enter details to see final price</div>
                        )}
                    </div>

                    {/* Pincode Check */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            Service Area Pincode
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="6-digit Pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={handlePincodeCheck}
                                disabled={loading || pincode.length !== 6}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                {loading ? '...' : 'Check'}
                            </button>
                        </div>
                        {pincodeStatus && (
                            <p className={`mt-2 text-sm font-medium ${pincodeStatus.includes("✅") ? "text-green-600" : "text-red-500"}`}>
                                {pincodeStatus}
                            </p>
                        )}
                    </div>

                    {/* Beneficiaries */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Beneficiary Details</h3>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">
                                {numPersons} Person(s)
                            </span>
                        </div>
                        <div className="grid gap-4">
                            {selectedBeneficiaries.map((ben, idx) => (
                                <div key={idx} className="p-5 border-2 border-gray-50 rounded-2xl bg-gray-50/50 space-y-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">
                                            {idx + 1}
                                        </div>
                                        Person {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full border-2 border-white rounded-xl px-4 py-3 bg-white shadow-sm focus:border-blue-400 outline-none transition-all"
                                        value={ben.name}
                                        onChange={(e) => handleBeneficiaryChange(idx, "name", e.target.value)}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            className="w-full border-2 border-white rounded-xl px-4 py-3 bg-white shadow-sm focus:border-blue-400 outline-none transition-all"
                                            value={ben.age}
                                            onChange={(e) => handleBeneficiaryChange(idx, "age", e.target.value)}
                                            required
                                        />
                                        <select
                                            className="w-full border-2 border-white rounded-xl px-4 py-3 bg-white shadow-sm focus:border-blue-400 outline-none transition-all"
                                            value={ben.gender}
                                            onChange={(e) => handleBeneficiaryChange(idx, "gender", e.target.value)}
                                            required
                                        >
                                            <option value="">Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Communication Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                    value={contactInfo.email}
                                    onChange={(e) => handleContactInfoChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile"
                                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                    value={contactInfo.mobile}
                                    onChange={(e) => handleContactInfoChange('mobile', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Collection Address</label>
                            <textarea
                                rows={2}
                                placeholder="House/Flat No, Apartment, Landmark"
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                value={contactInfo.address.street}
                                onChange={(e) => handleContactInfoChange('address.street', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="City"
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                value={contactInfo.address.city}
                                onChange={(e) => handleContactInfoChange('address.city', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="State"
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                value={contactInfo.address.state}
                                onChange={(e) => handleContactInfoChange('address.state', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="checkbox"
                                id="saveContact"
                                checked={saveContactForFuture}
                                onChange={(e) => setSaveContactForFuture(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="saveContact" className="text-sm text-gray-600 cursor-pointer select-none">
                                Save these details for future bookings
                            </label>
                        </div>
                    </div>

                    {/* Validation Checklist */}
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                        <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Booking Requirements
                        </h4>
                        <ul className="grid gap-2">
                            <li className={`flex items-center gap-2 text-xs font-medium ${pincodeStatus?.includes("✅") ? "text-green-700" : "text-amber-700"}`}>
                                {pincodeStatus?.includes("✅") ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} Verified Pincode
                            </li>
                            <li className={`flex items-center gap-2 text-xs font-medium ${isBeneficiariesValid ? "text-green-700" : "text-amber-700"}`}>
                                {isBeneficiariesValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} All Beneficiary Details (Age 1-100)
                            </li>
                            <li className={`flex items-center gap-2 text-xs font-medium ${isContactValid ? "text-green-700" : "text-amber-700"}`}>
                                {isContactValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} Valid 10-digit Mobile & Email
                            </li>
                        </ul>
                    </div>

                    {/* Appointment Selection */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Schedule Collection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Date
                                </label>
                                <select
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    onBlur={fetchAppointmentSlots}
                                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                                    disabled={!pincodeStatus?.includes("✅") || !isBeneficiariesValid || !isContactValid}
                                >
                                    <option value="">Select Date</option>
                                    {[...Array(7)].map((_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + i);
                                        const formatted = date.toISOString().split('T')[0];
                                        return <option key={i} value={formatted}>{formatted}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Time Slot
                                </label>
                                <select
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                                    disabled={!appointmentDate || availableSlots.length === 0}
                                >
                                    <option value="">Select Time</option>
                                    {availableSlots.map((slot) => (
                                        <option key={slot.id} value={slot.id}>{slot.slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Hardcopy Option */}
                    <div className="bg-red-50 p-4 rounded-2xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-red-200 transition-all" onClick={() => setWantHardcopy(!wantHardcopy)}>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={wantHardcopy}
                                onChange={(e) => setWantHardcopy(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500"
                            />
                            <div>
                                <p className="text-sm font-bold text-red-800">Hard Copy Reports Required?</p>
                                <p className="text-xs text-red-600 opacity-80">Include printed reports for an additional ₹75</p>
                            </div>
                        </div>
                        <span className="text-lg font-black text-red-700">₹75</span>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest px-8">
                        By clicking book now, you agree to our terms of service. Incomplete addresses will lead to order rejection.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black text-xl hover:from-blue-700 hover:to-blue-900 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 group"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>PROCESSING...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3">
                                <span>BOOK APPOINTMENT</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </button>
                </div>
            </form>

            <ConfirmationDialog
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                onConfirm={() => {
                    setShowLoginPrompt(false);
                    setAuthOpen(true);
                }}
                title="Sign In Required"
                message="Please sign in to your account to securely place your order and manage your reports."
                confirmText="Sign In"
            />
            {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        </div>
    );
};

export default BookingForm;
