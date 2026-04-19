import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  LogOut, Plus, Trash2, Edit2, Eye, EyeOff,
  ChevronDown, ChevronUp, CheckCircle, Copy, Link2, BookOpen, Briefcase
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
import type { Inquiry, Project, Post, KnowledgeBaseEntry } from '@shared/schema';

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
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
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
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ['admin', 'inquiries'],
    queryFn: () => apiRequest<Inquiry[]>('GET', '/api/admin/inquiries'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/admin/inquiries/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] }),
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
            onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Portfolio tab ─────────────────────────────────────────────────────────────

function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Project>>({
    title: '',
    slug: '',
    client: '',
    description: '',
    longDescription: '',
    tags: [],
    imageUrl: '',
    liveUrl: '',
    featured: false,
    order: 0,
    ...initial,
  });
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));

  function handleChange(field: keyof Project, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    onSave({ ...form, tags });
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
      <div className="space-y-1.5">
        <Label>Client</Label>
        <Input value={form.client ?? ''} onChange={e => handleChange('client', e.target.value)} />
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
          <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Web Dev, React, Security" />
        </div>
        <div className="space-y-1.5">
          <Label>Order</Label>
          <Input type="number" value={form.order ?? 0} onChange={e => handleChange('order', parseInt(e.target.value, 10))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Image URL</Label>
          <Input value={form.imageUrl ?? ''} onChange={e => handleChange('imageUrl', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Live URL</Label>
          <Input value={form.liveUrl ?? ''} onChange={e => handleChange('liveUrl', e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.featured ?? false}
          onChange={e => handleChange('featured', e.target.checked)}
          className="rounded"
        />
        Featured project
      </label>
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} size="sm">Save project</Button>
        <Button variant="outline" onClick={onCancel} size="sm">Cancel</Button>
      </div>
    </div>
  );
}

function PortfolioTab() {
  const qc = useQueryClient();
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['admin', 'projects'],
    queryFn: () => apiRequest<Project[]>('GET', '/api/admin/projects'),
  });

  const createProject = useMutation({
    mutationFn: (data: Partial<Project>) =>
      apiRequest('POST', '/api/admin/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      setAddingNew(false);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      apiRequest('PATCH', `/api/admin/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'projects'] });
      setEditProject(null);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'projects'] }),
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
          {projects.map(project => (
            <div key={project.id} className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
              {editProject?.id === project.id ? (
                <div className="p-5">
                  <h3 className="font-syne font-bold text-lg text-foreground mb-4">Edit project</h3>
                  <ProjectForm
                    initial={editProject}
                    onSave={data => updateProject.mutate({ id: project.id, data })}
                    onCancel={() => setEditProject(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{project.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {project.client ?? 'No client'} · /{project.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
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
    published: false,
    ...initial,
  });
  const [preview, setPreview] = useState(false);

  function handleChange(field: keyof Post, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
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
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [addingNew, setAddingNew] = useState(false);

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
    },
  });

  const updatePost = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) =>
      apiRequest('PATCH', `/api/admin/posts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      setEditPost(null);
    },
  });

  const deletePost = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'posts'] }),
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
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => setEditPost(post)}
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
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KnowledgeBaseEntry> }) =>
      apiRequest('PATCH', `/api/admin/knowledge-base/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'knowledge-base'] });
      setEditingEntry(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/knowledge-base/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'knowledge-base'] }),
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

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'group relative flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium',
        'border transition-all duration-200 cursor-pointer select-none overflow-hidden',
        copied
          ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-600'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent'
      )}
      title={url}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.5, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle size={12} />
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
          >
            <Copy size={12} />
            Copy link
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function GalleryTab() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['admin', 'projects'],
    queryFn: () => apiRequest<Project[]>('GET', '/api/admin/projects'),
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ['admin', 'posts'],
    queryFn: () => apiRequest<Post[]>('GET', '/api/admin/posts'),
  });

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const isLoading = loadingProjects || loadingPosts;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  const Section = ({
    title,
    icon: Icon,
    items,
    type,
  }: {
    title: string;
    icon: React.ElementType;
    items: Array<{ id: number; title: string; slug: string; tags?: string[] | null; featured?: boolean | null; published?: boolean | null }>;
    type: 'portfolio' | 'blog';
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-muted-foreground" />
        <h3 className="font-medium text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-[var(--radius)]">
          No {type === 'portfolio' ? 'portfolio projects' : 'blog posts'} yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const path = type === 'portfolio' ? `/work/${item.slug}` : `/blog/${item.slug}`;
            const fullUrl = `${base}${path}`;
            const isLive = type === 'portfolio' ? true : item.published;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius)] border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </span>
                      {type === 'blog' && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          isLive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {isLive ? 'published' : 'draft'}
                        </span>
                      )}
                      {type === 'portfolio' && item.featured && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Link2 size={10} className="text-muted-foreground/50 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate font-mono">
                        {path}
                      </span>
                    </div>
                  </div>
                </div>

                <CopyLinkButton url={fullUrl} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-6 space-y-8">
      <Section
        title="Portfolio"
        icon={Briefcase}
        items={projects}
        type="portfolio"
      />
      <Section
        title="Blog posts"
        icon={BookOpen}
        items={posts}
        type="blog"
      />
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
  );
}
