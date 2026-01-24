import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DataSource,
  Repository,
  QueryFailedError,
  // LessThan,
  // EntityManager,
} from 'typeorm';

import bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Point } from 'src/point/entities/point.entity';

import { AUTH_MESSAGES } from 'src/constants/auth-message.constant';
import { SignUpDto } from './dtos/sign-up.dto';
import { LogInDto } from './dtos/log-in.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@Injectable()
export class AuthService {
  private transporter;

  constructor(
    private dataSource: DataSource, // 트랜잭션

    private configService: ConfigService,
    private readonly jwtService: JwtService,
    private redisService: RedisService,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Nodemailer 설정
    this.transporter = nodemailer.createTransport({
      // SMTP 설정
      host: 'smtp.gmail.com', // smtp host
      port: 465, // single connection
      secure: true,
      auth: {
        user: this.configService.get<string>('NODE_MAILER_ID'),
        pass: this.configService.get<string>('NODE_MAILER_PASSWORD'),
      },
    });
  }

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

    // 5. 트랜잭션 : 회원 가입 + 포인트 테이블 생성
    // 5-1. 트랜잭션 세팅
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // 5-2. 트랜잭션 묶기
    try {
      // 5-2-1. 신규 회원 데이터 생성 (회원 가입)
      const newMember = await queryRunner.manager.save(User, {
        email: signUpDto.email,
        nickname: signUpDto.nickname,
        password: hashedPassword,
      });
      // 5-2-2. 포인트 테이블 생성 (포인트)
      const newPoint = await queryRunner.manager.save(Point, {
        userId: newMember.userId,
        accPoint: 0,
      });

      // 5-2-3. 인증 이메일 발송
      this.sendEmail(newMember.email, sourcePage);

      // 5-2-4. 성공: commit
      await queryRunner.commitTransaction();
      // 5-3. 트랜잭션 된 상태를 release하면서 트랜잭션 최종 완료
      await queryRunner.release();

      // 6. 데이터 가공
      const newMemberData = {
        email: newMember.email,
        nickname: newMember.nickname,
        role: newMember.role,
        point: newPoint.accPoint,
      };
      // 7. 리턴
      return newMemberData;
    } catch (err) {
      // 5-2-4. 실패: rollback
      await queryRunner.rollbackTransaction();
      // 5-3. 롤백된 상태를 release하면서 트랙잭션 최종완료
      await queryRunner.release();
      // 5-4. 이메일 중복 예외 처리(탈퇴된 계정)
      if (
        err instanceof QueryFailedError &&
        err.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(AUTH_MESSAGES.SIGN_UP.FAILURE.RESTORE);
      }
      // 5. 에러처리
      throw err;
    }

    // // 5. 회원 가입
    // const user = await this.userRepository.save({
    //   email: email,
    //   nickname: nickname,
    //   password: hashedPassword,
    // });
    // // 6. 데이터 가공
    // const data = {
    //   email: user.email,
    //   nickname: user.nickname,
    //   role: user.role,
    // };
    // // 7. 데이터 반환
    // return data;
  }

  /** 이메일 인증 API **/
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const client = this.redisService.getClient();
    const { email, certification } = verifyEmailDto;
    const mailedCode = await client.get(`verified:${email}`);

    // 1. 입력된 email 주소가 맞는지?
    if (!mailedCode) {
      throw new BadRequestException(
        AUTH_MESSAGES.VERIFY_EMAIL.FAILURE.WRONG_EMAIL,
      );
    }
    // 2. 입력된 코드가 발송된 코드와 일치하는지?
    if (certification !== +mailedCode) {
      throw new BadRequestException(
        AUTH_MESSAGES.VERIFY_EMAIL.FAILURE.WRONG_CERTIFICATION,
      );
    }
    // 3. 이메일 인증 완료
    await this.userRepository.update({ email }, { verifiedEmail: true });
    // 4. 결과 반환
    return { verified: email };
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

  /** 메일 전송 **/
  async sendEmail(email: string, sourcePage: string) {
    try {
      const certification = await this.createCertification();
      let subject = '';
      let text = '';

      // Redis에 인증코드 전달
      const client = this.redisService.getClient();
      await client.set(`verified:${email}`, certification);
      await client.expire(`verified:${email}`, 300);

      // 어느 페이지에서 요청이 왔느냐에 따라 메일 전송 내용 변경
      if (sourcePage === 'sign-up') {
        subject = '[5zirap] 회원가입 인증 메일';
        text = `
          인증번호 4자리 : ${certification},
          안녕하세요. [5zirap]의 회원가입을 위한 인증 메일입니다.
          인증번호를 입력해 주세요.
          인증 유효시간은 5분 입니다.`;
      } else if (sourcePage === 'password-update') {
        subject = '[5zirap] 비밀번호 변경 인증 메일';
        text = `
          인증번호 4자리 : ${certification},
          안녕하세요. [5zirap]의 비밀번호 변경을 위한 인증 메일입니다.
          인증번호를 입력해 주세요.
          인증 유효시간은 5분 입니다.`;
      }

      // 완성된 메일을 user의 email로 전송
      await this.transporter.sendMail({
        from: this.configService.get<string>('NODE_MAILER_ID'),
        to: email, // string or Array
        subject: subject,
        text: text,
      });
    } catch (err) {
      console.error('노드메일러 오류 : ', err);
      throw new InternalServerErrorException(
        AUTH_MESSAGES.VERIFY_EMAIL.FAILURE.SEND_ERROR,
      );
    }
  }

  /** 인증 코드 생성 **/
  async createCertification() {
    // 1. 1000 ~ 9999 사이 랜덤수 생성
    const certification = Math.floor(1000 + Math.random() * 8999);
    return certification;
  }
}
