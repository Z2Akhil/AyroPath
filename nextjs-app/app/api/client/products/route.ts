import { NextRequest } from 'next/server';
import { GET as productsGET } from '../../products/route';

export async function GET(request: NextRequest) {
    return productsGET(request);
}
