import { Comment } from 'src/comment/entities/comment.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('comment_dislikes')
export class CommentDislike {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  commentDislikeId: number;

  @Column({ type: 'int', name: 'user_id', unsigned: true })
  userId: number;

  @Column({ type: 'int', name: 'comment_id', unsigned: true })
  commentId: number;

  @CreateDateColumn()
  createdAt: Date;

  // 관계 설정
  // 1. User 관련
  @ManyToOne(() => User, (user) => user.commentLikes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 2. Comment 관련
  @ManyToOne(() => Comment, (comment) => comment.commentLikes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;
}
