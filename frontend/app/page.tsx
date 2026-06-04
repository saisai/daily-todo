'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Todo, Stats } from '@/lib/api';
import {
  Plus, Check, Trash2, Pencil, X, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Loader2, AlertCircle, Flame, Minus, ArrowUp
} from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high'] as const;
type Priority = typeof PRIORITIES[number];

const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: 'Low', color: '#6fcf8c', icon: <Minus size={12} /> },
  medium: { label: 'Medium', color: '#e8c87a', icon: <ArrowUp size={12} /> },
  high: { label: 'High', color: '#e87a7a', icon: <Flame size={12} /> },
};

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(new Date(today.setDate(today.getDate() - 1)));
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = formatDate(tomorrowDate);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

interface TodoFormProps {
  initial?: Partial<Todo>;
  onSubmit: (data: { title: string; description: string; priority: Priority; date: string }) => void;
  onCancel: () => void;
  date: string;
  loading: boolean;
}

function TodoForm({ initial, onSubmit, onCancel, date, loading }: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState<Priority>(initial?.priority || 'medium');
  const [todoDate, setTodoDate] = useState(initial?.date || date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description, priority, date: todoDate });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-scale-in space-y-3">
      <input
        autoFocus
        className="w-full bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] border-b border-[var(--border)] pb-2 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        placeholder="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        rows={2}
        className="w-full bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] border-b border-[var(--border)] pb-2 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className="px-2.5 py-1 rounded text-xs transition-all"
              style={priority === p
                ? { backgroundColor: `${priorityConfig[p].color}22`, color: priorityConfig[p].color, border: `1px solid ${priorityConfig[p].color}` }
                : { backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {priorityConfig[p].label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={todoDate}
          onChange={e => setTodoDate(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
        />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >Cancel</button>
          <button type="submit" disabled={!title.trim() || loading}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#0e0e10' }}
          >
            {loading && <Loader2 size={11} className="animate-spin" />}
            {initial?.id ? 'Update' : 'Add Task'}
          </button>
        </div>
      </div>
    </form>
  );
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
  editingId: number | null;
  onUpdate: (id: number, data: { title: string; description: string; priority: Priority; date: string }) => void;
  onCancelEdit: () => void;
  loading: boolean;
}

function TodoItem({ todo, onToggle, onDelete, onEdit, editingId, onUpdate, onCancelEdit, loading }: TodoItemProps) {
  const isEditing = editingId === todo.id;

  return (
    <div className={`todo-item animate-fade-in group p-4 rounded-xl border transition-all ${todo.completed ? 'opacity-50' : ''}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {isEditing ? (
        <TodoForm
          initial={todo}
          onSubmit={(data) => onUpdate(todo.id, data)}
          onCancel={onCancelEdit}
          date={todo.date}
          loading={loading}
        />
      ) : (
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggle(todo.id, !todo.completed)}
            className="mt-0.5 flex-shrink-0 transition-all hover:scale-110"
            style={{ color: todo.completed ? 'var(--green)' : 'var(--text-muted)' }}
          >
            {todo.completed
              ? <CheckCircle2 size={18} />
              : <Circle size={18} />
            }
          </button>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${todo.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
              {todo.title}
            </p>
            {todo.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{todo.description}</p>
            )}
            <div className="mt-2">
              <PriorityBadge priority={todo.priority as Priority} />
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(todo)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"
            >
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--surface-2)] transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todosRes, statsRes] = await Promise.all([
        api.getTodos({ date: selectedDate }),
        api.getStats(selectedDate),
      ]);
      setTodos(todosRes.todos || []);
      setStats(statsRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend. Make sure the Go server is running on port 8080.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async (data: { title: string; description: string; priority: Priority; date: string }) => {
    setFormLoading(true);
    try {
      await api.createTodo(data);
      setShowForm(false);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create todo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: { title: string; description: string; priority: Priority; date: string }) => {
    setFormLoading(true);
    try {
      await api.updateTodo(id, data);
      setEditingId(null);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update todo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      await api.updateTodo(id, { completed });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update todo');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete todo');
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const progress = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl italic" style={{ color: 'var(--text)' }}>
            Daily Tasks
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Stay focused. Get things done.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => changeDate(-1)}
            className="p-2 rounded-lg transition-all hover:bg-[var(--surface)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 text-center">
            <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {formatDisplayDate(selectedDate)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </div>
          </div>

          <button onClick={() => changeDate(1)}
            className="p-2 rounded-lg transition-all hover:bg-[var(--surface)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats bar */}
        {stats && stats.total > 0 && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span><span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.total}</span> total</span>
                <span><span className="font-semibold" style={{ color: 'var(--green)' }}>{stats.completed}</span> done</span>
                <span><span className="font-semibold" style={{ color: 'var(--accent)' }}>{stats.pending}</span> left</span>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm animate-fade-in"
            style={{ backgroundColor: '#e87a7a18', border: '1px solid #e87a7a44', color: '#e87a7a' }}
          >
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Filter tabs + Add button */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={filter === f
                ? { backgroundColor: 'var(--accent)', color: '#0e0e10' }
                : { backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <Plus size={13} />
            New Task
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <TodoForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              date={selectedDate}
              loading={formLoading}
            />
          </div>
        )}

        {/* Todo list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">
              {filter === 'done' ? '🎉' : filter === 'pending' ? '✨' : '📋'}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {filter === 'done' ? 'Nothing completed yet' :
               filter === 'pending' ? 'All done! Great work.' :
               'No tasks for this day'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-xs underline underline-offset-2"
                style={{ color: 'var(--accent)' }}
              >
                Add your first task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={(t) => { setEditingId(t.id); setShowForm(false); }}
                editingId={editingId}
                onUpdate={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                loading={formLoading}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Backend: <code className="font-mono">localhost:8080</code> · Go + Gin + SQLite3
        </div>
      </div>
    </div>
  );
}
