import { useState, useEffect } from "react";
import { checkPincode } from "../api/pinCodeAvailabilityApi";
import { getAppointmentSlots } from "../api/appointmentSlotApi";
import { useUser } from "../context/userContext";
import { axiosInstance } from "../api/axiosInstance";
import { useCart } from "../context/CartContext";
import { useOrderSuccess } from "../context/OrderSuccessContext";

import {
  getInitialFormData,
  saveContactInfo
} from "../utils/localStorage";
import ConfirmationDialog from "./ConfirmationDialog";
import AuthModal from "./AuthModal";

const Form = ({ pkgName, priceInfo, pkgId }) => {
  const pkgNames = [].concat(pkgName || []);
  const { user } = useUser();
  const [numPersons, setNumPersons] = useState(1);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
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
  const { cart, clearCart } = useCart();
  const { showSuccessCard } = useOrderSuccess();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const initialData = getInitialFormData();
      // Only load contact info, not beneficiaries

      // Auto-fill contact information from user profile
      const autoFilledContactInfo = {
        email: user.email || initialData.contactInfo.email,
        mobile: user.mobileNumber || initialData.contactInfo.mobile,
        address: {
          street: user.address || initialData.contactInfo.address.street,
          city: user.city || initialData.contactInfo.address.city,
          state: user.state || initialData.contactInfo.address.state,
          pincode: initialData.contactInfo.address.pincode,
          landmark: initialData.contactInfo.address.landmark
        }
      };

      setContactInfo(autoFilledContactInfo);
      setPincode(initialData.contactInfo.address.pincode);
    }
  }, [user]);

  const handlePersonsChange = (e) => {
    const count = parseInt(e.target.value);
    setNumPersons(count);
    // Preserve existing data when resizing
    setSelectedBeneficiaries(prev =>
      Array.from({ length: count }, (_, i) => prev[i] || { name: "", age: "", gender: "" })
    );
  };

  const handleBeneficiaryChange = (index, field, value) => {
    const updatedBeneficiaries = [...selectedBeneficiaries];
    updatedBeneficiaries[index] = { ...updatedBeneficiaries[index], [field]: value };
    setSelectedBeneficiaries(updatedBeneficiaries);
  };

  const handleContactInfoChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContactInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setContactInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Validate all required fields
    if (!pincode || pincode.length !== 6 || !pincodeStatus?.includes("✅")) {
      alert("Please check pincode availability first");
      return;
    }

    if (!selectedBeneficiaries.every(b => b.name && b.age && b.gender)) {
      alert("Please complete all beneficiary information");
      return;
    }

    const invalidBeneficiary = selectedBeneficiaries.find(b => {
      const age = parseInt(b.age);
      return b.name.length > 50 || isNaN(age) || age < 1 || age > 100;
    });

    if (invalidBeneficiary) {
      if (invalidBeneficiary.name.length > 50) {
        alert("Beneficiary name must be less than 50 characters");
      } else {
        alert("Age must be between 1 and 100 (inclusive) for all beneficiaries");
      }
      return;
    }

    if (
      !contactInfo.email ||
      !contactInfo.mobile ||
      !contactInfo.address.street ||
      !contactInfo.address.city ||
      !contactInfo.address.state
    ) {
      alert("Please complete all contact information");
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(contactInfo.mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!appointmentDate || !selectedSlot) {
      alert("Please select appointment date and time slot");
      return;
    }

    try {
      setLoading(true);

      // Prepare order data
      const orderData = {
        packageId: pkgId,
        packageName: pkgNames.join(", "),
        packagePrice: priceInfo.displayPrice,
        originalPrice: priceInfo.originalPrice,
        discountPercentage: priceInfo.discountPercentage,
        discountAmount: priceInfo.discountAmount,
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

      console.log(orderData);

      // Submit order to backend using axiosInstance
      const { data: result } = await axiosInstance.post("/orders/create", orderData);

      if (result.success) {
        // Save contact info if requested
        if (saveContactForFuture) {
          saveContactInfo(contactInfo);
        }
        // ---- CART CLEARING LOGIC ----
        const cartIds = (cart?.items || []).map(item => item.productCode).sort();
        const bookedIds = Array.isArray(pkgId) ? [...pkgId].sort() : [pkgId];

        // If same items → clear the cart
        if (JSON.stringify(cartIds) === JSON.stringify(bookedIds)) {
          await clearCart();
        }
        showSuccessCard({
          orderId: result.data.orderId,
          packageName: pkgNames.join(","),
          amount: (priceInfo.displayPrice * numPersons) + (wantHardcopy ? 75 : 0)
        });
      } else {
        alert(`Order creation failed: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert(error.response?.data?.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
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
        setPincodeStatus("✅ Service is available in your area!");
      } else {
        setPincodeStatus(`${response?.response || "Service not available"}`);
      }
    } catch (error) {
      setPincodeStatus("Error checking pincode");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentSlots = async () => {
    // Validate all required fields before making API call
    if (!appointmentDate) {
      alert("Please select an appointment date first");
      return;
    }

    if (!pincode || pincode.length !== 6) {
      alert("Please enter a valid 6-digit pincode and check availability first");
      return;
    }

    // Check if all beneficiaries are properly filled
    const incompleteBeneficiaries = selectedBeneficiaries.filter(b =>
      !b.name || !b.age || !b.gender
    );

    if (incompleteBeneficiaries.length > 0) {
      alert(`Please complete beneficiary information for ${incompleteBeneficiaries.length} beneficiary(ies) before fetching slots`);
      return;
    }

    // Validate beneficiary details
    const invalidBenData = selectedBeneficiaries.find(b => {
      const age = parseInt(b.age);
      return b.name.length > 50 || isNaN(age) || age < 1 || age > 100;
    });

    if (invalidBenData) {
      if (invalidBenData.name.length > 50) {
        alert("Beneficiary name must be less than 50 characters before fetching slots");
      } else {
        alert("Age must be between 1 and 100 (inclusive) for all beneficiaries before fetching slots");
      }
      return;
    }

    try {
      setLoading(true);

      let items = [];

      if (Array.isArray(pkgId)) {
        items = pkgId.map((id) => ({
          Id: id,
          PatientQuantity: numPersons,
          PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
        }));
      } else {
        items = [
          {
            Id: pkgId,
            PatientQuantity: numPersons,
            PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
          },
        ];
      }

      const patients = selectedBeneficiaries.map((b, i) => ({
        Id: i + 1,
        Name: b.name,
        Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
        Age: parseInt(b.age),
      }));

      const payload = {
        pincode,
        date: appointmentDate,
        patients,
        BenCount: numPersons,
        items,
      };

      console.log("Fetching appointment slots with payload:", payload);

      const response = await getAppointmentSlots(payload);

      if (response?.respId === "RES00001") {
        setAvailableSlots(response.lSlotDataRes || []);
      } else {
        setAvailableSlots([]);
        alert(response?.response || "No slots available");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);

      // Show more specific error messages
      if (error.response?.status === 400) {
        alert("Invalid request data. Please check all fields are correctly filled.");
      } else if (error.response?.status === 503) {
        alert("Service temporarily unavailable. Please try again later.");
      } else {
        alert("Failed to fetch slots. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mt-2">{pkgNames.length === 1 ? pkgNames[0] : "Lab Tests Combo"}</h2>
        <h2 className="text-xl font-bold text-gray-800 ">Book Now, Pay Later</h2>
        <p className="text-green-700 font-medium mb-2">Simple Process, No Spam Calls</p>
        <select
          value={numPersons}
          onChange={handlePersonsChange}
          className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
        >
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} {i + 1 === 1 ? 'Person' : 'Persons'}
              {i + 1 === 1 ? ` (₹${priceInfo.displayPrice})` : ` (₹${(i + 1) * priceInfo.displayPrice} only)`}
            </option>
          ))}
        </select>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handlePincodeCheck}
            disabled={loading}
            className={`w-1/2 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? "Checking..." : "Check Availability"}
          </button>
        </div>

        {pincodeStatus && (
          <p className={`text-sm mb-3 ${pincodeStatus.includes("✅") ? " text-green-600" : "text-red-600"}`}>
            {pincodeStatus}
          </p>
        )}

        {/* Beneficiary Details Section */}
        <div className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Beneficiary Details</p>

          <div className="space-y-3">
            {selectedBeneficiaries.map((beneficiary, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Person {index + 1}</p>
                {/* Row 1: Name */}
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={beneficiary.name}
                    onChange={(e) => handleBeneficiaryChange(index, "name", e.target.value)}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                  />
                </div>
                {/* Row 2: Age and Gender */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Age"
                    value={beneficiary.age}
                    onChange={(e) => handleBeneficiaryChange(index, "age", e.target.value)}
                    className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={beneficiary.gender}
                    onChange={(e) => handleBeneficiaryChange(index, "gender", e.target.value)}
                    className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Contact Information</p>

          {/* Email Field */}
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.email}
              onChange={(e) => handleContactInfoChange('email', e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Mobile Number</label>
            <input
              type="text"
              placeholder="Mobile Number"
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.mobile}
              onChange={(e) => handleContactInfoChange('mobile', e.target.value)}
            />
          </div>

          {/* Address Field */}
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <textarea
              rows="2"
              placeholder="Street address, area, landmark"
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.address.street}
              onChange={(e) => handleContactInfoChange('address.street', e.target.value)}
            />
          </div>

          {/* City and State Fields */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                value={contactInfo.address.city}
                onChange={(e) => handleContactInfoChange('address.city', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">State</label>
              <input
                type="text"
                placeholder="State"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                value={contactInfo.address.state}
                onChange={(e) => handleContactInfoChange('address.state', e.target.value)}
              />
            </div>
          </div>

          {/* Save Contact Option */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="saveContact"
              checked={saveContactForFuture}
              onChange={(e) => setSaveContactForFuture(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="saveContact" className="text-sm text-gray-600">
              Save this contact information for future bookings
            </label>
          </div>

          {/* Show saved status */}
          {contactInfo.email && contactInfo.address.city && contactInfo.address.state && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <p className="text-sm text-blue-700">
                ✓ Contact information will be saved for future use
              </p>
            </div>
          )}
        </div>

        {/* Validation Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-yellow-800 mb-1">Before selecting appointment date:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li className={`flex items-center gap-2 ${pincode && pincode.length === 6 && pincodeStatus?.includes("✅") ? "text-green-600" : ""}`}>
              {pincode && pincode.length === 6 && pincodeStatus?.includes("✅") ? "✓" : "•"} Valid pincode checked
            </li>
            <li className={`flex items-center gap-2 ${selectedBeneficiaries.every(b => b.name && b.name.length <= 50 && b.age && parseInt(b.age) >= 1 && parseInt(b.age) <= 100 && b.gender) ? "text-green-600" : ""}`}>
              {selectedBeneficiaries.every(b => b.name && b.name.length <= 50 && b.age && parseInt(b.age) >= 1 && parseInt(b.age) <= 100 && b.gender) ? "✓" : "•"} All beneficiaries correctly filled (Age 1-100, Name &lt; 50)
            </li>
            <li className={`flex items-center gap-2 ${contactInfo.email && /^[0-9]{10}$/.test(contactInfo.mobile) && contactInfo.address.street ? "text-green-600" : ""}`}>
              {contactInfo.email && /^[0-9]{10}$/.test(contactInfo.mobile) && contactInfo.address.street ? "✓" : "•"} Contact information complete (10-digit mobile)
            </li>
          </ul>
        </div>

        <select
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          onBlur={fetchAppointmentSlots}
          className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
          disabled={!pincode || pincode.length !== 6 || !pincodeStatus?.includes("✅") || !selectedBeneficiaries.every(b => b.name && b.age && b.gender)}
        >
          <option value="">Select Preferred Appointment Date</option>
          {[...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const formatted = `${year}-${month}-${day}`;
            return (
              <option key={i} value={formatted}>
                {formatted}
              </option>
            );
          })}
        </select>

        <select
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
        >
          <option value="">Select Preferred Time Slot</option>
          {availableSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.slot}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="hardcopy"
            checked={wantHardcopy}
            onChange={(e) => setWantHardcopy(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <label htmlFor="hardcopy" className="text-sm text-red-500">
            Report Hard Copy <span className="font-semibold">(₹75 extra)</span>
          </label>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Order with incomplete/invalid address will be rejected.
        </p>
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white font-semibold py-2 my-3 rounded transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
        >
          {loading ? 'Creating Order...' : 'BOOK NOW'}
        </button>
      </form>
      <ConfirmationDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          setAuthOpen(true);
        }}
        title="Login Required"
        message="Please log in to your account to proceed with your order."
        confirmText="Login"
      />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
};

export default Form;
