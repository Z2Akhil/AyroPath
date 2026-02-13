export interface AdminProfile {
    name: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

export interface AuthData {
    apiKey: string;
    timestamp: string;
    username: string;
    respId?: string;
    adminProfile: AdminProfile;
    sessionInfo?: any;
}

export interface AdminUser {
    username: string;
    loginTime: string;
    adminProfile: AdminProfile;
}

export interface LoginResponse {
    success: boolean;
    apiKey?: string;
    respId?: string;
    adminProfile?: AdminProfile;
    sessionInfo?: any;
    error?: string;
    timestamp?: string;
}
export interface CustomerUser {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    mobileNumber: string;
    isActive: boolean;
    emailVerified?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserPagination {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export interface UserSearchResponse {
    success: boolean;
    users: CustomerUser[];
    pagination: UserPagination;
}

export interface OrderBeneficiary {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    leadId?: string;
}

export interface OrderStatusHistory {
    status: string;
    timestamp: string;
    notes?: string;
}

export interface OrderReport {
    beneficiaryName: string;
    leadId: string;
    reportUrl?: string;
    reportDownloaded: boolean;
    downloadedAt?: string;
}

export interface AdminOrder {
    _id: string;
    orderId: string;
    userId: CustomerUser | string;
    adminId?: any;
    package: {
        code: string[];
        name: string;
        price: number;
        originalPrice?: number;
    };
    beneficiaries: OrderBeneficiary[];
    contactInfo: {
        email: string;
        mobile: string;
        address: {
            street: string;
            city: string;
            state: string;
            pincode: string;
            landmark?: string;
        };
    };
    appointment: {
        date: string;
        slot: string;
        slotId?: string;
    };
    thyrocare: {
        orderNo?: string;
        status: string;
        statusHistory: OrderStatusHistory[];
        lastSyncedAt?: string;
        error?: string;
    };
    reportsHardcopy: 'Y' | 'N';
    reports: OrderReport[];
    payment: {
        type: string;
        amount: number;
        status: string;
    };
    status: 'PENDING' | 'CREATED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderPagination {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface OrderSearchResponse {
    success: boolean;
    orders: AdminOrder[];
    pagination: OrderPagination;
}

export interface OrderStats {
    totalOrders: number;
    byStatus: Record<string, number>;
    byCategorizedStatus: Record<string, number>;
    byThyrocareStatus: Record<string, number>;
    todaysOrders: number;
    thisWeeksOrders: number;
    thisMonthsOrders: number;
}
