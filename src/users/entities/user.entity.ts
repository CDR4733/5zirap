import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../types/user-role.type';
import { SocialType } from '../types/social-type.type';

import { Point } from 'src/point/entities/point.entity';
import { PointLog } from 'src/point/entities/point-log.entity';

import { Post } from 'src/post/entities/post.entity';
import { PostLike } from 'src/post/entities/post-like.entity';
import { PostDislike } from 'src/post/entities/post-dislike.entity';

import { Comment } from 'src/comment/entities/comment.entity';
import { CommentLike } from 'src/comment/entities/comment-like.entity';
import { CommentDislike } from 'src/comment/entities/comment-dislike.entity';

@Entity({ name: 'users' })
export class User {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  userId: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  nickname: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  @Column({ type: 'boolean', default: false })
  verifiedEmail: boolean;

  @Column({ type: 'varchar', nullable: true })
  socialId?: string;

  @Column({ type: 'enum', enum: SocialType, default: SocialType.OZIRAP })
  socialType: SocialType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // 관계 설정
  // 1. Point 관련
  @OneToMany(() => Point, (point) => point.user, { cascade: true })
  points: Point[];

  @OneToMany(() => PointLog, (pointLog) => pointLog.user, { cascade: true })
  pointLogs: PointLog[];

  // 2. Post 관련
  @OneToMany(() => Post, (post) => post.user, { cascade: true })
  posts: Post[];

  @OneToMany(() => PostLike, (postLike) => postLike.user, {
    cascade: true,
  })
  postLikes: PostLike[];

  @OneToMany(() => PostDislike, (postDislike) => postDislike.user, {
    cascade: true,
  })
  postDislikes: PostDislike[];

  // 3. Comment 관련
  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  comments: Comment[];

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user, {
    cascade: true,
  })
  commentLikes: CommentLike[];

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.user, {
    cascade: true,
  })
  commentDislikes: CommentDislike[];
}
