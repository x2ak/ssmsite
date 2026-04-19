import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import type { Response } from 'express';

const SIDECAR = 'http://127.0.0.1:1106';

export const gcsClient = new Storage({
  credentials: {
    type: 'external_account',
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${SIDECAR}/token`,
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  } as Parameters<typeof Storage>[0]['credentials'],
  projectId: '',
});

function getBucket() {
  const id = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!id) throw new Error('DEFAULT_OBJECT_STORAGE_BUCKET_ID not configured');
  return gcsClient.bucket(id);
}

export async function uploadToGCS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
  const objectName = `gallery/${randomUUID()}.${ext}`;
  const file = getBucket().file(objectName);
  await file.save(buffer, { contentType, resumable: false });
  return objectName;
}

export async function streamGalleryImage(objectName: string, res: Response): Promise<void> {
  const file = getBucket().file(objectName);
  const [metadata] = await file.getMetadata();
  res.setHeader('Content-Type', (metadata.contentType as string) || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  file.createReadStream().pipe(res as unknown as NodeJS.WritableStream);
}

export async function deleteFromGCS(objectName: string): Promise<void> {
  const file = getBucket().file(objectName);
  await file.delete({ ignoreNotFound: true });
}
