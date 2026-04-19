import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function apiRequest<T = unknown>(
  method: RequestMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error?: string }).error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
