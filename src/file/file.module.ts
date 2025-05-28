import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileProcessorService } from './file-processor.service';
import { File } from './entities/file.entity';
import { Job } from './entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, Job]),
    BullModule.registerQueue({
      name: 'file-processing',
    }),
  ],
  controllers: [FileController],
  providers: [FileService, FileProcessorService],
  exports: [FileService],
})
export class FileModule {} 