import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Worker, Job } from 'bullmq';
import { FileService } from './file.service';
import { File } from './entities/file.entity';
import { Job as JobEntity } from './entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class FileProcessorService implements OnModuleInit {
  private readonly MAX_RETRIES = 3;
  private worker: Worker;

  constructor(
    @InjectQueue('file-processing') private fileQueue: Queue,
    private fileService: FileService,
    @InjectRepository(JobEntity)
    private jobRepository: Repository<JobEntity>,
  ) {}

  async onModuleInit() {
    this.worker = new Worker(
      'file-processing',
      async (job: Job) => {
        const fileId = job.data.fileId;
        const file = await this.fileService.getFileByIdForProcessing(fileId);

        if (!file) {
          throw new Error(`File ${fileId} not found`);
        }

        // Create job record
        const jobRecord = this.jobRepository.create({
          file: { id: fileId },
          job_type: 'file-processing',
          status: 'processing',
          started_at: new Date(),
        });
        await this.jobRepository.save(jobRecord);

        try {
          // Update file status to processing
          await this.fileService.updateStatus(fileId, 'processing');

          // Simulate file processing
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Calculate file hash
          const fileHash = await this.calculateFileHash(file.storage_path);

          // Update file with processing results
          await this.fileService.updateProcessing(fileId, {
            status: 'processed',
            extracted_data: JSON.stringify({ hash: fileHash }),
          });

          // Update job record
          jobRecord.status = 'completed';
          jobRecord.completed_at = new Date();
          await this.jobRepository.save(jobRecord);

          return { success: true, hash: fileHash };
        } catch (error) {
          // Update file status to failed
          await this.fileService.updateStatus(fileId, 'failed');

          // Update job record
          jobRecord.status = 'failed';
          jobRecord.error_message = error.message;
          jobRecord.completed_at = new Date();
          await this.jobRepository.save(jobRecord);

          throw error;
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
    );

    this.worker.on('completed', (job: Job) => {
      console.log(`Job ${job.id} completed for file ${job.data.fileId}`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job ${job?.id} failed for file ${job?.data.fileId}:`, error);
    });
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', (err) => reject(err));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  async processFile(fileId: number): Promise<void> {
    // Add job to queue with retry options
    await this.fileQueue.add('process-file', { fileId }, {
      attempts: this.MAX_RETRIES,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async retryFailedJob(fileId: number) {
    const file = await this.fileService.getFileByIdForProcessing(fileId);
    if (!file || file.status !== 'failed') {
      throw new Error('File not found or not in failed state');
    }

    // Reset file status to uploaded
    await this.fileService.updateStatus(fileId, 'uploaded');

    // Create new job with retry options
    await this.fileQueue.add('process-file', { fileId }, {
      attempts: this.MAX_RETRIES,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
} 