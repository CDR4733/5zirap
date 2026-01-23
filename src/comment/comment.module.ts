import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/users/user.module';
import { AuthModule } from 'src/auth/auth.module';

import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { CommentDislike } from './entities/comment-dislike.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Post,
      Comment,
      CommentLike,
      CommentDislike,
    ]),
    UserModule,
    AuthModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
