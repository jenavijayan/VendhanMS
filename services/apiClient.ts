// services/apiClient.ts

// In a real app, you might get this from an environment variable
const API_BASE_URL = '/api';

/**
 * A generic API client for making fetch requests.
 * It automatically adds the Authorization header if a token is available.
 * @param endpoint The API endpoint to call (e.g., '/users').
 * @param options The options for the fetch request (method, body, etc.).
 * @returns The JSON response from the API.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});

  // We only set Content-Type for methods that typically have a body.
  // For GET, HEAD, etc., it's not needed. For FormData, the browser sets it.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      // Try to parse a structured error from the response body
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    // Handle responses that might not have content (e.g., 204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error: any) {
    console.error('API Client Error:', error);
    // Re-throw the error so it can be caught by the calling function
    throw new Error(error.message || 'An unexpected network error occurred.');
  }
}
