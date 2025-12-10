const SAVED_CONTACT_INFO_KEY = 'Ayropath_saved_contact_info';

export const createContactInfo = (data) => ({
  email: data.email || '',
  address: {
    street: data.address?.street || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    pincode: data.address?.pincode || '',
    landmark: data.address?.landmark || ''
  },
  mobile: data.mobile || '',
  isDefault: data.isDefault || false,
  updatedAt: data.updatedAt || new Date().toISOString()
});

const getUserKey = (baseKey) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id ? `${baseKey}_${user.id}` : baseKey;
};

// Contact Information Management
export const getSavedContactInfo = () => {
  try {
    const key = getUserKey(SAVED_CONTACT_INFO_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading saved contact info:', error);
    return null;
  }
};

export const saveContactInfo = (contactInfo) => {
  try {
    const key = getUserKey(SAVED_CONTACT_INFO_KEY);
    const existingInfo = getSavedContactInfo();

    // Merge with existing data if available
    const mergedInfo = {
      ...(existingInfo || {}),
      ...contactInfo,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(mergedInfo));
    return true;
  } catch (error) {
    console.error('Error saving contact info:', error);
    return false;
  }
};

// Clear all saved data for current user
export const clearUserData = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      localStorage.removeItem(`${SAVED_CONTACT_INFO_KEY}_${user.id}`);
    }
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

// Get initial form data (contact info only)
export const getInitialFormData = () => {
  const contactInfo = getSavedContactInfo();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return {
    beneficiaries: [{ name: '', age: '', gender: '' }],
    contactInfo: {
      email: contactInfo?.email || '',
      mobile: user.mobileNumber || '',
      address: contactInfo?.address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      }
    }
  };
};
