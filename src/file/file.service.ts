import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { Job } from './entities/job.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async createFile(
    userId: number,
    file: Express.Multer.File,
    title?: string,
    description?: string,
  ): Promise<File> {
    const newFile = this.fileRepository.create({
      user: { id: userId },
      original_filename: file.originalname,
      storage_path: file.path,
      title,
      description,
      status: 'uploaded',
    });

    const savedFile = await this.fileRepository.save(newFile);

    // Create a job for processing
    const job = this.jobRepository.create({
      file: savedFile,
      job_type: 'process_file',
      status: 'queued',
    });
    await this.jobRepository.save(job);

    return savedFile;
  }

  async getFileById(id: number, userId: number): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async getFileByIdForProcessing(id: number): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async getUserFiles(userId: number, page: number = 1, limit: number = 10) {
    const [files, total] = await this.fileRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['jobs'],
      skip: (page - 1) * limit,
      take: limit,
      order: { uploaded_at: 'DESC' },
    });

    return {
      files,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(fileId: number, status: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    file.status = status;
    return this.fileRepository.save(file);
  }

  async updateProcessing(
    fileId: number,
    data: { status: string; extracted_data: string },
  ): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    file.status = data.status;
    file.extracted_data = data.extracted_data;
    return this.fileRepository.save(file);
  }
} 