import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import AdminActivity from '@/lib/models/AdminActivity';
import axios from 'axios';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        console.log('💰 Fetching Fast2SMS wallet balance');

        // Validate environment variables
        if (!process.env.FAST2SMS_API_KEY) {
            throw new Error('FAST2SMS_API_KEY environment variable is not set');
        }

        const response = await axios.get('https://www.fast2sms.com/dev/wallet', {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
            },
            timeout: 10000,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });

        // Log the raw response for debugging
        console.log('💰 Fast2SMS API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
        });

        // Handle different response formats
        let walletBalance = 0;
        let success = false;

        if (response.status === 200) {
            if (typeof response.data === 'object' && response.data !== null) {
                // JSON response
                if (response.data.return === true && response.data.wallet !== undefined) {
                    walletBalance = parseFloat(response.data.wallet) || 0;
                    success = true;
                } else if (response.data.message) {
                    throw new Error(`Fast2SMS API error: ${response.data.message}`);
                }
            } else if (typeof response.data === 'string') {
                // HTML or text response - Fast2SMS might return HTML for errors
                if (response.data.includes('error') || response.data.includes('Error')) {
                    throw new Error('Fast2SMS API returned an error page');
                }
                // If it's a string but not an error, try to parse it
                try {
                    const parsedData = JSON.parse(response.data);
                    if (parsedData.return === true && parsedData.wallet !== undefined) {
                        walletBalance = parseFloat(parsedData.wallet) || 0;
                        success = true;
                    }
                } catch (parseError) {
                    console.warn('Could not parse response as JSON:', (parseError as Error).message);
                }
            }
        }

        if (!success) {
            throw new Error('Unable to fetch wallet balance from Fast2SMS API');
        }

        console.log(`💰 Wallet balance fetched successfully: ₹${walletBalance}`);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'WALLET_BALANCE_FETCH',
            description: `Admin ${auth.admin?.name || 'Unknown'} fetched wallet balance`,
            resource: 'sms',
            endpoint: '/api/admin/sms/wallet',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                balance: walletBalance,
                provider: 'fast2sms',
            },
        });

        return NextResponse.json({
            success: true,
            balance: walletBalance,
            currency: 'INR',
            provider: 'fast2sms',
            message: 'Wallet balance fetched successfully',
        });
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('❌ Wallet balance fetch failed:', error.message);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ERROR',
            description: `Failed to fetch wallet balance: ${error.message}`,
            resource: 'sms',
            endpoint: '/api/admin/sms/wallet',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message,
            metadata: {
                provider: 'fast2sms',
            },
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch wallet balance',
                details: error.message,
            },
            { status: 500 }
        );
    }
}