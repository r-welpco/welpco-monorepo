/**
 * Address type definition
 * Used for structured address data in customer profiles
 */
export interface Address {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
//# sourceMappingURL=address.type.d.ts.map