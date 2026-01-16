import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AUTH_MESSAGES } from 'src/constants/auth-message.constant';
import { SignUpDto } from './dtos/sign-up.dto';
import { LogInDto } from './dtos/log-in.dto';

@ApiTags('01. AUTH API')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  /** 회원 가입(sign-up) API **/
  @ApiOperation({ summary: '1. 회원 가입(sign-up) API' })
  @Post('sign-up')
  async signUp(
    @Headers('X-Source-Page') sourcePage: string,
    @Body() signUpDto: SignUpDto,
  ) {
    const data = await this.authService.signUp(signUpDto, sourcePage);
    return {
      status: HttpStatus.CREATED,
      message: AUTH_MESSAGES.SIGN_UP.SUCCESS,
      data: data,
    };
  }

  /** 로그인(log-in) API **/
  @ApiOperation({ summary: '2. 로그인(log-in) API' })
  @Post('log-in')
  async logIn(@Body() logInDto: LogInDto) {
    const data = await this.authService.logIn(logInDto);
    return {
      status: HttpStatus.OK,
      message: AUTH_MESSAGES.LOG_IN.SUCCESS,
      data: data,
    };
  }
}
