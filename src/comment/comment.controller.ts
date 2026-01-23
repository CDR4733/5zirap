import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';

import { COMMENT_MESSAGE } from 'src/constants/comment-message.constant';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';

import { AuthGuard } from '@nestjs/passport';
import { LogIn } from 'src/decorators/log-in.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('04. COMMENT API')
@Controller('/posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /** 댓글 생성(C) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '01. 댓글 생성 API' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @Post()
  async create(
    @LogIn() user: User,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = user.userId;

    const data = await this.commentService.createComment(
      userId,
      postId,
      createCommentDto,
    );

    return {
      status: HttpStatus.CREATED,
      message: COMMENT_MESSAGE.COMMENT.CREATE.SUCCESS,
      data,
    };
  }

  /** 댓글 목록 조회(R-A) API **/
  @ApiOperation({ summary: '02. 댓글 목록 조회 API' })
  @Get()
  async findAll(@Param('postId', ParseIntPipe) postId: number) {
    const data = await this.commentService.findAllComments(postId);

    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.COMMENT.READ.SUCCESS,
      data,
    };
  }

  /** 댓글 수정(U) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '03. 댓글 수정 API' })
  @Patch(':commentId')
  async update(
    @LogIn() user: User,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const userId = user.userId;

    const data = await this.commentService.updateComment(
      userId,
      postId,
      commentId,
      updateCommentDto,
    );

    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.COMMENT.UPDATE.SUCCESS,
      data,
    };
  }

  /** 댓글 삭제(D) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '04. 댓글 삭제 API' })
  @Delete(':commentId')
  async remove(
    @LogIn() user: User,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    const userId = user.userId;
    await this.commentService.deleteComment(userId, commentId);

    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.COMMENT.DELETE.SUCCESS,
    };
  }

  /** 댓글 좋아요 클릭 API **/
  @ApiOperation({ summary: '05. 댓글 좋아요 클릭 API' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':commentId/likes')
  async clickCommentLike(
    @LogIn() user: User,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    const userId = user.userId;
    await this.commentService.clickCommentLike(userId, commentId);

    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.LIKE.CLICK.SUCCESS,
    };
  }

  /** 댓글 싫어요 클릭 API **/
  @ApiOperation({ summary: '06. 댓글 싫어요 클릭 API' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':commentId/dislikes')
  async clickCommentDislike(
    @LogIn() user: User,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    const userId = user.userId;
    await this.commentService.clickCommentDislike(userId, commentId);

    return {
      status: HttpStatus.OK,
      message: COMMENT_MESSAGE.DISLIKE.CLICK.SUCCESS,
    };
  }
}
