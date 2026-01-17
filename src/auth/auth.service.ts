import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dtos/sign-up.dto';
import { AUTH_MESSAGES } from 'src/constants/auth-message.constant';
import bcrypt from 'bcrypt';
import { LogInDto } from './dtos/log-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /** 회원 가입(sign-up) API **/
  async signUp(signUpDto: SignUpDto, sourcePage: string) {
    // 1. dto에서 데이터 꺼내기
    const { email, nickname, password, passwordConfirm } = signUpDto;
    console.log(sourcePage);
    // 1-1. 비밀번호와 비밀번호 확인이 일치하는지 검증
    if (password !== passwordConfirm) {
      throw new BadRequestException(AUTH_MESSAGES.SIGN_UP.FAILURE.NOT_MATCHED);
    }
    // 2. 해당 email로 가입한 user가 존재하는지?
    const isExistingEmail: User = await this.userRepository.findOneBy({
      email,
    });
    // 2-1. 이미 존재한다면 에러메시지(409)
    if (isExistingEmail) {
      throw new ConflictException(AUTH_MESSAGES.SIGN_UP.FAILURE.EXISTING_EMAIL);
    }
    // 3. 해당 nickname으로 가입한 user가 존재하는지?
    const isExistingNickname: User = await this.userRepository.findOneBy({
      nickname,
    });
    // 3-1. 이미 존재한다면 에러메시지(409)
    if (isExistingNickname) {
      throw new ConflictException(
        AUTH_MESSAGES.SIGN_UP.FAILURE.EXISTING_NICKNAME,
      );
    }
    // 4. 비밀번호는 hash할 것
    const hashRounds = this.configService.get<number>('PASSWORD_HASH_ROUNDS');
    const hashedPassword = bcrypt.hashSync(password, hashRounds);
    // 5. 회원 가입
    const user = await this.userRepository.save({
      email: email,
      nickname: nickname,
      password: hashedPassword,
    });
    // 6. 데이터 가공
    const data = {
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    };
    // 7. 데이터 반환
    return data;
  }

  /** 로그인(log-in) API **/
  async logIn(logInDto: LogInDto) {
    // 1. dto에서 데이터 꺼내기
    const { email, password } = logInDto;
    // 2. 해당 email로 가입된 user가 있는지?
    const user: User = await this.userRepository.findOneBy({ email });
    // 2-1. 해당 email로 가입된 user가 존재하지 않으면 에러메시지(404)
    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.LOG_IN.FAILURE.NO_USER);
    }
    // 3. password가 일치하는지?
    const matched = bcrypt.compareSync(password, user.password);
    // 3-1. 일치하지 않는다면 에러메시지(401)
    if (!matched) {
      throw new UnauthorizedException(
        AUTH_MESSAGES.LOG_IN.FAILURE.WRONG_PASSWORD,
      );
    }
    // 4. email 인증을 아직 하지 않았다면 에러메시지(401)
    if (user.verifiedEmail !== true) {
      throw new UnauthorizedException(
        AUTH_MESSAGES.LOG_IN.FAILURE.NOT_VERIFIED,
      );
    }
    // 5. AccessToken 발급
    const payload = { userId: user.userId, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
