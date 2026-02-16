import { NextRequest } from 'next/server';
import { POST as cartPOST } from '../route';

// POST /api/cart/items - Add item to cart (forwards to /api/cart POST)
export async function POST(request: NextRequest) {
    return cartPOST(request);
}
