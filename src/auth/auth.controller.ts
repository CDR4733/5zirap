import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dtos/sign-up.dto';
import { AUTH_MESSAGES } from 'src/constants/auth-message.constant';

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
}
