import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostCategory } from '../types/post-category.type';

@Entity({ name: 'posts' })
export class Post {
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
}
