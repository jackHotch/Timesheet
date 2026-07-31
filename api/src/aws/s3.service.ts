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
      const accessKeyId = this.config.get<string>('aws.accessKeyId');
      const secretAccessKey = this.config.get<string>('aws.secretAccessKey');
      this._client = new S3Client({
        region: this.config.get<string>('aws.region'),
        // Only pass explicit credentials when static keys are configured (local dev);
        // otherwise fall back to the SDK's default provider chain, which picks up the
        // EC2 instance profile role in production.
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
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

  async getSignedDownloadUrl(
    key: string,
    responseContentDisposition?: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: responseContentDisposition,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
