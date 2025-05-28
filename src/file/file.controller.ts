import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileService } from './file.service';
import { FileProcessorService } from './file-processor.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly fileProcessorService: FileProcessorService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    dest: './uploads',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('description') description?: string,
  ) {
    console.log('Received request body:', req.body);
    console.log('Received file:', file);

    if (!file) {
      throw new BadRequestException('No file uploaded. Please ensure you are sending a file with the field name "file"');
    }

    const savedFile = await this.fileService.createFile(
      req.user.id,
      file,
      title,
      description,
    );

    // Queue the file for processing
    await this.fileProcessorService.processFile(savedFile.id);

    return savedFile;
  }

  @Get(':id')
  async getFile(@Request() req, @Param('id') id: string) {
    return this.fileService.getFileById(parseInt(id), req.user.id);
  }

  @Post(':id/retry')
  async retryFile(@Request() req, @Param('id') id: string) {
    const file = await this.fileService.getFileById(parseInt(id), req.user.id);
    if (!file) {
      throw new BadRequestException('File not found');
    }
    await this.fileProcessorService.retryFailedJob(file.id);
    return { message: 'Retry job queued successfully' };
  }

  @Get()
  async getUserFiles(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid limit number');
    }

    return this.fileService.getUserFiles(req.user.id, pageNum, limitNum);
  }
} 