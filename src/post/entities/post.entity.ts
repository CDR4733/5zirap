import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostCategory } from '../types/post-category.type';
import { User } from 'src/users/entities/user.entity';
import { PostLike } from './post-like.entity';
import { PostDislike } from './post-dislike.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Entity({ name: 'posts' })
export class Post {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  postId: number;

  @Column({ type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'enum', enum: PostCategory, default: PostCategory.CHAT })
  postCategory: PostCategory;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array' })
  hashtags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 관계 설정
  // 1. User 관련
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;

  // 2. Post Like/Dislike 관련
  @OneToMany(() => PostLike, (postLike) => postLike.post, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  postLikes: PostLike[];

  @OneToMany(() => PostDislike, (postDislike) => postDislike.post, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  postDislikes: PostDislike[];

  // 3. Comment 관련
  @OneToMany(() => Comment, (comment) => comment.post, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  comments: Comment[];
}
