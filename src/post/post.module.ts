import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import { PostLike } from './entities/post-like.entity';
import { PostDislike } from './entities/post-dislike.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, PostLike, PostDislike])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
