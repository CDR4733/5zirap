import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({
  name: 'points',
})
export class Point {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ unique: true, unsigned: true })
  userId: number;

  @Column({ default: 0 })
  accPoint: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // 관계 설정
  @ManyToOne(() => User, (user) => user.points)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
