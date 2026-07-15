import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private _client?: S3Client;

  constructor(private config: ConfigService) {}

  private get client(): S3Client {
    if (!this._client) {
      this._client = new S3Client({
        region: this.config.get<string>('aws.region'),
        credentials: {
          accessKeyId: this.config.get<string>('aws.accessKeyId')!,
          secretAccessKey: this.config.get<string>('aws.secretAccessKey')!,
        },
      });
    }
    return this._client;
  }

  private get bucket(): string {
    return this.config.get<string>('aws.s3Bucket')!;
  }

  async uploadFile(key: string, body: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
