import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  LogOut, Plus, Trash2, Edit2, Eye, EyeOff,
  ChevronDown, ChevronUp, CheckCircle, Copy, Link2, BookOpen, Briefcase,
  Upload, ImageIcon, Reply, Send, Layers, X, ArrowLeft, AlertCircle, Info,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Inquiry, Project, Post, KnowledgeBaseEntry, GalleryImage, ProjectSection, PostSection } from '@shared/schema';

// ── Upload helper — XHR so we get progress events ─────────────────────────────

function xhrUpload<T>(
  url: string,
  body: BodyInit,
  headers: Record<string, string>,
  onProgress: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as T);
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(err.error ?? 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(body);
  });
}

// ── Toast system ──────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; title: string; detail?: string; }
type AddToast = (type: ToastType, title: string, detail?: string) => void;

const ToastContext = createContext<AddToast>(() => {});

let _toastCounter = 0;

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback<AddToast>((type, title, detail) => {
    const id = ++_toastCounter;
    setToasts(prev => [...prev, { id, type, title, detail }]);
    const timeout = type === 'error' ? 6000 : 3500;
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), timeout);
  }, []);

  const dismiss = useCallback((id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  const iconFor = (type: ToastType) => {
    if (type === 'success') return <CheckCircle size={15} className="shrink-0 text-primary mt-0.5" />;
    if (type === 'error')   return <AlertCircle size={15} className="shrink-0 text-destructive mt-0.5" />;
    return <Info size={15} className="shrink-0 text-muted-foreground mt-0.5" />;
  };

  const borderFor = (type: ToastType) => {
    if (type === 'success') return 'border-primary/25';
    if (type === 'error')   return 'border-destructive/30';
    return 'border-border';
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[380px] rounded-[var(--radius)] border bg-card shadow-lg px-4 py-3 ${borderFor(t.type)}`}
            >
              {iconFor(t.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug text-foreground">{t.title}</p>
                {t.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">{t.detail}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function useToast() { return useContext(ToastContext); }

// ── Auth ──────────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiRequest('POST', '/api/auth/login', { username, password });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-6">
      <a
        href="/"
        className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wider"
      >
        <ArrowLeft size={13} />
        Home
      </a>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('w-full max-w-sm', shaking && 'shake')}
      >
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
            SSM-LTD
          </p>
          <h1 className="font-syne font-bold text-3xl text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Restricted area — authorised personnel only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Enquiries tab ─────────────────────────────────────────────────────────────

function EnquiriesTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replyOpenFor, setReplyOpenFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySentIds, setReplySentIds] = useState<number[]>([]);

  function toggleExpand(id: number) {
    if (expanded === id) {
      setExpanded(null);
      setReplyOpenFor(null);
      setReplyText('');
      setReplyError(null);
    } else {
      setExpanded(id);
    }
  }

  function openReply(id: number) {
    setReplyOpenFor(id);
    setReplyText('');
    setReplyError(null);
  }

  function closeReply() {
    setReplyOpenFor(null);
    setReplyText('');
    setReplyError(null);
  }

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ['admin', 'inquiries'],
    queryFn: () => apiRequest<Inquiry[]>('GET', '/api/admin/inquiries'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/admin/inquiries/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] });
      toast('success', 'Status updated');
    },
    onError: (err: Error) => toast('error', 'Failed to update status', err.message),
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/inquiries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] });
      setExpanded(null);
      setReplyOpenFor(null);
      toast('success', 'Enquiry deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete enquiry', err.message),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      apiRequest('POST', `/api/admin/inquiries/${id}/reply`, { body }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] });
      setReplySentIds(prev => [...prev, vars.id]);
      closeReply();
      toast('success', 'Reply sent');
    },
    onError: (err: Error) => {
      setReplyError('Failed to send — check your email config and try again.');
      toast('error', 'Reply failed to send', err.message);
    },
  });

  const statusColour = (status: string) => {
    if (status === 'new') return 'default';
    if (status === 'read') return 'muted';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">No enquiries yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map(inq => (
        <div key={inq.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => toggleExpand(inq.id)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <Badge variant={statusColour(inq.status)}>{inq.status}</Badge>
              <span className="font-medium text-sm text-foreground truncate">
                {inq.firstName} {inq.lastName}
              </span>
              <span className="text-xs text-muted-foreground truncate hidden sm:block">
                {inq.email}
              </span>
              <span className="font-mono text-xs text-muted-foreground hidden md:block">
                [{inq.source}]
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {formatDate(inq.createdAt!)}
              </span>
              {expanded === inq.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {expanded === inq.id && (
            <div className="border-t border-border px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${inq.email}`} className="text-primary hover:underline">
                    {inq.email}
                  </a>
                </div>
                {inq.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <a href={`tel:${inq.phone}`} className="text-foreground">
                      {inq.phone}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-[var(--radius)] p-3">
                  {inq.message}
                </p>
              </div>

              {inq.chatTranscript && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Chat transcript</p>
                  <pre className="text-xs text-muted-foreground bg-muted rounded-[var(--radius)] p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                    {(() => {
                      try {
                        const msgs = JSON.parse(inq.chatTranscript!) as Array<{ role: string; content: string }>;
                        return msgs.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
                      } catch {
                        return inq.chatTranscript;
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* Reply sent confirmation */}
              {replySentIds.includes(inq.id) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 text-xs">
                  <CheckCircle size={12} />
                  Reply sent to {inq.email}
                </div>
              )}

              {/* Reply composer */}
              {replyOpenFor === inq.id ? (
                <div className="space-y-2 border border-border rounded-[var(--radius)] p-3 bg-muted/30">
                  <p className="text-xs font-medium text-foreground">
                    Reply to {inq.firstName} ({inq.email})
                  </p>
                  <textarea
                    className="w-full text-sm rounded-[var(--radius)] border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={6}
                    placeholder="Write your reply…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    autoFocus
                  />
                  {replyError && (
                    <p className="text-xs text-destructive">{replyError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate({ id: inq.id, body: replyText })}
                    >
                      <Send size={13} />
                      {replyMutation.isPending ? 'Sending…' : 'Send reply'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={closeReply}
                      disabled={replyMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => openReply(inq.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer font-medium"
                  >
                    <Reply size={12} />
                    Reply by email
                  </button>
                </div>
              )}

              {/* Status + delete row */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Mark as:</span>
                  {['new', 'read', 'replied'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate({ id: inq.id, status: s })}
                      disabled={inq.status === s}
                      className={cn(
                        'px-3 py-1 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer',
                        inq.status === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this enquiry? This cannot be undone.')) {
                      deleteInquiryMutation.mutate(inq.id);
                    }
                  }}
                  disabled={deleteInquiryMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[var(--radius)] border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Portfolio tab ─────────────────────────────────────────────────────────────

const LAYOUT_OPTIONS = [
  { value: 'text-above',   label: 'Text above, photos below' },
  { value: 'photos-above', label: 'Photos above, text below' },
  { value: 'side-by-side', label: 'Side by side (text left, photos right)' },
] as const;

function SectionEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<ProjectSection>;
  onSave: (data: { title: string; body: string; imageUrls: string[]; displayOrder: number; layout: string }) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [layout, setLayout] = useState(initial?.layout ?? 'text-above');
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      const img = await response.json() as { id: number };
      const url = `/api/gallery/images/${img.id}`;
      setImageUrls(prev => [...prev, url]);
    } catch {
      setUploadError('Upload failed — try again');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4 border border-border rounded-[var(--radius)] bg-muted/20 p-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-1.5">
          <Label>Section title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. The challenge, What we built, Results"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Order</Label>
          <Input
            type="number"
            value={displayOrder}
            onChange={e => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Layout</Label>
        <Select value={layout} onChange={e => setLayout(e.target.value)}>
          {LAYOUT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Write-up (markdown supported)</Label>
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          placeholder="Describe this aspect of the project…"
        />
      </div>

      <div className="space-y-2">
        <Label>Photos for this section</Label>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative group w-24 h-20 rounded-[var(--radius)] overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-background/80 text-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload size={11} />
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => onSave({ title, body, imageUrls, displayOrder, layout })}
          disabled={!title.trim() || saving}
        >
          {saving ? 'Saving…' : 'Save section'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SectionsPanel({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: sections = [], isLoading } = useQuery<ProjectSection[]>({
    queryKey: ['admin', 'sections', projectId],
    queryFn: () => apiRequest<ProjectSection[]>('GET', `/api/admin/projects/${projectId}/sections`),
  });

  const createSection = useMutation({
    mutationFn: (data: object) =>
      apiRequest('POST', `/api/admin/projects/${projectId}/sections`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sections', projectId] });
      setAddingNew(false);
      toast('success', 'Section added');
    },
    onError: (err: Error) => toast('error', 'Failed to add section', err.message),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      apiRequest('PATCH', `/api/admin/projects/${projectId}/sections/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sections', projectId] });
      setEditingId(null);
      toast('success', 'Section saved');
    },
    onError: (err: Error) => toast('error', 'Failed to save section', err.message),
  });

  const deleteSection = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/projects/${projectId}/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sections', projectId] });
      toast('success', 'Section deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete section', err.message),
  });

  return (
    <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Project Sections
        </h4>
        {!addingNew && (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[var(--radius)] border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Plus size={11} />
            Add section
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-[var(--radius)]" />
          ))}
        </div>
      ) : sections.length === 0 && !addingNew ? (
        <p className="text-xs text-muted-foreground py-2">
          No sections yet. Add one to enrich this project's detail page.
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
              {editingId === section.id ? (
                <div className="p-3">
                  <SectionEditor
                    initial={section}
                    onSave={data => updateSection.mutate({ id: section.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateSection.isPending}
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between px-3 py-2 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{section.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {section.body ? section.body.slice(0, 80) + (section.body.length > 80 ? '…' : '') : 'No write-up yet'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(section.imageUrls ?? []).length > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {section.imageUrls!.length} photo{section.imageUrls!.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {section.layout && section.layout !== 'text-above' && (
                        <span className="text-[10px] font-mono text-primary/70 capitalize">
                          {LAYOUT_OPTIONS.find(o => o.value === section.layout)?.label ?? section.layout}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingId(section.id)}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete section "${section.title}"?`)) {
                          deleteSection.mutate(section.id);
                        }
                      }}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addingNew && (
        <SectionEditor
          onSave={data => createSection.mutate(data)}
          onCancel={() => setAddingNew(false)}
          saving={createSection.isPending}
        />
      )}
    </div>
  );
}

function ProjectForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  onCancel: () => void;
  saving?: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState<Partial<Project>>({
    title: '',
    slug: '',
    client: '',
    year: undefined,
    description: '',
    longDescription: '',
    tags: [],
    services: [],
    imageUrl: '',
    imageUrls: [],
    previewVideoUrl: '',
    liveUrl: '',
    featured: false,
    caseStudy: false,
    testimonial: '',
    testimonialAuthor: '',
    order: 0,
    ...initial,
  });
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [servicesInput, setServicesInput] = useState((initial?.services ?? []).join(', '));
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [testimonialTab, setTestimonialTab] = useState<'text' | 'image'>(
    (initial as Partial<Project & { testimonialImageUrl?: string }>)?.testimonialImageUrl ? 'image' : 'text',
  );
  const [testimonialImgUploading, setTestimonialImgUploading] = useState(false);
  const [testimonialImgProgress, setTestimonialImgProgress] = useState(0);
  const [testimonialImgError, setTestimonialImgError] = useState<string | null>(null);
  const testimonialImgRef = useRef<HTMLInputElement>(null);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setVideoProgress(0);
    setVideoUploadError(null);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const body = JSON.stringify({ filename: file.name, data });
      const result = await xhrUpload<{ url: string }>(
        '/api/admin/projects/upload-preview-video',
        body,
        { 'Content-Type': 'application/json' },
        (p) => setVideoProgress(p),
      );
      setForm(prev => ({ ...prev, previewVideoUrl: result.url }));
    } catch (err) {
      setVideoUploadError(err instanceof Error ? err.message : 'Upload failed — try again');
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }

  function handleChange(field: keyof Project, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    setHeroProgress(0);
    setHeroUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const img = await xhrUpload<{ id: number }>(
        '/api/admin/gallery/upload', formData, {}, (p) => setHeroProgress(p),
      );
      const url = `/api/gallery/images/${img.id}`;
      setForm(prev => ({ ...prev, imageUrls: [...(prev.imageUrls ?? []), url] }));
    } catch {
      setHeroUploadError('Upload failed — try again');
    } finally {
      setHeroUploading(false);
      setHeroProgress(0);
      if (heroFileRef.current) heroFileRef.current.value = '';
    }
  }

  async function handleTestimonialImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTestimonialImgUploading(true);
    setTestimonialImgProgress(0);
    setTestimonialImgError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const result = await xhrUpload<{ id: number }>(
        '/api/admin/gallery/upload', fd, {}, (p) => setTestimonialImgProgress(p),
      );
      const url = `/api/gallery/images/${result.id}`;
      setForm(prev => ({ ...prev, testimonialImageUrl: url } as typeof prev));
    } catch (err) {
      setTestimonialImgError(err instanceof Error ? err.message : 'Upload failed — try again');
    } finally {
      setTestimonialImgUploading(false);
      setTestimonialImgProgress(0);
      if (testimonialImgRef.current) testimonialImgRef.current.value = '';
    }
  }

  function handleSave() {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const services = servicesInput.split(',').map(s => s.trim()).filter(Boolean);
    onSave({ ...form, tags, services });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title ?? ''} onChange={e => handleChange('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={form.slug ?? ''} onChange={e => handleChange('slug', e.target.value)} placeholder="my-project" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Client</Label>
          <Input value={form.client ?? ''} onChange={e => handleChange('client', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Input
            type="number"
            value={form.year ?? ''}
            onChange={e => handleChange('year', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder={String(new Date().getFullYear())}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description (short)</Label>
        <Textarea value={form.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Long description</Label>
        <Textarea value={form.longDescription ?? ''} onChange={e => handleChange('longDescription', e.target.value)} rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tags (comma-separated)</Label>
          <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="React, TypeScript, PostgreSQL" />
        </div>
        <div className="space-y-1.5">
          <Label>Services (comma-separated)</Label>
          <Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Web Design, Cybersecurity Audit" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Order</Label>
          <Input type="number" value={form.order ?? 0} onChange={e => handleChange('order', parseInt(e.target.value, 10))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Live URL</Label>
        <Input value={form.liveUrl ?? ''} onChange={e => handleChange('liveUrl', e.target.value)} placeholder="https://…" />
      </div>

      {/* Hero carousel images */}
      <div className="space-y-2">
        <Label>Hero images (carousel on project page)</Label>
        <p className="text-xs text-muted-foreground">
          Upload multiple images for a slideshow. First image is used as thumbnail on the work grid. Leave empty to use a plain URL below.
        </p>
        {(form.imageUrls ?? []).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {(form.imageUrls ?? []).map((url, idx) => (
              <div key={idx} className="relative group w-24 h-20 rounded-[var(--radius)] overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrls: (prev.imageUrls ?? []).filter((_, i) => i !== idx) }))}
                  className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-background/80 text-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <input ref={heroFileRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
          <button
            type="button"
            onClick={() => heroFileRef.current?.click()}
            disabled={heroUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload size={11} />
            {heroUploading ? `Uploading… ${heroProgress}%` : 'Upload hero image'}
          </button>
          {heroUploading && heroProgress > 0 && (
            <div className="mt-1.5 h-1 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-200 rounded-full" style={{ width: `${heroProgress}%` }} />
            </div>
          )}
          {heroUploadError && <p className="text-xs text-destructive mt-1">{heroUploadError}</p>}
        </div>
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs text-muted-foreground">Or paste a URL (used if no uploads above)</Label>
          <Input value={form.imageUrl ?? ''} onChange={e => handleChange('imageUrl', e.target.value)} placeholder="https://…" />
        </div>
      </div>
      {/* Preview GIF */}
      <div className="space-y-2 border border-border rounded-[var(--radius)] p-4">
        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Preview GIF (card thumbnail)</Label>
        <p className="text-xs text-muted-foreground">
          Replaces the still image on portfolio cards with an animated GIF. Max 10 MB.
        </p>
        {form.previewVideoUrl ? (
          <div className="relative">
            <img
              src={form.previewVideoUrl}
              alt="Preview GIF"
              className="w-full max-h-40 rounded-[var(--radius)] border border-border object-cover bg-muted"
            />
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, previewVideoUrl: '' }))}
              className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-background/80 text-foreground hover:text-destructive transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={videoFileRef}
              type="file"
              accept="image/gif"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoFileRef.current?.click()}
              disabled={videoUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload size={11} />
              {videoUploading ? `Uploading… ${videoProgress}%` : 'Upload preview GIF'}
            </button>
            {videoUploading && videoProgress > 0 && (
              <div className="mt-1.5 h-1 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200 rounded-full" style={{ width: `${videoProgress}%` }} />
              </div>
            )}
            {videoUploadError && <p className="text-xs text-destructive mt-1">{videoUploadError}</p>}
          </div>
        )}
      </div>

      {/* Testimonial */}
      <div className="space-y-3 border border-border rounded-[var(--radius)] p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Testimonial</Label>
          <div className="flex rounded-[var(--radius)] overflow-hidden border border-border text-xs">
            <button
              type="button"
              onClick={() => setTestimonialTab('text')}
              className={`px-3 py-1 transition-colors ${testimonialTab === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setTestimonialTab('image')}
              className={`px-3 py-1 transition-colors ${testimonialTab === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Screenshot
            </button>
          </div>
        </div>

        {testimonialTab === 'text' ? (
          <div className="space-y-1.5">
            <Textarea
              value={form.testimonial ?? ''}
              onChange={e => handleChange('testimonial', e.target.value)}
              rows={3}
              placeholder="Quote from the client…"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {(form as Partial<Project & { testimonialImageUrl?: string }>).testimonialImageUrl ? (
              <div className="relative group w-full rounded-[var(--radius)] overflow-hidden border border-border">
                <img
                  src={(form as Partial<Project & { testimonialImageUrl?: string }>).testimonialImageUrl}
                  alt="Testimonial screenshot"
                  className="w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, testimonialImageUrl: '' } as typeof prev))}
                  className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-background/80 text-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity border border-border"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Upload a screenshot of a review or message from the client.</p>
            )}
            <div>
              <input
                ref={testimonialImgRef}
                type="file"
                accept="image/*"
                onChange={handleTestimonialImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => testimonialImgRef.current?.click()}
                disabled={testimonialImgUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload size={11} />
                {testimonialImgUploading ? `Uploading… ${testimonialImgProgress}%` : 'Upload screenshot'}
              </button>
              {testimonialImgUploading && testimonialImgProgress > 0 && (
                <div className="mt-1.5 h-1 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-200 rounded-full" style={{ width: `${testimonialImgProgress}%` }} />
                </div>
              )}
              {testimonialImgError && <p className="text-xs text-destructive mt-1">{testimonialImgError}</p>}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Attribution</Label>
          <Input
            value={form.testimonialAuthor ?? ''}
            onChange={e => handleChange('testimonialAuthor', e.target.value)}
            placeholder="Jane Smith, Head of IT at Acme Ltd"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.featured ?? false}
            onChange={e => handleChange('featured', e.target.checked)}
            className="rounded"
          />
          Featured project
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.caseStudy ?? false}
            onChange={e => handleChange('caseStudy', e.target.checked)}
            className="rounded"
          />
          Full case study
          <span className="text-xs text-muted-foreground">(shows write-up &amp; sections; otherwise listed as showcase only)</span>
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={handleSave} size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save project'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} size="sm" disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PortfolioTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [sectionsOpenFor, setSectionsOpenFor] = useState<number | null>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['admin', 'projects'],
    queryFn: () => apiRequest<Project[]>('GET', '/api/admin/projects'),
  });

  const [projectError, setProjectError] = useState<string | null>(null);

  const createProject = useMutation({
    mutationFn: (data: Partial<Project>) =>
      apiRequest('POST', '/api/admin/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      setAddingNew(false);
      setProjectError(null);
      toast('success', 'Project created');
    },
    onError: (err: Error) => {
      setProjectError(err.message || 'Failed to save project');
      toast('error', 'Failed to create project', err.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      apiRequest('PATCH', `/api/admin/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      setEditProject(null);
      setProjectError(null);
      toast('success', 'Project saved');
    },
    onError: (err: Error) => {
      setProjectError(err.message || 'Failed to save project');
      toast('error', 'Failed to save project', err.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      toast('success', 'Project deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete project', err.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-syne font-bold text-xl text-foreground">Portfolio</h2>
        <Button size="sm" onClick={() => setAddingNew(true)}>
          <Plus size={14} />
          Add project
        </Button>
      </div>

      {/* Add new form */}
      {addingNew && (
        <div className="border border-border rounded-[var(--radius)] bg-card p-5 mb-5">
          <h3 className="font-syne font-bold text-lg text-foreground mb-4">New project</h3>
          <ProjectForm
            onSave={data => createProject.mutate(data)}
            onCancel={() => { setAddingNew(false); setProjectError(null); }}
            saving={createProject.isPending}
            error={projectError}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-[var(--radius)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
              {editProject?.id === project.id ? (
                <div className="p-5">
                  <h3 className="font-syne font-bold text-lg text-foreground mb-4">Edit project</h3>
                  <ProjectForm
                    initial={editProject}
                    onSave={data => updateProject.mutate({ id: project.id, data })}
                    onCancel={() => { setEditProject(null); setProjectError(null); }}
                    saving={updateProject.isPending}
                    error={projectError}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{project.title}</p>
                        {project.caseStudy && (
                          <span className="text-[9px] font-mono uppercase tracking-wider text-primary border border-primary/30 px-1.5 py-0.5 flex-shrink-0">
                            Case Study
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.client ?? 'No client'}{project.year ? ` · ${project.year}` : ''} · /{project.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                      <button
                        onClick={() => setSectionsOpenFor(sectionsOpenFor === project.id ? null : project.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 h-7 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer',
                          sectionsOpenFor === project.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                        aria-label="Manage sections"
                      >
                        <Layers size={11} />
                        Sections
                      </button>
                      <button
                        onClick={() => setEditProject(project)}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius)] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit project"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${project.title}"?`)) {
                            deleteProject.mutate(project.id);
                          }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius)] hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {sectionsOpenFor === project.id && (
                    <SectionsPanel projectId={project.id} />
                  )}
                </>
              )}
            </div>
          ))}
          {projects.length === 0 && !addingNew && (
            <p className="text-muted-foreground text-center py-12">No projects yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Blog tab ──────────────────────────────────────────────────────────────────

// ── Post Section Editor ───────────────────────────────────────────────────────

const POST_SECTION_TYPES = [
  { value: 'text',      label: 'Text',        desc: 'Markdown prose block' },
  { value: 'photo',     label: 'Photo',       desc: 'Full-width image' },
  { value: 'callout',   label: 'Callout',     desc: 'Pull quote or highlight' },
  { value: 'alert',     label: 'Alert',       desc: 'Info / warning / success banner' },
  { value: 'card',      label: 'Card',        desc: 'Bordered card with label' },
  { value: 'timeline',  label: 'Timeline',    desc: 'Ordered steps list' },
  { value: 'checklist', label: 'Checklist',   desc: 'Ticked items list' },
  { value: 'cta',       label: 'CTA',         desc: 'Call-to-action block' },
] as const;

type PostSectionType = typeof POST_SECTION_TYPES[number]['value'];

const TYPE_BADGE: Record<PostSectionType, string> = {
  text:      'bg-muted text-muted-foreground',
  photo:     'bg-primary/10 text-primary',
  callout:   'bg-primary/10 text-primary',
  alert:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  card:      'bg-muted text-muted-foreground',
  timeline:  'bg-primary/10 text-primary',
  checklist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cta:       'bg-primary/15 text-primary',
};

function ItemsListBuilder({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  function add() { onChange([...items, '']); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function update(i: number, v: string) { onChange(items.map((it, idx) => idx === i ? v : it)); }
  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  }
  function moveDown(i: number) {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex flex-col gap-0.5">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronUp size={11} />
            </button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === items.length - 1}
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronDown size={11} />
            </button>
          </div>
          <Textarea
            value={item}
            onChange={e => update(i, e.target.value)}
            rows={2}
            className="flex-1 text-sm"
            placeholder={placeholder ?? 'Enter item text…'}
          />
          <button type="button" onClick={() => remove(i)}
            className="mt-1 h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer">
        <Plus size={11} />
        Add item
      </button>
    </div>
  );
}

interface PostSectionFormData {
  type: PostSectionType;
  title: string;
  body: string;
  imageUrl: string;
  caption: string;
  variant: string;
  items: string[];
  btnLabel: string;
  btnHref: string;
}

function PostSectionEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<PostSection>;
  onSave: (data: Omit<PostSectionFormData, 'items' | 'btnLabel' | 'btnHref'> & { items: string; displayOrder?: number }) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<PostSectionFormData>({
    type: (initial?.type as PostSectionType) ?? 'text',
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    imageUrl: initial?.imageUrl ?? '',
    caption: initial?.caption ?? '',
    variant: initial?.variant ?? 'info',
    items: (() => {
      if (!initial?.items) return [];
      try {
        const p = JSON.parse(initial.items);
        if (initial.type === 'cta') return [];
        return Array.isArray(p) ? p : [];
      } catch { return []; }
    })(),
    btnLabel: (() => {
      if (initial?.type !== 'cta' || !initial?.items) return 'Get in touch';
      try { return (JSON.parse(initial.items) as { btnLabel?: string }).btnLabel ?? 'Get in touch'; } catch { return 'Get in touch'; }
    })(),
    btnHref: (() => {
      if (initial?.type !== 'cta' || !initial?.items) return '/contact';
      try { return (JSON.parse(initial.items) as { btnHref?: string }).btnHref ?? '/contact'; } catch { return '/contact'; }
    })(),
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof PostSectionFormData>(k: K, v: PostSectionFormData[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const img = await xhrUpload<{ id: number }>(
        '/api/admin/gallery/upload',
        formData,
        {},
        pct => setUploadProgress(pct),
      );
      set('imageUrl', `/api/gallery/images/${img.id}`);
      setUploadProgress(null);
    } catch (err) {
      setUploadError((err as Error).message || 'Upload failed');
      setUploadProgress(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function buildItemsString(): string {
    if (form.type === 'cta') {
      return JSON.stringify({ btnLabel: form.btnLabel, btnHref: form.btnHref });
    }
    if (form.type === 'timeline' || form.type === 'checklist') {
      return JSON.stringify(form.items);
    }
    return '';
  }

  function handleSave() {
    onSave({
      type: form.type,
      title: form.title,
      body: form.body,
      imageUrl: form.imageUrl,
      caption: form.caption,
      variant: form.variant,
      items: buildItemsString(),
    });
  }

  const t = form.type;

  return (
    <div className="space-y-4 border border-border rounded-[var(--radius)] bg-muted/20 p-4">
      {/* Type picker */}
      {!initial?.id && (
        <div className="space-y-1.5">
          <Label>Section type</Label>
          <div className="flex flex-wrap gap-2">
            {POST_SECTION_TYPES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('type', opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer',
                  form.type === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text */}
      {t === 'text' && (
        <>
          <div className="space-y-1.5">
            <Label>Heading <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Section heading" />
          </div>
          <div className="space-y-1.5">
            <Label>Body (Markdown)</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={8} className="font-mono text-sm" placeholder="Write your content…" />
          </div>
        </>
      )}

      {/* Photo */}
      {t === 'photo' && (
        <>
          <div className="space-y-1.5">
            <Label>Image</Label>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" className="w-full max-h-48 object-cover rounded-[var(--radius)] border border-border mb-2" />
            )}
            <div className="flex items-center gap-2">
              <Input
                value={form.imageUrl}
                onChange={e => set('imageUrl', e.target.value)}
                placeholder="https://… or use upload"
                className="flex-1"
              />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                <Upload size={11} />
                {uploadProgress !== null ? `${uploadProgress}%` : 'Upload'}
              </button>
            </div>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            {uploadProgress !== null && uploadProgress < 100 && (
              <div className="h-1 rounded bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Caption <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="Describe the image" />
          </div>
        </>
      )}

      {/* Callout */}
      {t === 'callout' && (
        <>
          <div className="space-y-1.5">
            <Label>Quote / highlight text</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={3} placeholder="'The quote or key point…'" />
          </div>
          <div className="space-y-1.5">
            <Label>Attribution <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. John Smith, CEO" />
          </div>
        </>
      )}

      {/* Alert */}
      {t === 'alert' && (
        <>
          <div className="space-y-1.5">
            <Label>Variant</Label>
            <div className="flex gap-2">
              {(['info', 'warning', 'success'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('variant', v)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer capitalize',
                    form.variant === v
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Label <span className="text-muted-foreground font-normal">(optional — overrides default)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. INCIDENT NOTICE" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={3} placeholder="Alert message text…" />
          </div>
        </>
      )}

      {/* Card */}
      {t === 'card' && (
        <>
          <div className="space-y-1.5">
            <Label>Card label <span className="text-muted-foreground font-normal">(mono, uppercase)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. ⚠ Incident Origin" />
          </div>
          <div className="space-y-1.5">
            <Label>Accent colour <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex gap-2">
              {(['none', 'primary', 'warning', 'danger'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('variant', v === 'none' ? '' : v)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer capitalize',
                    (form.variant || 'none') === v
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Body (Markdown)</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={5} className="font-mono text-sm" placeholder="Card content…" />
          </div>
        </>
      )}

      {/* Timeline */}
      {t === 'timeline' && (
        <>
          <div className="space-y-1.5">
            <Label>Heading <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Our Response" />
          </div>
          <div className="space-y-1.5">
            <Label>Steps (in order)</Label>
            <ItemsListBuilder items={form.items} onChange={v => set('items', v)} placeholder="Describe this step…" />
          </div>
        </>
      )}

      {/* Checklist */}
      {t === 'checklist' && (
        <>
          <div className="space-y-1.5">
            <Label>Heading <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. What We Did — In Full" />
          </div>
          <div className="space-y-1.5">
            <Label>Items</Label>
            <ItemsListBuilder items={form.items} onChange={v => set('items', v)} placeholder="Checklist item…" />
          </div>
        </>
      )}

      {/* CTA */}
      {t === 'cta' && (
        <>
          <div className="space-y-1.5">
            <Label>Heading</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Security you can rely on." />
          </div>
          <div className="space-y-1.5">
            <Label>Subtext</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={2} placeholder="Short supporting sentence…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Button label</Label>
              <Input value={form.btnLabel} onChange={e => set('btnLabel', e.target.value)} placeholder="Contact SSM-LTD" />
            </div>
            <div className="space-y-1.5">
              <Label>Button link</Label>
              <Input value={form.btnHref} onChange={e => set('btnHref', e.target.value)} placeholder="/contact" />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : initial?.id ? 'Update section' : 'Add section'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Post Sections Panel ───────────────────────────────────────────────────────

function PostSectionsPanel({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: sections = [], isLoading } = useQuery<PostSection[]>({
    queryKey: ['admin', 'post-sections', postId],
    queryFn: () => apiRequest<PostSection[]>('GET', `/api/admin/posts/${postId}/sections`),
  });

  const createSection = useMutation({
    mutationFn: (data: object) => apiRequest('POST', `/api/admin/posts/${postId}/sections`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'post-sections', postId] });
      setAddingNew(false);
      toast('success', 'Section added');
    },
    onError: (err: Error) => toast('error', 'Failed to add section', err.message),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      apiRequest('PATCH', `/api/admin/post-sections/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'post-sections', postId] });
      setEditingId(null);
      toast('success', 'Section saved');
    },
    onError: (err: Error) => toast('error', 'Failed to save section', err.message),
  });

  const deleteSection = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/post-sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'post-sections', postId] });
      toast('success', 'Section deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete section', err.message),
  });

  const reorder = useMutation({
    mutationFn: (ids: number[]) => apiRequest('POST', '/api/admin/post-sections/reorder', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'post-sections', postId] }),
    onError: (err: Error) => toast('error', 'Failed to reorder sections', err.message),
  });

  function moveSection(idx: number, dir: -1 | 1) {
    const newSections = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    reorder.mutate(newSections.map(s => s.id));
  }

  function previewText(s: PostSection) {
    if (s.title) return s.title;
    if (s.body) return s.body.slice(0, 60) + (s.body.length > 60 ? '…' : '');
    if (s.type === 'photo') return s.imageUrl ? '📷 Photo' : 'Photo (no image yet)';
    return '—';
  }

  const typeBadgeClass = (type: string) =>
    TYPE_BADGE[type as PostSectionType] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Content Sections
        </h4>
        {!addingNew && (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[var(--radius)] border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Plus size={11} />
            Add section
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-[var(--radius)]" />)}
        </div>
      ) : sections.length === 0 && !addingNew ? (
        <p className="text-xs text-muted-foreground py-2">
          No sections yet. Add one to build this post with rich typed blocks.
        </p>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={section.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
              {editingId === section.id ? (
                <div className="p-3">
                  <PostSectionEditor
                    initial={section}
                    onSave={data => updateSection.mutate({ id: section.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateSection.isPending}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0 || reorder.isPending}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sections.length - 1 || reorder.isPending}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={11} />
                    </button>
                  </div>
                  <span className={cn(
                    'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm flex-shrink-0',
                    typeBadgeClass(section.type)
                  )}>
                    {section.type}
                  </span>
                  <p className="text-sm text-foreground truncate flex-1 min-w-0">
                    {previewText(section)}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingId(section.id)}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this section?')) deleteSection.mutate(section.id);
                      }}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addingNew && (
        <PostSectionEditor
          onSave={data => createSection.mutate(data)}
          onCancel={() => setAddingNew(false)}
          saving={createSection.isPending}
        />
      )}
    </div>
  );
}

// ── Post Editor ───────────────────────────────────────────────────────────────

function PostEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Post>;
  onSave: (data: Partial<Post>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    published: false,
    ...initial,
  });
  const [preview, setPreview] = useState(false);
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  function handleChange(field: keyof Post, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbProgress(0);
    setThumbError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const img = await xhrUpload<{ id: number }>(
        '/api/admin/gallery/upload',
        formData,
        {},
        pct => setThumbProgress(pct),
      );
      handleChange('imageUrl', `/api/gallery/images/${img.id}`);
      setThumbProgress(null);
    } catch (err) {
      setThumbError((err as Error).message || 'Upload failed');
      setThumbProgress(null);
    } finally {
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  }

  function toDateInput(d: Date | string | null | undefined): string {
    if (!d) return '';
    try { return new Date(d as string).toISOString().slice(0, 10); } catch { return ''; }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title ?? ''} onChange={e => handleChange('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={form.slug ?? ''} onChange={e => handleChange('slug', e.target.value)} placeholder="my-post" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Excerpt</Label>
        <Textarea value={form.excerpt ?? ''} onChange={e => handleChange('excerpt', e.target.value)} rows={2} />
      </div>

      {/* Thumbnail */}
      <div className="space-y-1.5">
        <Label>Thumbnail image</Label>
        <input type="file" accept="image/*" ref={thumbInputRef} className="hidden" onChange={handleThumbUpload} />
        <div className="flex gap-2 items-center">
          <Button type="button" variant="outline" size="sm" onClick={() => thumbInputRef.current?.click()}>
            <Upload size={13} className="mr-1.5" /> Upload
          </Button>
          <Input
            placeholder="or paste image URL…"
            value={form.imageUrl ?? ''}
            onChange={e => handleChange('imageUrl', e.target.value)}
            className="text-sm"
          />
        </div>
        {thumbProgress !== null && (
          <div className="h-1.5 rounded bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${thumbProgress}%` }} />
          </div>
        )}
        {thumbError && <p className="text-xs text-destructive">{thumbError}</p>}
        {form.imageUrl && (
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-muted mt-1 max-h-40">
            <img src={form.imageUrl} alt="" className="w-full object-cover max-h-40" />
            <button
              type="button"
              onClick={() => handleChange('imageUrl', '')}
              className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Article date + read time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Article date <span className="text-muted-foreground font-normal text-xs">(defaults to creation date)</span></Label>
          <Input
            type="date"
            value={toDateInput(form.publishedAt)}
            onChange={e => handleChange('publishedAt', e.target.value ? new Date(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Read time <span className="text-muted-foreground font-normal text-xs">(mins — auto if blank)</span></Label>
          <Input
            type="number"
            min={1}
            max={120}
            placeholder="auto"
            value={form.readTime ?? ''}
            onChange={e => handleChange('readTime', e.target.value ? parseInt(e.target.value, 10) : null)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <Label>Content (Markdown)</Label>
          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div className="prose max-w-none min-h-[200px] border border-border rounded-[var(--radius)] bg-muted/30 p-4">
            <ReactMarkdown>{form.content ?? ''}</ReactMarkdown>
          </div>
        ) : (
          <Textarea
            value={form.content ?? ''}
            onChange={e => handleChange('content', e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder="Write your post in Markdown…"
          />
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.published ?? false}
          onChange={e => handleChange('published', e.target.checked)}
          className="rounded"
        />
        Published
      </label>
      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(form)} size="sm">Save post</Button>
        <Button variant="outline" onClick={onCancel} size="sm">Cancel</Button>
      </div>
    </div>
  );
}

function BlogTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [sectionsPostId, setSectionsPostId] = useState<number | null>(null);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['admin', 'posts'],
    queryFn: () => apiRequest<Post[]>('GET', '/api/admin/posts'),
  });

  const createPost = useMutation({
    mutationFn: (data: Partial<Post>) =>
      apiRequest('POST', '/api/admin/posts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      setAddingNew(false);
      toast('success', 'Post created');
    },
    onError: (err: Error) => toast('error', 'Failed to create post', err.message),
  });

  const updatePost = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) =>
      apiRequest('PATCH', `/api/admin/posts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      setEditPost(null);
      toast('success', 'Post saved');
    },
    onError: (err: Error) => toast('error', 'Failed to save post', err.message),
  });

  const deletePost = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      toast('success', 'Post deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete post', err.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-syne font-bold text-xl text-foreground">Blog posts</h2>
        <Button size="sm" onClick={() => setAddingNew(true)}>
          <Plus size={14} />
          New post
        </Button>
      </div>

      {addingNew && (
        <div className="border border-border rounded-[var(--radius)] bg-card p-5 mb-5">
          <h3 className="font-syne font-bold text-lg text-foreground mb-4">New post</h3>
          <PostEditor
            onSave={data => createPost.mutate(data)}
            onCancel={() => setAddingNew(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-[var(--radius)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
              {editPost?.id === post.id ? (
                <div className="p-5">
                  <h3 className="font-syne font-bold text-lg text-foreground mb-4">Edit post</h3>
                  <PostEditor
                    initial={editPost}
                    onSave={data => updatePost.mutate({ id: post.id, data })}
                    onCancel={() => setEditPost(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{post.title}</p>
                        <Badge variant={post.published ? 'default' : 'muted'}>
                          {post.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt!)} · /{post.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      <button
                        onClick={() => setSectionsPostId(sectionsPostId === post.id ? null : post.id)}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center rounded-[var(--radius)] transition-colors',
                          sectionsPostId === post.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                        aria-label="Edit sections"
                        title="Content sections"
                      >
                        <Layers size={13} />
                      </button>
                      <button
                        onClick={() => { setEditPost(post); setSectionsPostId(null); }}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius)] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit post"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${post.title}"?`)) {
                            deletePost.mutate(post.id);
                          }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius)] hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {sectionsPostId === post.id && (
                    <PostSectionsPanel postId={post.id} />
                  )}
                </>
              )}
            </div>
          ))}
          {posts.length === 0 && !addingNew && (
            <p className="text-muted-foreground text-center py-12">No posts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('POST', '/api/admin/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError((err as Error).message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm">
      <h2 className="font-syne font-bold text-xl text-foreground mb-6">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle size={14} />
            Password updated successfully.
          </div>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}

// ── Agent (Knowledge Base) tab ────────────────────────────────────────────────

const KB_TYPES = ['general', 'deal', 'promotion', 'service'] as const;
type KBType = typeof KB_TYPES[number];

const TYPE_LABELS: Record<KBType, string> = {
  general: 'General',
  deal: 'Deal',
  promotion: 'Promotion',
  service: 'Service info',
};

const TYPE_COLOURS: Record<KBType, string> = {
  general: 'bg-muted text-muted-foreground',
  deal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  promotion: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  service: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function KBForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<KnowledgeBaseEntry>;
  onSave: (data: Partial<KnowledgeBaseEntry>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<KnowledgeBaseEntry>>({
    title: '',
    content: '',
    type: 'general',
    active: true,
    ...initial,
  });

  function set(field: keyof KnowledgeBaseEntry, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          value={form.title ?? ''}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Summer 2025 launch discount"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex gap-2 flex-wrap">
          {KB_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors cursor-pointer',
                form.type === t
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea
          value={form.content ?? ''}
          onChange={e => set('content', e.target.value)}
          rows={5}
          placeholder="Write exactly what the agent should know. Be specific — prices, dates, conditions, talking points."
        />
        <p className="text-xs text-muted-foreground">
          This text is injected verbatim into the agent's context. The more specific, the better.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active ?? true}
            onChange={e => set('active', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground">Active (visible to agent)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.title?.trim() || !form.content?.trim()}>
          Save entry
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AgentTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | null>(null);

  const { data: entries = [], isLoading } = useQuery<KnowledgeBaseEntry[]>({
    queryKey: ['admin', 'knowledge-base'],
    queryFn: () => apiRequest<KnowledgeBaseEntry[]>('GET', '/api/admin/knowledge-base'),
  });

  const create = useMutation({
    mutationFn: (data: Partial<KnowledgeBaseEntry>) =>
      apiRequest('POST', '/api/admin/knowledge-base', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'knowledge-base'] });
      setShowForm(false);
      toast('success', 'Knowledge entry added');
    },
    onError: (err: Error) => toast('error', 'Failed to add entry', err.message),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KnowledgeBaseEntry> }) =>
      apiRequest('PATCH', `/api/admin/knowledge-base/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'knowledge-base'] });
      setEditingEntry(null);
      toast('success', 'Entry updated');
    },
    onError: (err: Error) => toast('error', 'Failed to update entry', err.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/knowledge-base/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'knowledge-base'] });
      toast('success', 'Entry deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete entry', err.message),
  });

  const toggleActive = (entry: KnowledgeBaseEntry) =>
    update.mutate({ id: entry.id, data: { active: !entry.active } });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Description */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-4">
        <h3 className="font-medium text-sm text-foreground mb-1">How this works</h3>
        <p className="text-sm text-muted-foreground">
          Every active entry below is injected into the homepage chat agent's context on every conversation. Use it to share current deals, promotions, service details, or anything you want Zak's agent to know and reference when talking to leads.
        </p>
      </div>

      {/* Add button */}
      {!showForm && !editingEntry && (
        <Button onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Add entry
        </Button>
      )}

      {/* New entry form */}
      {showForm && (
        <div className="rounded-[var(--radius)] border border-primary/30 bg-card p-5">
          <h3 className="font-medium text-sm text-foreground mb-4">New knowledge base entry</h3>
          <KBForm
            onSave={data => create.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 && !showForm ? (
        <p className="text-muted-foreground text-center py-12 text-sm">
          No entries yet. Add your first deal, promotion, or service detail above.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div
              key={entry.id}
              className={cn(
                'rounded-[var(--radius)] border bg-card overflow-hidden transition-opacity',
                !entry.active && 'opacity-50',
                entry.active ? 'border-border' : 'border-dashed border-border'
              )}
            >
              {editingEntry?.id === entry.id ? (
                <div className="p-5">
                  <h3 className="font-medium text-sm text-foreground mb-4">Edit entry</h3>
                  <KBForm
                    initial={entry}
                    onSave={data => update.mutate({ id: entry.id, data })}
                    onCancel={() => setEditingEntry(null)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TYPE_COLOURS[entry.type as KBType] ?? TYPE_COLOURS.general)}>
                          {TYPE_LABELS[entry.type as KBType] ?? entry.type}
                        </span>
                        {!entry.active && (
                          <span className="text-xs text-muted-foreground italic">inactive</span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-foreground">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        title={entry.active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(entry)}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {entry.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => setEditingEntry(entry)}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${entry.title}"?`)) remove.mutate(entry.id);
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gallery tab ───────────────────────────────────────────────────────────────

function GalleryTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ['admin', 'gallery'],
    queryFn: () => apiRequest<GalleryImage[]>('GET', '/api/admin/gallery'),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['admin', 'projects'],
    queryFn: () => apiRequest<Project[]>('GET', '/api/admin/projects'),
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['admin', 'posts'],
    queryFn: () => apiRequest<Post[]>('GET', '/api/admin/posts'),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Upload failed');
      }
      await qc.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      toast('success', 'Image uploaded');
    } catch (err) {
      toast('error', 'Upload failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/gallery/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      toast('success', 'Image deleted');
    },
    onError: (err: Error) => toast('error', 'Failed to delete image', err.message),
  });

  async function assignToProject(imageId: number, projectId: string) {
    if (!projectId) return;
    setAssigningId(imageId);
    try {
      await apiRequest('PATCH', `/api/admin/projects/${projectId}`, { imageUrl: `/api/gallery/images/${imageId}` });
      await qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      toast('success', 'Assigned to project');
    } catch (err) {
      toast('error', 'Failed to assign to project', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssigningId(null);
    }
  }

  async function assignToPost(imageId: number, postId: string) {
    setAssigningId(imageId);
    try {
      if (postId) {
        await apiRequest('PATCH', `/api/admin/posts/${postId}`, { imageUrl: `/api/gallery/images/${imageId}` });
      }
      await qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      toast('success', 'Assigned to post');
    } catch (err) {
      toast('error', 'Failed to assign to post', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssigningId(null);
    }
  }

  function currentProjectId(imageId: number): string {
    const url = `/api/gallery/images/${imageId}`;
    return String(projects.find(p => p.imageUrl === url)?.id ?? '');
  }

  function currentPostId(imageId: number): string {
    const url = `/api/gallery/images/${imageId}`;
    return String((posts as Array<Post & { imageUrl?: string | null }>).find(p => p.imageUrl === url)?.id ?? '');
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Image library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload photos and assign them to Work projects or Blog posts.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
          >
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload image'}
          </Button>
        </div>
      </div>

      {/* Image grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-[var(--radius)]" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className="border-2 border-dashed border-border rounded-[var(--radius)] py-20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={36} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No images yet — click to upload your first photo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map(img => (
            <div key={img.id} className="border border-border rounded-[var(--radius)] overflow-hidden bg-card group flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
                <img
                  src={`/api/gallery/images/${img.id}`}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    if (window.confirm('Delete this image? This cannot be undone.')) {
                      deleteMutation.mutate(img.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                  title="Delete image"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Filename + assign controls */}
              <div className="p-3 space-y-3 flex-1">
                <p className="text-[11px] text-muted-foreground truncate" title={img.filename}>
                  {img.filename}
                </p>

                {/* Assign to Work project */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Briefcase size={10} />
                    My Work
                  </label>
                  <select
                    className="w-full text-[11px] rounded-[var(--radius)] border border-border bg-background text-foreground px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    value={currentProjectId(img.id)}
                    disabled={assigningId === img.id}
                    onChange={e => assignToProject(img.id, e.target.value)}
                  >
                    <option value="">— not assigned —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Assign to Blog post */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <BookOpen size={10} />
                    Blog
                  </label>
                  <select
                    className="w-full text-[11px] rounded-[var(--radius)] border border-border bg-background text-foreground px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    value={currentPostId(img.id)}
                    disabled={assigningId === img.id}
                    onChange={e => assignToPost(img.id, e.target.value)}
                  >
                    <option value="">— not assigned —</option>
                    {posts.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin shell ──────────────────────────────────────────────────────────

export default function Admin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    apiRequest('GET', '/api/auth/me')
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogout() {
    await apiRequest('POST', '/api/auth/logout');
    setAuthenticated(false);
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground">
              SSM-LTD
            </span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="font-mono text-xs text-primary">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Tabs defaultValue="enquiries">
          <TabsList>
            <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="enquiries">
            <EnquiriesTab />
          </TabsContent>
          <TabsContent value="portfolio">
            <PortfolioTab />
          </TabsContent>
          <TabsContent value="blog">
            <BlogTab />
          </TabsContent>
          <TabsContent value="gallery">
            <GalleryTab />
          </TabsContent>
          <TabsContent value="agent">
            <AgentTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </ToastProvider>
  );
}
