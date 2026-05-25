import { Injectable, OnModuleInit } from '@nestjs/common';
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
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
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
