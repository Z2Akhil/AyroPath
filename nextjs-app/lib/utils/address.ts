/**
 * Address Builder / Sanitizer
 *
 * Shared utility for building the address string sent to Thyrocare.
 * Rules (per Thyrocare provider contract):
 *   1. Accept a structured address object with optional fields.
 *   2. Ignore null / undefined / empty-string values.
 *   3. Join non-empty segments with "," (comma, no space) — per spec example.
 *   4. Fields included in the join: houseNo, street, addressLine1, addressLine2,
 *      landmark, city, state.  country and pincode are intentionally excluded.
 *   5. Enforce a max length of 200 chars by truncating from the right.
 *   6. When addressTruncationAllowed is explicitly false, throw instead of
 *      truncating if the joined string exceeds 200 chars.
 *
 * Usage:
 *   import { buildAddressString } from '@/lib/utils/address';
 *   const addr = buildAddressString(order.contactInfo.address);
 */

export interface AddressInput {
    houseNo?: string | null;
    street?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    /** country is accepted but excluded from the address string per spec */
    country?: string | null;
    /** pincode is kept separate from the address string per provider spec */
    pincode?: string | null;
}

export interface BuildAddressOptions {
    /**
     * When false, the function throws an error instead of truncating if the
     * joined address string exceeds MAX_ADDRESS_LENGTH.
     * Defaults to true (truncation allowed).
     */
    addressTruncationAllowed?: boolean;
}

const MAX_ADDRESS_LENGTH = 200;

/**
 * Fields included in the address string — per Thyrocare spec.
 * country and pincode are intentionally omitted:
 *   - country: excluded from concatenation per spec
 *   - pincode: returned as its own separate field by Thyrocare
 */
const ADDRESS_CONCAT_FIELDS: (keyof Omit<AddressInput, 'pincode' | 'country'>)[] = [
    'houseNo',
    'street',
    'addressLine1',
    'addressLine2',
    'landmark',
    'city',
    'state',
];

/**
 * Build a sanitized, truncation-safe address string from a structured object.
 *
 * @param address  - Structured address (any fields may be absent/empty).
 * @param options  - { addressTruncationAllowed } — defaults to true.
 * @returns        - Comma-joined (no space), max-200-char address string.
 * @throws         - If truncation is disallowed and the string exceeds the limit.
 */
export function buildAddressString(
    address: AddressInput,
    options: BuildAddressOptions = {}
): string {
    const { addressTruncationAllowed = true } = options;

    // Collect non-empty segments in the spec-defined field order
    const segments = ADDRESS_CONCAT_FIELDS
        .map((key) => (address[key] ?? '').toString().trim())
        .filter((val) => val.length > 0);

    // Separator: "," with no space — per Thyrocare spec example
    const joined = segments.join(',');

    if (joined.length <= MAX_ADDRESS_LENGTH) {
        return joined;
    }

    // String exceeds the limit
    if (!addressTruncationAllowed) {
        throw new Error(
            `Address exceeds the maximum allowed length of ${MAX_ADDRESS_LENGTH} characters ` +
            `(got ${joined.length}). Shorten the address or allow truncation.`
        );
    }

    // Right-side truncation — preserve as much leading content as possible
    return joined.slice(0, MAX_ADDRESS_LENGTH);
}

/**
 * Normalise a raw Thyrocare order-data address response into a consistent
 * shape. Per the new Thyrocare contract, the provider returns the complete
 * processed address string in addressLine1, with all other sub-fields
 * (houseNo, street, landmark, city, state) returned as empty strings.
 * This function surfaces a reliable fullAddress regardless of variant.
 *
 * @param orderData - Raw object from thyrocare.response / webhook orderData
 * @returns         - Normalised address fields + a fullAddress convenience string
 */
export function normalizeThyrocareAddress(orderData: Record<string, any>): {
    houseNo: string;
    street: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    fullAddress: string;
} {
    const houseNo      = (orderData.houseNo      ?? '').toString().trim();
    const street       = (orderData.street        ?? '').toString().trim();
    const addressLine1 = (orderData.addressLine1  ?? '').toString().trim();
    const addressLine2 = (orderData.addressLine2  ?? '').toString().trim();
    const city         = (orderData.city          ?? '').toString().trim();
    const state        = (orderData.state         ?? '').toString().trim();
    const country      = (orderData.country       ?? '').toString().trim();
    const pincode      = (orderData.pincode       ?? '').toString().trim();

    // Per Thyrocare's new contract: addressLine1 carries the full processed
    // address string while all other sub-fields come back empty.
    // Treat addressLine1 as the canonical address in that case.
    const subFieldsEmpty = !houseNo && !street && !city && !state;
    const fullAddress = subFieldsEmpty && addressLine1
        ? addressLine1
        : buildAddressString({ houseNo, street, addressLine1, addressLine2, city, state });

    return { houseNo, street, addressLine1, addressLine2, city, state, country, pincode, fullAddress };
}

