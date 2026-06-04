'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Todo, Stats } from '@/lib/api';
import {
  Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Loader2, AlertCircle,
  Flame, Minus, ArrowUp, Link, ExternalLink, Sun, Moon,
  CalendarDays,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
const PRIORITIES = ['low', 'medium', 'high'] as const;
type Priority = typeof PRIORITIES[number];

type FormData = {
  title: string;
  description: string;
  url: string;
  priority: Priority;
  date: string;
};

// ─── Helpers ─────────────────────────────────────────────
function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string) {
  const d   = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const todayStr    = formatDate(now);
  const tom         = new Date(now); tom.setDate(now.getDate() + 1);
  const yest        = new Date(now); yest.setDate(now.getDate() - 1);
  if (dateStr === todayStr)        return 'Today';
  if (dateStr === formatDate(yest)) return 'Yesterday';
  if (dateStr === formatDate(tom))  return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function sanitizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://' + s;
}

function displayUrl(raw: string): string {
  try { return new URL(sanitizeUrl(raw)).hostname.replace(/^www\./, ''); }
  catch { return raw; }
}

// ─── Priority config ──────────────────────────────────────
const P_CFG: Record<Priority, { label: string; dark: string; light: string }> = {
  low:    { label: 'Low',    dark: '#6fcf8c', light: '#2d8a50' },
  medium: { label: 'Medium', dark: '#e8c87a', light: '#c49a2a' },
  high:   { label: 'High',   dark: '#e87a7a', light: '#c94040' },
};

function PriorityBadge({ priority, theme }: { priority: Priority; theme: string }) {
  const cfg   = P_CFG[priority];
  const color = theme === 'light' ? cfg.light : cfg.dark;
  const Icon  = priority === 'high' ? Flame : priority === 'medium' ? ArrowUp : Minus;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}44` }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Form ─────────────────────────────────────────────────
interface FormProps {
  initial?: Partial<Todo>;
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
  date: string;
  loading: boolean;
}

function TodoForm({ initial, onSubmit, onCancel, date, loading }: FormProps) {
  const [title,       setTitle]       = useState(initial?.title       || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [url,         setUrl]         = useState(initial?.url         || '');
  const [priority,    setPriority]    = useState<Priority>(initial?.priority || 'medium');
  const [todoDate,    setTodoDate]    = useState(initial?.date || date);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description, url, priority, date: todoDate });
  };

  const inputCls = "w-full bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] " +
    "border-b border-[var(--border)] pb-2 text-sm outline-none " +
    "focus:border-[var(--accent)] transition-colors";

  return (
    <form onSubmit={submit} className="animate-scale-in space-y-3">
      <input autoFocus className={inputCls} placeholder="What needs to be done?"
        value={title} onChange={e => setTitle(e.target.value)} />

      <textarea rows={2} className={inputCls + " resize-none"}
        placeholder="Description (optional)"
        value={description} onChange={e => setDescription(e.target.value)} />

      {/* URL field */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 focus-within:border-[var(--accent)] transition-colors">
        <Link size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] text-sm outline-none"
          placeholder="Link URL (optional)"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority */}
        <div className="flex gap-1">
          {PRIORITIES.map(p => {
            const active = priority === p;
            return (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={active
                  ? { background: `${P_CFG[p].dark}22`, color: P_CFG[p].dark, border: `1px solid ${P_CFG[p].dark}88` }
                  : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>
                {P_CFG[p].label}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <CalendarDays size={11} />
          <input type="date" value={todoDate} onChange={e => setTodoDate(e.target.value)}
            className="bg-transparent text-[var(--text)] outline-none text-xs" />
        </div>

        {/* Actions */}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            Cancel
          </button>
          <button type="submit" disabled={!title.trim() || loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0e0e10' }}>
            {loading && <Loader2 size={11} className="animate-spin" />}
            {initial?.id ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Todo Item ────────────────────────────────────────────
interface ItemProps {
  todo: Todo;
  theme: string;
  onToggle: (id: number, v: boolean) => void;
  onDelete: (id: number) => void;
  onEdit:   (t: Todo) => void;
  editingId: number | null;
  onUpdate: (id: number, d: FormData) => void;
  onCancelEdit: () => void;
  loading: boolean;
}

function TodoItem({ todo, theme, onToggle, onDelete, onEdit, editingId, onUpdate, onCancelEdit, loading }: ItemProps) {
  const isEditing = editingId === todo.id;

  return (
    <div className={`todo-item group rounded-2xl border transition-all ${todo.completed ? 'opacity-60' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>

      {isEditing ? (
        <div className="p-4">
          <TodoForm
            initial={todo}
            onSubmit={d => onUpdate(todo.id, d)}
            onCancel={onCancelEdit}
            date={todo.date}
            loading={loading}
          />
        </div>
      ) : (
        <div className="p-4 flex items-start gap-3">
          {/* Checkbox */}
          <button onClick={() => onToggle(todo.id, !todo.completed)}
            className="mt-0.5 flex-shrink-0 transition-all hover:scale-110 active:scale-95"
            style={{ color: todo.completed ? 'var(--green)' : 'var(--text-subtle)' }}>
            {todo.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${todo.completed ? 'line-through' : ''}`}
              style={{ color: todo.completed ? 'var(--text-muted)' : 'var(--text)' }}>
              {todo.title}
            </p>

            {todo.description && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {todo.description}
              </p>
            )}

            {/* Badges row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PriorityBadge priority={todo.priority as Priority} theme={theme} />

              {todo.url && (
                <a href={sanitizeUrl(todo.url)} target="_blank" rel="noopener noreferrer"
                  className="url-chip" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={10} />
                  {displayUrl(todo.url)}
                </a>
              )}
            </div>
          </div>

          {/* Actions (hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(todo)}
              className="p-1.5 rounded-lg transition-all hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--text-muted)' }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg transition-all hover:bg-[var(--red-dim)]"
              style={{ color: 'var(--text-muted)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function HomePage() {
  const [theme,       setTheme]       = useState<'dark' | 'light'>('dark');
  const [todos,       setTodos]       = useState<Todo[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [filter,      setFilter]      = useState<'all' | 'pending' | 'done'>('all');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist theme
  useEffect(() => {
    const saved = localStorage.getItem('todo-theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
  }, []);
  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('todo-theme', next);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [todosRes, statsRes] = await Promise.all([
        api.getTodos({ date: selectedDate }),
        api.getStats(selectedDate),
      ]);
      setTodos(todosRes.todos || []);
      setStats(statsRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect. Is the Go server running on :8080?');
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

  const goToday = () => {
    setSelectedDate(formatDate(new Date()));
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async (data: FormData) => {
    setFormLoading(true);
    try {
      await api.createTodo({ ...data, url: sanitizeUrl(data.url) });
      setShowForm(false);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create todo');
    } finally { setFormLoading(false); }
  };

  const handleUpdate = async (id: number, data: FormData) => {
    setFormLoading(true);
    try {
      await api.updateTodo(id, { ...data, url: sanitizeUrl(data.url) });
      setEditingId(null);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update todo');
    } finally { setFormLoading(false); }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      await api.updateTodo(id, { completed });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const filtered = todos.filter(t =>
    filter === 'pending' ? !t.completed :
    filter === 'done'    ?  t.completed : true
  );

  const progress = stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100) : 0;

  const isToday = selectedDate === formatDate(new Date());

  return (
    <div className="app-content min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl italic" style={{ color: 'var(--text)' }}>
              Daily Tasks
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Stay focused. Get things done.
            </p>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className="theme-toggle mt-1" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <div className="theme-toggle-thumb" />
          </button>
        </div>

        {/* ── Date Navigator ── */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => changeDate(-1)}
            className="p-2 rounded-xl transition-all hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 text-center py-1">
            <div className="text-base font-semibold flex items-center justify-center gap-2"
              style={{ color: 'var(--text)' }}>
              {formatDisplayDate(selectedDate)}
              {!isToday && (
                <button onClick={goToday}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full transition-all"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  Today
                </button>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </div>
          </div>

          <button onClick={() => changeDate(1)}
            className="p-2 rounded-xl transition-all hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Progress bar ── */}
        {stats && stats.total > 0 && (
          <div className="mb-5 p-4 rounded-2xl animate-slide-down"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{stats.total}</span> total
                </span>
                <span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--green)' }}>{stats.completed}</span> done
                </span>
                <span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{stats.pending}</span> left
                </span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: progress === 100 ? 'var(--green)' : 'var(--accent)' }}>
                {progress === 100 ? '🎉 All done!' : `${progress}%`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: progress === 100 ? 'var(--green)' : 'var(--accent)' }} />
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm animate-fade-in"
            style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)' }}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-xs leading-relaxed">{error}</span>
            <button onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
              style={filter === f
                ? { background: 'var(--accent)', color: '#0e0e10' }
                : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }>
              {f}
            </button>
          ))}

          <button onClick={() => { setShowForm(true); setEditingId(null); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <Plus size={13} />
            New Task
          </button>
        </div>

        {/* ── Add form ── */}
        {showForm && (
          <div className="mb-4 p-4 rounded-2xl animate-slide-down"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <TodoForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              date={selectedDate}
              loading={formLoading}
            />
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-subtle)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4 select-none">
              {filter === 'done' ? '🎉' : filter === 'pending' ? '✨' : '📋'}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {filter === 'done'    ? 'Nothing completed yet'  :
               filter === 'pending' ? 'All done! Great work.'  :
               'No tasks for this day'}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-xs font-medium underline underline-offset-4"
                style={{ color: 'var(--accent)' }}>
                Add your first task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                theme={theme}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={t => { setEditingId(t.id); setShowForm(false); }}
                editingId={editingId}
                onUpdate={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                loading={formLoading}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-12 text-center text-xs flex items-center justify-center gap-2"
          style={{ color: 'var(--text-subtle)' }}>
          <span>Go · Gin · SQLite3</span>
          <span>·</span>
          <span>Next.js · Tailwind</span>
        </div>

      </div>
    </div>
  );
}
