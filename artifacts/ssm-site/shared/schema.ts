import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enquiries — contact form and AI chat leads
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message').notNull(),
  source: text('source').notNull().default('form'), // 'form' | 'chat'
  status: text('status').notNull().default('new'),  // 'new' | 'read' | 'replied'
  chatTranscript: text('chat_transcript'),           // JSON stringified messages for chat leads
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects — portfolio items
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  client: text('client'),
  year: integer('year'),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  tags: text('tags').array(),
  services: text('services').array().default([]),
  imageUrl: text('image_url'),
  imageUrls: text('image_urls').array().default([]),
  liveUrl: text('live_url'),
  featured: boolean('featured').default(false),
  caseStudy: boolean('case_study').default(false),
  previewVideoUrl: text('preview_video_url'),
  testimonial: text('testimonial'),
  testimonialAuthor: text('testimonial_author'),
  testimonialImageUrl: text('testimonial_image_url'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Posts — blog / case studies
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  published: boolean('published').default(false),
  publishedAt: timestamp('published_at'),
  readTime: integer('read_time'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gallery — uploaded images for use in projects and posts
export const galleryImages = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  objectName: text('object_name').notNull(),
  contentType: text('content_type').notNull().default('image/jpeg'),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Knowledge base — agent context injected into chat system prompt
export const knowledgeBase = pgTable('knowledge_base', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull().default('general'), // 'deal' | 'promotion' | 'service' | 'general'
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Admin users — single row
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

// Project sections — rich content blocks within a project detail page
export const projectSections = pgTable('project_sections', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  imageUrls: text('image_urls').array().default([]),
  layout: text('layout').notNull().default('text-above'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Post sections — typed content blocks for rich blog post composition
// type: 'text' | 'photo' | 'callout' | 'alert' | 'card' | 'timeline' | 'checklist' | 'cta'
export const postSections = pgTable('post_sections', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  type: text('type').notNull().default('text'),
  title: text('title'),
  body: text('body'),
  imageUrl: text('image_url'),
  caption: text('caption'),
  variant: text('variant'),
  items: text('items'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Error logs — captured from public site (user) and admin portal (admin)
export const errorLogs = pgTable('error_logs', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('user'),   // 'user' | 'admin'
  message: text('message').notNull(),
  detail: text('detail'),
  path: text('path'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});
export type ErrorLog = typeof errorLogs.$inferSelect;

// CRM — Clients
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  companyName: text('company_name').notNull(),
  primaryContactName: text('primary_contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  serviceType: text('service_type').notNull().default('General'),
  status: text('status').notNull().default('active'),
  contractStart: timestamp('contract_start'),
  contractEnd: timestamp('contract_end'),
  profilePhotoUrl: text('profile_photo_url'),
  invoiceStatus: text('invoice_status').notNull().default('paid'),
  notes: text('notes'),
  fromInquiryId: integer('from_inquiry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientContactHistory = pgTable('client_contact_history', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientTasks = pgTable('client_tasks', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id'),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(3),
  status: text('status').notNull().default('open'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientInvoices = pgTable('client_invoices', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull(),
  amount: text('amount').notNull(),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('outstanding'),
  invoiceDate: timestamp('invoice_date').defaultNow(),
  dueDate: timestamp('due_date'),
  fileObjectName: text('file_object_name'),
  fileFilename: text('file_filename'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientFiles = pgTable('client_files', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull(),
  filename: text('filename').notNull(),
  objectName: text('object_name').notNull(),
  contentType: text('content_type').notNull().default('application/pdf'),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type ClientContactHistory = typeof clientContactHistory.$inferSelect;
export type InsertClientContactHistory = typeof clientContactHistory.$inferInsert;
export type ClientTask = typeof clientTasks.$inferSelect;
export type InsertClientTask = typeof clientTasks.$inferInsert;
export type ClientInvoice = typeof clientInvoices.$inferSelect;
export type InsertClientInvoice = typeof clientInvoices.$inferInsert;
export type ClientFile = typeof clientFiles.$inferSelect;
export type InsertClientFile = typeof clientFiles.$inferInsert;

// Zod schemas
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase);
export const selectKnowledgeBaseSchema = createSelectSchema(knowledgeBase);
export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseEntry = typeof knowledgeBase.$inferInsert;

export const insertInquirySchema = createInsertSchema(inquiries, {
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const insertProjectSchema = createInsertSchema(projects);
export const insertPostSchema = createInsertSchema(posts);

export const selectInquirySchema = createSelectSchema(inquiries);
export const selectProjectSchema = createSelectSchema(projects);
export const selectPostSchema = createSelectSchema(posts);

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = typeof galleryImages.$inferInsert;
export type ProjectSection = typeof projectSections.$inferSelect;
export type InsertProjectSection = typeof projectSections.$inferInsert;
export type PostSection = typeof postSections.$inferSelect;
export type InsertPostSection = typeof postSections.$inferInsert;
