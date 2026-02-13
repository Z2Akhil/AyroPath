import axios from 'axios';
import Order, { OrderDocument } from '../models/Order';
import { ThyrocareService } from './thyrocare';
import { thyrocareCircuitBreaker } from '../utils/circuitBreaker';
import { thyrocareRequestQueue } from '../utils/requestQueue';

/**
 * Service for syncing order status from Thyrocare API
 */
export class OrderStatusSyncService {
    private static apiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

    /**
     * Fetch order status from Thyrocare API for a single order
     */
    private static async fetchOrderStatusFromThyrocare(orderNumber: string, apiKey: string) {
        const executeApiCall = async (currentApiKey: string) => {
            console.log(`🔄 Fetching Thyrocare status for order: ${orderNumber}`);

            const response = await axios.post(
                `${this.apiUrl}/api/OrderSummary/OrderSummary`,
                {
                    OrderNo: orderNumber,
                    ApiKey: currentApiKey
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            return response.data;
        };

        return await thyrocareRequestQueue.enqueue(async () => {
            return await thyrocareCircuitBreaker.execute(() => executeApiCall(apiKey));
        }, {
            priority: 'normal',
            metadata: { type: 'order_status_check', orderNumber }
        });
    }

    /**
     * Sync status for a single order
     */
    static async syncOrderStatus(orderIdOrDoc: string | OrderDocument) {
        try {
            const order = typeof orderIdOrDoc === 'string'
                ? await Order.findById(orderIdOrDoc)
                : orderIdOrDoc;

            if (!order) {
                throw new Error(`Order not found`);
            }

            if (!order.thyrocare?.orderNo) {
                return {
                    orderId: order._id,
                    success: false,
                    message: 'No Thyrocare order number',
                    statusChanged: false
                };
            }

            const result = await ThyrocareService.makeRequest(async (apiKey) => {
                const thyrocareResponse = await this.fetchOrderStatusFromThyrocare(
                    order.thyrocare.orderNo as string,
                    apiKey
                );

                // Store full response
                order.thyrocare.response = thyrocareResponse;

                let newStatus = order.thyrocare.status;
                let statusChanged = false;
                let reportUrls: any[] = [];

                if (thyrocareResponse.response === 'Success') {
                    // Extract status from orderMaster or data field
                    let thyrocareStatus = '';
                    if (thyrocareResponse.orderMaster && thyrocareResponse.orderMaster.length > 0) {
                        thyrocareStatus = thyrocareResponse.orderMaster[0].status;

                        // Extract reports
                        if (thyrocareResponse.benMaster && thyrocareResponse.benMaster.length > 0) {
                            reportUrls = thyrocareResponse.benMaster.map((ben: any) => ({
                                beneficiaryName: ben.name,
                                leadId: ben.id,
                                reportUrl: ben.url
                            }));
                        }
                    } else if (thyrocareResponse.data) {
                        thyrocareStatus = thyrocareResponse.data.status ||
                            thyrocareResponse.data.OrderStatus ||
                            thyrocareResponse.data.currentStatus;
                    }

                    if (thyrocareStatus && thyrocareStatus.toUpperCase() !== order.thyrocare.status.toUpperCase()) {
                        newStatus = thyrocareStatus.toUpperCase();
                        statusChanged = true;
                        await (order as any).updateThyrocareStatus(newStatus, 'Synced from Thyrocare API');
                    }

                    // Save reports
                    if (reportUrls.length > 0) {
                        for (const report of reportUrls) {
                            if (report.reportUrl) {
                                await (order as any).addReport(report.beneficiaryName, report.leadId, report.reportUrl);
                            }
                        }
                    }
                }

                order.thyrocare.lastSyncedAt = new Date();
                await order.save();

                return {
                    orderId: order._id,
                    orderNumber: order.thyrocare.orderNo,
                    success: true,
                    statusChanged,
                    oldStatus: order.thyrocare.status,
                    newStatus: newStatus,
                    message: statusChanged ? 'Status updated' : 'Status unchanged'
                };
            });

            return result;
        } catch (error: any) {
            console.error(`❌ Failed to sync order:`, error);
            return {
                success: false,
                message: error.message,
                statusChanged: false
            };
        }
    }

    /**
     * Sync status for all active orders
     */
    static async syncAllOrdersStatus() {
        const orders = await Order.find({
            'thyrocare.orderNo': { $exists: true, $ne: null },
            status: { $nin: ['COMPLETED', 'FAILED', 'CANCELLED'] }
        }).select('_id');

        const results: any[] = [];
        for (const order of orders) {
            results.push(await this.syncOrderStatus(order._id.toString()));
        }

        return {
            total: orders.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            statusChanged: results.filter(r => r.statusChanged).length,
            results
        };
    }
}
