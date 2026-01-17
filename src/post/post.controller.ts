import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LogIn } from 'src/decorators/log-in.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreatePostDto } from './dtos/create-post.dto';
import { POST_MESSAGE } from 'src/constants/post-message.constant';
import { PostCategory } from './types/post-category.type';
import { Order } from './types/post-order.type';
import { FindAllPostsDto } from './dtos/find-all-posts.dto';
import { UpdatePostDto } from './dtos/update-post.dto';

@ApiTags('03. POST API')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /** 게시글 생성(C) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '1. 게시글 생성 API' })
  @Post()
  async create(@LogIn() user: User, @Body() createPostDto: CreatePostDto) {
    const userId = user.userId;
    const createdPost = await this.postService.createPost(
      createPostDto,
      userId,
    );
    return {
      status: HttpStatus.CREATED,
      message: POST_MESSAGE.POST.CREATE.SUCCESS,
      data: createdPost,
    };
  }

  /** 게시글 목록 조회(R-A) API **/
  @ApiOperation({ summary: '2. 게시글 목록 조회 API' })
  @ApiQuery({
    name: 'postCategory',
    required: false,
    enum: PostCategory,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: Order,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
  })
  @Get()
  async findAll(@Query() findAllPostsDto?: FindAllPostsDto) {
    const { page, limit, postCategory, sort, keyword } = findAllPostsDto || {};
    const findAllPost = await this.postService.findAllPosts(
      page,
      limit,
      postCategory,
      sort,
      keyword,
    );

    return {
      status: HttpStatus.OK,
      message: POST_MESSAGE.POST.READ_ALL.SUCCESS,
      data: findAllPost,
    };
  }

  /** 게시글 상세 조회(R-D) API **/
  @ApiOperation({ summary: '3. 게시글 상세 조회 API' })
  @Get(':postId')
  async findOne(@Param('postId') postId: number) {
    const post = await this.postService.findOnePost(postId);

    return {
      status: HttpStatus.OK,
      message: POST_MESSAGE.POST.READ_DETAIL.SUCCESS,
      data: post,
    };
  }

  /** 게시글 수정(U) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '4. 게시글 수정 API' })
  @Patch(':postId')
  async update(
    @LogIn() user: User,
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const userId = user.userId;
    await this.postService.updatePost(postId, updatePostDto, userId);

    return {
      status: HttpStatus.OK,
      message: POST_MESSAGE.POST.UPDATE.SUCCESS,
    };
  }

  /** 게시글 삭제(D) API **/
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '5. 게시글 삭제 API' })
  @Delete(':postId')
  async deletePost(@LogIn() user: User, @Param('postId') postId: number) {
    const userId = user.userId;
    await this.postService.deletePost(postId, userId);

    return {
      status: HttpStatus.OK,
      message: POST_MESSAGE.POST.DELETE.SUCCESS,
    };
  }
}
