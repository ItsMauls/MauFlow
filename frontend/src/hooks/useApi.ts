import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Generic API function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Custom hook for GET requests
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => apiCall<T>(endpoint),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}

// Custom hook for POST/PUT/DELETE requests
export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      apiCall<TData>(endpoint, {
        method,
        body: JSON.stringify(variables),
      }),
    onSuccess: (data) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Specific hooks for common operations
export function useTasks() {
  return useApiQuery<Task[]>(['tasks'], '/api/tasks');
}

export function useCreateTask() {
  return useApiMutation<Task, CreateTaskData>(
    '/api/tasks',
    'POST',
    {
      invalidateQueries: [['tasks']],
    }
  );
}

export function useUpdateTask() {
  return useApiMutation<Task, UpdateTaskData>(
    '/api/tasks',
    'PUT',
    {
      invalidateQueries: [['tasks']],
    }
  );
}

export function useDeleteTask() {
  return useApiMutation<void, { id: string }>(
    '/api/tasks',
    'DELETE',
    {
      invalidateQueries: [['tasks']],
    }
  );
}

// Types (you can move these to a separate types file)
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  aiScore?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface UpdateTaskData {
  id: string;
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  aiScore?: number;
}