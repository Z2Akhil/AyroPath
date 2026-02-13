import { axiosInstance } from "./axiosInstance";

export interface PincodeResponse {
    status: 'Y' | 'N';
    response: string;
    respId: string;
}

export interface SlotData {
    id: string;
    slot: string;
}

export interface AppointmentSlotsResponse {
    respId: string;
    response: string;
    lSlotDataRes: SlotData[];
}

export const checkPincode = async (pincode: string): Promise<PincodeResponse> => {
    if (!pincode) throw new Error("Pincode is required");

    try {
        const response = await axiosInstance.get(`/client/pincode/${pincode}`);
        return response.data.data;
    } catch (error: any) {
        console.error("Pincode check failed:", error);
        throw error;
    }
};

export const getAppointmentSlots = async (payload: {
    pincode: string;
    date: string;
    patients: any[];
    items: any[];
}): Promise<AppointmentSlotsResponse> => {
    try {
        const response = await axiosInstance.post("/client/appointment-slots", payload);
        return response.data.data;
    } catch (error: any) {
        console.error("Error fetching appointment slots:", error.response?.data || error.message);
        throw error;
    }
};
