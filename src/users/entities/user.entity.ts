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
  @OneToMany(() => Point, (point) => point.user, { cascade: true })
  points: Point[];

  @OneToMany(() => PointLog, (pointLog) => pointLog.user, { cascade: true })
  pointLogs: PointLog[];
}
