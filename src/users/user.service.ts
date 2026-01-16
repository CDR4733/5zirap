import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /** 내 정보 조회(R) API **/
  async myProfile(user: User) {
    // 1. 사용자 정보 조회
    const profile: User = await this.findByUserId(user.userId);
    // 2. 데이터 가공
    const data = {
      userId: profile.userId,
      email: profile.email,
      nickname: profile.nickname,
      role: profile.role,
      createdAt: profile.createdAt,
    };
    // 3. 데이터 반환
    return data;
  }

  /** userId로 사용자 정보 조회(R) API **/
  async findByUserId(userId: number) {
    return await this.userRepository.findOneBy({ userId });
  }

  /** nickname으로 사용자 정보 조회(R) API **/
  async findByNickname(nickname: string) {
    return await this.userRepository.findOneBy({ nickname });
  }

  /** email로 사용자 정보 조회(R) API **/
  async findByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }
}
