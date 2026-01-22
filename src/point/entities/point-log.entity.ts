import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PointType } from '../types/point.type';

@Entity({
  name: 'point_logs',
})
export class PointLog {
  // 컬럼 설정
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ unsigned: true })
  userId: number;

  @Column({ type: 'enum', enum: PointType })
  pointType: PointType;

  @Column()
  point: number;

  @CreateDateColumn()
  createdAt: Date;

  // 관계 설정
  @ManyToOne(() => User, (user) => user.pointLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
