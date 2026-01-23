import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { USER_MESSAGES } from 'src/constants/user-message.constant';
import { AuthGuard } from '@nestjs/passport';
import { LogIn } from 'src/decorators/log-in.decorator';

@ApiTags('02. USER API')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 내 정보 조회(R) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '01. 내 정보 조회 API' })
  @Get('me')
  async myProfile(@LogIn() user: User) {
    const data = await this.userService.myProfile(user);
    return {
      status: HttpStatus.OK,
      message: USER_MESSAGES.READ_ME.SUCCESS,
      data: data,
    };
  }
}
