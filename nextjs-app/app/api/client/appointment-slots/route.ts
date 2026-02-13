import { NextRequest, NextResponse } from 'next/server';
import { ThyrocareService } from '@/lib/services/thyrocare';
import axios from 'axios';

const THYROCARE_BASE_URL = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pincode, date, patients, items } = body;

        if (!pincode || !date || !patients || !items) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: pincode, date, patients, items'
            }, { status: 400 });
        }

        const data = await ThyrocareService.makeRequest(async (apiKey) => {
            const payload = {
                ApiKey: apiKey,
                Pincode: pincode,
                Date: date,
                BenCount: patients.length,
                Patients: patients,
                Items: items
            };

            const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/GetAppointmentSlots`, payload);
            return response.data;
        });

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Appointment slots error:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data || error.message || 'Failed to fetch appointment slots'
        }, { status: 500 });
    }
}
