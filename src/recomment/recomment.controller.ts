import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecommentService } from './recomment.service';
import { CreateRecommentDto } from './dtos/create-recomment.dto';
import { UpdateRecommentDto } from './dtos/update-recomment.dto';
import { COMMENT_MESSAGE } from 'src/constants/comment-message.constant';

import { AuthGuard } from '@nestjs/passport';
import { LogIn } from 'src/decorators/log-in.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('05. RECOMMENT API')
@Controller('comments')
export class RecommentController {
  constructor(private readonly recommentService: RecommentService) {}

  /** 대댓글 생성(C) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '01. 대댓글 생성 API' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @Post(':commentId/recomments')
  async createRecomment(
    @Param('commentId') commentId: number,
    @LogIn() user: User,
    @Body() createRecommentDto: CreateRecommentDto,
  ) {
    const data = await this.recommentService.createRecomment(
      +commentId,
      user,
      createRecommentDto,
    );
    return {
      status: HttpStatus.OK,
      message: '대댓글이 생성되었습니다.',
      data: data,
    };
  }

  /** 대댓글 목록 조회(R-A) API **/
  @ApiOperation({ summary: '02. 대댓글 목록 조회 API' })
  @Get(':commentId/recomments')
  async findAll(@Param('commentId') commentId: number) {
    const data = await this.recommentService.findAllRecomments(commentId);
    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.COMMENT.READ.SUCCESS,
      data: data,
    };
  }

  /** 대댓글 수정(U) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '03. 대댓글 수정 API' })
  @Patch(':commentId/recomments/:recommentId')
  async updateRecomment(
    @Param('commentId') commentId: number,
    @Param('recommentId') recommentId: number,
    @LogIn() user: User,
    @Body() updateRecommentDto: UpdateRecommentDto,
  ) {
    const data = await this.recommentService.updateRecomment(
      user,
      +commentId,
      +recommentId,
      updateRecommentDto,
    );

    return {
      status: HttpStatus.OK,
      message: '대댓글이 수정되었습니다.',
      data: data,
    };
  }

  /** 대댓글 삭제(D) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '04. 대댓글 삭제 API' })
  @Delete(':commentsId/recomments/:recommentId')
  async removeRecomment(
    @Param('commentId') commentId: number,
    @Param('recommentId') recommentId: number,
    @LogIn() user: User,
  ) {
    const data = await this.recommentService.deleteRecomment(
      user,
      +commentId,
      +recommentId,
    );
    return {
      status: HttpStatus.OK,
      message: '대댓글이 삭제되었습니다.',
      data: data,
    };
  }
}
