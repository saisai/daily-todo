const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  date: string;
  total: number;
  completed: number;
  pending: number;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  date?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  date?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTodos: (params?: { date?: string; completed?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ todos: Todo[]; count: number }>(`/todos${qs ? `?${qs}` : ''}`);
  },
  getTodo: (id: number) => request<Todo>(`/todos/${id}`),
  createTodo: (data: CreateTodoData) =>
    request<Todo>('/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: number, data: UpdateTodoData) =>
    request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTodo: (id: number) =>
    request<{ message: string }>(`/todos/${id}`, { method: 'DELETE' }),
  getStats: (date?: string) =>
    request<Stats>(`/stats${date ? `?date=${date}` : ''}`),
};
