import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommentDislike } from 'src/comment/entities/comment-dislike.entity';
import { CommentLike } from 'src/comment/entities/comment-like.entity';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('comments')
export class Comment {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  commentId: number;

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true })
  parentId: number;

  @IsNotEmpty({ message: '내용을 입력해 주세요.' })
  @IsString({ message: '댓글 형식에 맞게 입력해 주세요' })
  @Column()
  content: string;

  @Column({ type: 'int', name: 'user_id', unsigned: true })
  userId: number;

  @Column({ type: 'int', name: 'post_id', unsigned: true })
  postId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  // 관계 설정
  // 1. User 관련
  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 2. Post 관련
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  // 3. Comment Like/Dislike 관련
  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment, {
    cascade: true,
  })
  commentLikes: CommentLike[];

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.comment, {
    cascade: true,
  })
  commentDislikes: CommentDislike[];
}
