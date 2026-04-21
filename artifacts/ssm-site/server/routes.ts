import type { Express } from 'express';
import multer from 'multer';
import { requireAdmin } from './auth';
import { handleChat } from './chat';
import { sendEnquiryNotification, sendEnquiryConfirmation, sendEnquiryReply } from './email';
import {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getAllProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getAllKnowledgeBase,
  createKnowledgeBaseEntry,
  updateKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  getAdminByUsername,
  updateAdminPassword,
  getAllGalleryImages,
  getGalleryImageById,
  createGalleryImage,
  deleteGalleryImageRecord,
  getSectionsByProjectId,
  createProjectSection,
  updateProjectSection,
  deleteProjectSection,
  getSectionsByPostId,
  createPostSection,
  updatePostSection,
  deletePostSection,
  reorderPostSections,
  createErrorLog,
  getAllErrorLogs,
  deleteErrorLogById,
  clearErrorLogs,
} from './storage';
import { uploadToGCS, streamGalleryImage, deleteFromGCS } from './imageStorage';
import { insertInquirySchema } from '../shared/schema';
import bcrypt from 'bcryptjs';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const gifUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function registerRoutes(app: Express) {

  // ── Health ────────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── AI Chat ───────────────────────────────────────────────────────────────

  app.post('/api/chat', handleChat);

  // ── Enquiries (public) ────────────────────────────────────────────────────

  app.post('/api/inquiries', async (req, res) => {
    try {
      const result = insertInquirySchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
      }

      const inquiry = await createInquiry(result.data);

      // Send emails — fire and forget, do not fail the request if email fails
      Promise.all([
        sendEnquiryNotification(inquiry),
        sendEnquiryConfirmation(inquiry),
      ]).catch(err => console.error('Email send error:', err));

      res.status(201).json({ success: true, id: inquiry.id });
    } catch (err) {
      console.error('Inquiry creation error:', err);
      res.status(500).json({ error: 'Failed to save enquiry' });
    }
  });

  // ── Projects (public) ─────────────────────────────────────────────────────

  app.get('/api/projects', async (_req, res) => {
    try {
      const allProjects = await getAllProjects();
      res.json(allProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:slug', async (req, res) => {
    try {
      const project = await getProjectBySlug(req.params.slug);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (err) {
      console.error('Error fetching project:', err);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  app.get('/api/projects/:slug/sections', async (req, res) => {
    try {
      const project = await getProjectBySlug(req.params.slug);
      if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
      const sections = await getSectionsByProjectId(project.id);
      res.json(sections);
    } catch (err) {
      console.error('Error fetching sections:', err);
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  // ── Posts (public) ────────────────────────────────────────────────────────

  app.get('/api/posts', async (_req, res) => {
    try {
      const allPosts = await getAllPosts(true); // published only
      res.json(allPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.get('/api/posts/:slug', async (req, res) => {
    try {
      const post = await getPostBySlug(req.params.slug);
      if (!post || !post.published) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      res.json(post);
    } catch (err) {
      console.error('Error fetching post:', err);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  });

  // ── Admin — Enquiries ─────────────────────────────────────────────────────

  app.get('/api/admin/inquiries', requireAdmin, async (_req, res) => {
    try {
      const all = await getAllInquiries();
      res.json(all);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      res.status(500).json({ error: 'Failed to fetch enquiries' });
    }
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body as { status: string };
      const updated = await updateInquiryStatus(id, status);
      res.json(updated);
    } catch (err) {
      console.error('Error updating inquiry:', err);
      res.status(500).json({ error: 'Failed to update enquiry' });
    }
  });

  app.delete('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteInquiry(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      res.status(500).json({ error: 'Failed to delete enquiry' });
    }
  });

  app.post('/api/admin/inquiries/:id/reply', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { body } = req.body as { body: string };
      if (!body?.trim()) {
        res.status(400).json({ error: 'Reply body is required' });
        return;
      }
      const inquiry = await getInquiryById(id);
      if (!inquiry) {
        res.status(404).json({ error: 'Enquiry not found' });
        return;
      }
      await sendEnquiryReply(inquiry, body.trim());
      await updateInquiryStatus(id, 'replied');
      res.json({ success: true });
    } catch (err) {
      console.error('Error sending reply:', err);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  });

  // ── Admin — Projects ──────────────────────────────────────────────────────

  app.get('/api/admin/projects', requireAdmin, async (_req, res) => {
    try {
      const all = await getAllProjects();
      res.json(all);
    } catch (err) {
      console.error('Error fetching admin projects:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Upload a preview GIF for a project thumbnail.
  // Uses base64 JSON body (not multipart) to avoid proxy connection drops on Replit/Railway.
  // Registered BEFORE /:id routes to avoid Express matching "upload-preview-video" as an id param.
  app.post('/api/admin/projects/upload-preview-video', requireAdmin, async (req, res) => {
    try {
      const { filename, data } = req.body as { filename?: string; data?: string };
      if (!data || !filename) {
        res.status(400).json({ error: 'Missing filename or file data.' }); return;
      }
      const match = data.match(/^data:(image\/gif);base64,(.+)$/s);
      if (!match) {
        res.status(400).json({ error: 'Only GIF files are accepted.' }); return;
      }
      const contentType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
        res.status(413).json({ error: 'GIF is too large — maximum is 10 MB.' }); return;
      }
      const objectName = await uploadToGCS(buffer, filename, contentType);
      const record = await createGalleryImage({ filename, objectName, contentType, label: 'preview-gif' });
      res.status(201).json({ id: record.id, url: `/api/gallery/images/${record.id}` });
    } catch (err: unknown) {
      console.error('Error uploading preview GIF:', err);
      res.status(500).json({ error: 'GIF upload failed — please try again.' });
    }
  });

  app.post('/api/admin/projects', requireAdmin, async (req, res) => {
    try {
      const project = await createProject(req.body);
      res.status(201).json(project);
    } catch (err) {
      console.error('Error creating project:', err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.patch('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      // Strip read-only/auto fields so Drizzle never tries to cast them
      const { id: _id, createdAt: _ca, ...data } = req.body as Record<string, unknown>;
      const updated = await updateProject(id, data);
      res.json(updated);
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteProject(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting project:', err);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // ── Admin — Project Sections ──────────────────────────────────────────────

  app.get('/api/admin/projects/:id/sections', requireAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id, 10);
      const sections = await getSectionsByProjectId(projectId);
      res.json(sections);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  app.post('/api/admin/projects/:id/sections', requireAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id, 10);
      const { title, body, imageUrls, displayOrder } = req.body as {
        title: string; body?: string; imageUrls?: string[]; displayOrder?: number;
      };
      const section = await createProjectSection({ projectId, title, body: body ?? '', imageUrls: imageUrls ?? [], displayOrder: displayOrder ?? 0 });
      res.status(201).json(section);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create section' });
    }
  });

  app.patch('/api/admin/projects/:id/sections/:sid', requireAdmin, async (req, res) => {
    try {
      const sid = parseInt(req.params.sid, 10);
      const section = await updateProjectSection(sid, req.body);
      res.json(section);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update section' });
    }
  });

  app.delete('/api/admin/projects/:id/sections/:sid', requireAdmin, async (req, res) => {
    try {
      const sid = parseInt(req.params.sid, 10);
      await deleteProjectSection(sid);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete section' });
    }
  });

  // ── Post sections (public) ────────────────────────────────────────────────

  app.get('/api/posts/:slug/sections', async (req, res) => {
    try {
      const post = await getPostBySlug(req.params.slug);
      if (!post || !post.published) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      const sections = await getSectionsByPostId(post.id);
      res.json(sections);
    } catch (err) {
      console.error('Error fetching post sections:', err);
      res.status(500).json({ error: 'Failed to fetch post sections' });
    }
  });

  // ── Admin — Post Sections ─────────────────────────────────────────────────

  app.get('/api/admin/posts/:id/sections', requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      const sections = await getSectionsByPostId(postId);
      res.json(sections);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch post sections' });
    }
  });

  app.post('/api/admin/posts/:id/sections', requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      const { type, title, body, imageUrl, caption, variant, items, displayOrder } = req.body as {
        type?: string; title?: string; body?: string; imageUrl?: string;
        caption?: string; variant?: string; items?: string; displayOrder?: number;
      };
      const section = await createPostSection({
        postId,
        type: type ?? 'text',
        title: title ?? null,
        body: body ?? null,
        imageUrl: imageUrl ?? null,
        caption: caption ?? null,
        variant: variant ?? null,
        items: items ?? null,
        displayOrder: displayOrder ?? 0,
      });
      res.status(201).json(section);
    } catch (err) {
      console.error('Error creating post section:', err);
      res.status(500).json({ error: 'Failed to create post section' });
    }
  });

  app.patch('/api/admin/post-sections/:sectionId', requireAdmin, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId, 10);
      const { id: _id, createdAt: _ca, postId: _pid, ...data } = req.body as Record<string, unknown>;
      const section = await updatePostSection(sectionId, data as Parameters<typeof updatePostSection>[1]);
      res.json(section);
    } catch (err) {
      console.error('Error updating post section:', err);
      res.status(500).json({ error: 'Failed to update post section' });
    }
  });

  app.delete('/api/admin/post-sections/:sectionId', requireAdmin, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId, 10);
      await deletePostSection(sectionId);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting post section:', err);
      res.status(500).json({ error: 'Failed to delete post section' });
    }
  });

  app.post('/api/admin/post-sections/reorder', requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!Array.isArray(ids)) { res.status(400).json({ error: 'ids must be an array' }); return; }
      await reorderPostSections(ids);
      res.json({ success: true });
    } catch (err) {
      console.error('Error reordering post sections:', err);
      res.status(500).json({ error: 'Failed to reorder post sections' });
    }
  });

  // ── Admin — Posts ─────────────────────────────────────────────────────────

  app.get('/api/admin/posts', requireAdmin, async (_req, res) => {
    try {
      const all = await getAllPosts(false);
      res.json(all);
    } catch (err) {
      console.error('Error fetching admin posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  function coercePostDates(data: Record<string, unknown>): Record<string, unknown> {
    const result = { ...data };
    if (typeof result.publishedAt === 'string') {
      result.publishedAt = result.publishedAt ? new Date(result.publishedAt) : null;
    }
    return result;
  }

  app.post('/api/admin/posts', requireAdmin, async (req, res) => {
    try {
      const post = await createPost(coercePostDates(req.body) as Parameters<typeof createPost>[0]);
      res.status(201).json(post);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.patch('/api/admin/posts/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { id: _id, createdAt: _ca, ...raw } = req.body as Record<string, unknown>;
      const data = coercePostDates(raw);
      const updated = await updatePost(id, data);
      res.json(updated);
    } catch (err) {
      console.error('Error updating post:', err);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  app.delete('/api/admin/posts/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deletePost(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  // ── Admin — Knowledge base ────────────────────────────────────────────────

  app.get('/api/admin/knowledge-base', requireAdmin, async (_req, res) => {
    try {
      const all = await getAllKnowledgeBase(false);
      res.json(all);
    } catch (err) {
      console.error('Error fetching knowledge base:', err);
      res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
  });

  app.post('/api/admin/knowledge-base', requireAdmin, async (req, res) => {
    try {
      const entry = await createKnowledgeBaseEntry(req.body);
      res.status(201).json(entry);
    } catch (err) {
      console.error('Error creating KB entry:', err);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  });

  app.patch('/api/admin/knowledge-base/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateKnowledgeBaseEntry(id, req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error updating KB entry:', err);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  });

  app.delete('/api/admin/knowledge-base/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteKnowledgeBaseEntry(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting KB entry:', err);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  });

  // ── Admin — Settings ──────────────────────────────────────────────────────

  app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      if (!req.session.adminId) {
        res.status(401).json({ error: 'Unauthorised' });
        return;
      }

      // Fetch admin user to verify current password
      // We need to find by ID — for now get all and find
      // (single admin user system)
      const adminId = req.session.adminId;

      // Simple approach: get admin by username via a different method
      // We'll add a getAdminById function inline here
      const { db } = await import('./db');
      const { adminUsers } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminId));

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      const hash = await bcrypt.hash(newPassword, 12);
      await updateAdminPassword(adminId, hash);

      res.json({ success: true });
    } catch (err) {
      console.error('Error changing password:', err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // ── Gallery (public image serving) ───────────────────────────────────────

  app.get('/api/gallery/images/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
      const img = await getGalleryImageById(id);
      if (!img) { res.status(404).end(); return; }
      await streamGalleryImage(img.objectName, res);
    } catch (err) {
      console.error('Error serving gallery image:', err);
      if (!res.headersSent) res.status(500).end();
    }
  });

  // ── Gallery admin ─────────────────────────────────────────────────────────

  app.get('/api/admin/gallery', requireAdmin, async (_req, res) => {
    try {
      const images = await getAllGalleryImages();
      res.json(images);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      res.status(500).json({ error: 'Failed to fetch gallery' });
    }
  });

  app.post('/api/admin/gallery/upload', requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) { res.status(400).json({ error: 'No file provided' }); return; }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowed.includes(file.mimetype)) {
        res.status(400).json({ error: 'Only image files are allowed' }); return;
      }
      const objectName = await uploadToGCS(file.buffer, file.originalname, file.mimetype);
      const label = (req.body?.label as string | undefined) || '';
      const img = await createGalleryImage({
        filename: file.originalname,
        objectName,
        contentType: file.mimetype,
        label: label || null,
      });
      res.status(201).json(img);
    } catch (err) {
      console.error('Error uploading image:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
      const img = await deleteGalleryImageRecord(id);
      if (!img) { res.status(404).json({ error: 'Image not found' }); return; }
      await deleteFromGCS(img.objectName);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting gallery image:', err);
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  // ── Error Logs ──────────────────────────────────────────────────────────────

  // Public endpoint — logs errors from both the public site and admin portal.
  // Basic guards: body must have a message string, type must be user|admin.
  app.post('/api/log-error', async (req, res) => {
    try {
      const { type, message, detail, path, userAgent } = req.body || {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'message is required' });
        return;
      }
      const logType = type === 'admin' ? 'admin' : 'user';
      await createErrorLog({
        type: logType,
        message: String(message).slice(0, 1000),
        detail: detail ? String(detail).slice(0, 3000) : undefined,
        path: path ? String(path).slice(0, 500) : undefined,
        userAgent: userAgent ? String(userAgent).slice(0, 300) : undefined,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Error creating error log:', err);
      res.status(500).json({ error: 'Failed to log error' });
    }
  });

  app.get('/api/admin/error-logs', requireAdmin, async (req, res) => {
    try {
      const type = req.query.type as 'user' | 'admin' | undefined;
      const logs = await getAllErrorLogs(type);
      res.json(logs);
    } catch (err) {
      console.error('Error fetching error logs:', err);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.delete('/api/admin/error-logs/entry/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
      await deleteErrorLogById(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting error log entry:', err);
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  app.delete('/api/admin/error-logs', requireAdmin, async (req, res) => {
    try {
      const type = req.query.type as 'user' | 'admin' | undefined;
      await clearErrorLogs(type);
      res.json({ success: true });
    } catch (err) {
      console.error('Error clearing error logs:', err);
      res.status(500).json({ error: 'Clear failed' });
    }
  });
}
