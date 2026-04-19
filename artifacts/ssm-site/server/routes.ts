import type { Express } from 'express';
import multer from 'multer';
import { requireAdmin } from './auth';
import { handleChat } from './chat';
import { sendEnquiryNotification, sendEnquiryConfirmation } from './email';
import {
  createInquiry,
  getAllInquiries,
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
} from './storage';
import { uploadToGCS, streamGalleryImage, deleteFromGCS } from './imageStorage';
import { insertInquirySchema } from '../shared/schema';
import bcrypt from 'bcryptjs';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
      const updated = await updateProject(id, req.body);
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

  app.post('/api/admin/posts', requireAdmin, async (req, res) => {
    try {
      const post = await createPost(req.body);
      res.status(201).json(post);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.patch('/api/admin/posts/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updatePost(id, req.body);
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
}
