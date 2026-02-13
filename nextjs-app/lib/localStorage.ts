export const getInitialFormData = () => {
    if (typeof window === 'undefined') {
        return {
            beneficiaries: [{ name: "", age: "", gender: "" }],
            contactInfo: {
                email: "",
                mobile: "",
                address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    landmark: ""
                }
            }
        };
    }

    const savedContact = localStorage.getItem("contactInfo");
    const initialContact = savedContact ? JSON.parse(savedContact) : {
        email: "",
        mobile: "",
        address: { street: "", city: "", state: "", pincode: "", landmark: "" }
    };

    return {
        beneficiaries: [{ name: "", age: "", gender: "" }],
        contactInfo: initialContact
    };
};

export const saveContactInfo = (contactInfo: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("contactInfo", JSON.stringify(contactInfo));
};

export const clearContactInfo = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem("contactInfo");
};
