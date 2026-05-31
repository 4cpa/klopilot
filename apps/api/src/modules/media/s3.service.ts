import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow('S3_BUCKET');
    this.publicUrl = this.config.getOrThrow('S3_PUBLIC_URL');
    this.client = new S3Client({
      endpoint: this.config.getOrThrow('S3_ENDPOINT'),
      region: this.config.get('S3_REGION') ?? 'us-east-1',
      forcePathStyle: true, // MinIO benötigt path-style
      credentials: {
        accessKeyId: this.config.getOrThrow('S3_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow('S3_SECRET_KEY'),
      },
    });
  }

  async onModuleInit() {
    // Bucket sicherstellen, aber Boot nicht am Object-Storage scheitern lassen
    // (wie Meili/Redis). Ist S3 nicht erreichbar, schlagen erst spätere Uploads
    // fehl — die API serviert Reads/Suche/Karte trotzdem (z. B. CI/E2E).
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (e) {
        this.logger.warn(
          `Object-Storage beim Start nicht erreichbar — Uploads deaktiviert: ${(e as Error).message}`,
        );
      }
    }
  }

  async put(key: string, body: Buffer, contentType = 'image/webp'): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
