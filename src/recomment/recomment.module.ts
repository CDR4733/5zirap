import { Module } from '@nestjs/common';
import { RecommentController } from './recomment.controller';
import { RecommentService } from './recomment.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/users/user.module';
import { CommentModule } from 'src/comment/comment.module';

import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Comment]),
    AuthModule,
    UserModule,
    CommentModule,
  ],
  controllers: [RecommentController],
  providers: [RecommentService],
})
export class RecommentModule {}
