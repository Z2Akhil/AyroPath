export const getInitialFormData = () => {
    if (typeof window === 'undefined') return { contactInfo: { email: '', mobile: '', address: { street: '', city: '', state: '', pincode: '', landmark: '' } } };

    const saved = localStorage.getItem('bookingContactInfo');
    if (saved) {
        try {
            return { contactInfo: JSON.parse(saved) };
        } catch (e) {
            console.error('Error parsing saved contact info', e);
        }
    }

    return {
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
};

export const saveContactInfo = (contactInfo: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bookingContactInfo', JSON.stringify(contactInfo));
};
