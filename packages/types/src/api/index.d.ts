export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
//# sourceMappingURL=index.d.ts.map