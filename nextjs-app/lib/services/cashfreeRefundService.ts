const CF_BASE = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';

const CF_HEADERS = {
  'x-client-id':     process.env.CASHFREE_APP_ID     || '',
  'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
  'x-api-version':   '2023-08-01',
  'Content-Type':    'application/json',
};

export interface RefundResult {
  refundId: string;
  status: string;
  error?: string;
}

export async function initiateRefund(
  cfOrderId: string,
  refundAmount: number,
  note: string
): Promise<RefundResult> {
  if (!cfOrderId || typeof refundAmount !== 'number' || refundAmount <= 0) {
    return { refundId: '', status: 'failed', error: 'Invalid order ID or refund amount (must be greater than 0)' };
  }
  const { randomUUID } = await import('crypto');
  const refundId = `rfnd_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  try {
    const res = await fetch(`${CF_BASE}/pg/orders/${cfOrderId}/refunds`, {
      method: 'POST',
      headers: CF_HEADERS,
      body: JSON.stringify({
        refund_amount: refundAmount,
        refund_id:     refundId,
        refund_note:   note,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[Cashfree Refund] Failed:', res.status, JSON.stringify(data));
      return { refundId, status: 'failed', error: data?.message || 'Cashfree refund failed' };
    }
    console.log('[Cashfree Refund] Success:', JSON.stringify(data));
    return { refundId: data.refund_id || refundId, status: data.refund_status || 'PENDING' };
  } catch (err: any) {
    console.error('[Cashfree Refund] Exception:', err.message);
    return { refundId, status: 'failed', error: err.message };
  }
}

export async function getRefundStatus(cfOrderId: string, refundId: string): Promise<string> {
  try {
    const res = await fetch(`${CF_BASE}/pg/orders/${cfOrderId}/refunds/${refundId}`, {
      headers: CF_HEADERS,
    });
    const data = await res.json();
    return data.refund_status || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}
