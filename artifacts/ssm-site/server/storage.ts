import { db } from './db';
import { inquiries, projects, posts, adminUsers, knowledgeBase } from '../shared/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { InsertInquiry, InsertProject, InsertPost, Inquiry, Project, Post, KnowledgeBaseEntry, InsertKnowledgeBaseEntry } from '../shared/schema';

// ── Enquiries ─────────────────────────────────────────────────────────────────

export async function createInquiry(data: InsertInquiry): Promise<Inquiry> {
  const [inquiry] = await db.insert(inquiries).values(data).returning();
  return inquiry;
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export async function getInquiryById(id: number): Promise<Inquiry | undefined> {
  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  return inquiry;
}

export async function updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
  const [inquiry] = await db
    .update(inquiries)
    .set({ status })
    .where(eq(inquiries.id, id))
    .returning();
  return inquiry;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.order));
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  return project;
}

export async function createProject(data: InsertProject): Promise<Project> {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
}

export async function updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
  const [project] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  return project;
}

export async function deleteProject(id: number): Promise<void> {
  await db.delete(projects).where(eq(projects.id, id));
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getAllPosts(publishedOnly = false): Promise<Post[]> {
  if (publishedOnly) {
    return db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt));
  }
  return db.select().from(posts).orderBy(desc(posts.createdAt));
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  return post;
}

export async function createPost(data: InsertPost): Promise<Post> {
  const [post] = await db.insert(posts).values(data).returning();
  return post;
}

export async function updatePost(id: number, data: Partial<InsertPost>): Promise<Post> {
  const [post] = await db
    .update(posts)
    .set(data)
    .where(eq(posts.id, id))
    .returning();
  return post;
}

export async function deletePost(id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
}

// ── Knowledge base ────────────────────────────────────────────────────────────

export async function getAllKnowledgeBase(activeOnly = false): Promise<KnowledgeBaseEntry[]> {
  if (activeOnly) {
    return db.select().from(knowledgeBase).where(eq(knowledgeBase.active, true)).orderBy(asc(knowledgeBase.createdAt));
  }
  return db.select().from(knowledgeBase).orderBy(asc(knowledgeBase.createdAt));
}

export async function createKnowledgeBaseEntry(data: InsertKnowledgeBaseEntry): Promise<KnowledgeBaseEntry> {
  const [entry] = await db.insert(knowledgeBase).values(data).returning();
  return entry;
}

export async function updateKnowledgeBaseEntry(id: number, data: Partial<InsertKnowledgeBaseEntry>): Promise<KnowledgeBaseEntry> {
  const [entry] = await db.update(knowledgeBase).set(data).where(eq(knowledgeBase.id, id)).returning();
  return entry;
}

export async function deleteKnowledgeBaseEntry(id: number): Promise<void> {
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
}

// ── Admin users ───────────────────────────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  return user;
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
}
