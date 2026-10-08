import axios from 'axios';

// The single axios instance used for every API call.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api' });

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return 'Cannot reach the server. Check that the API is running on port 5000.';
    return (e.response.data as { message?: string })?.message ?? e.message;
  }
  return 'Something went wrong. Please try again.';
}
