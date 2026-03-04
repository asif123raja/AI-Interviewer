// src/lib/api.ts
import { auth } from './firebase';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Helper to get the current Firebase auth token.
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
}

/**
 * Wrapper for fetch that adds the Authorization header if available.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = await getAuthToken();
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Default to JSON headers if not doing FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

export async function fetchDashboardStats() {
    return fetchWithAuth('/reports/stats');
}

export async function fetchReports() {
    return fetchWithAuth('/reports');
}

export async function fetchReportById(id: string) {
    return fetchWithAuth(`/reports/${id}`);
}
