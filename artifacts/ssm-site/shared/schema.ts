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
  description: text('description').notNull(),
  longDescription: text('long_description'),
  tags: text('tags').array(),
  imageUrl: text('image_url'),
  liveUrl: text('live_url'),
  featured: boolean('featured').default(false),
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
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

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
