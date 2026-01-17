import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dtos/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { User } from 'src/users/entities/user.entity';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostDislike } from './entities/post-dislike.entity';
import { POST_MESSAGE } from 'src/constants/post-message.constant';
import { PostCategory } from './types/post-category.type';
import { Order } from './types/post-order.type';
import { UpdatePostDto } from './dtos/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostDislike)
    private readonly postDislikeRepository: Repository<PostDislike>,
  ) {}

  /** 게시글 생성(C) API **/
  async createPost(createPostDto: CreatePostDto, userId: number) {
    const { title, content, postCategory, urlsArray, hashtagsString } =
      createPostDto;
    const user = await this.userRepository.findOne({
      where: { userId },
      //   withDeleted: true,
    });

    // 1. user가 맞는지? - 아니라면 에러메시지(401)
    if (!user) {
      throw new UnauthorizedException(POST_MESSAGE.POST.UNAUTHORIZED);
    }
    // 2.해시태그 유효성 체크 (입력된 경우에만)
    let hashtags: string[] = [];
    const hashtagPattern = /#\S+/g; // 해시태그 정규 표현식
    if (hashtagsString) {
      const isValidHashtags = this.validateHashtags(hashtagsString);
      if (!isValidHashtags) {
        throw new BadRequestException('해시태그를 양식에 맞게 입력해 주세요.');
      }
      hashtags = hashtagsString.match(hashtagPattern);
    }

    // 3. urlsArray가 비어있다면 pass하는 로직 (나중에 S3 도입 후 추가개발)
    console.log(urlsArray);

    // 4. post 저장
    const createdPost = this.postRepository.create({
      title,
      content,
      postCategory,
      userId,
      hashtags,
    });
    const newPost = await this.postRepository.save(createdPost);

    // 5. 반환
    return newPost;
  }

  /** 게시글 목록 조회(R-A) API **/
  async findAllPosts(
    page: number,
    limit: number,
    postCategory?: PostCategory,
    sort?: Order,
    keyword?: string,
  ) {
    // 1. 페이지네이션
    const sortCategory = postCategory ? { postCategory } : {};
    const keywordFilter = keyword ? { title: Like(`%${keyword}%`) } : {};
    const { items, meta } = await paginate<Post>(
      this.postRepository,
      { page, limit },
      {
        where: { ...sortCategory, ...keywordFilter },
        // relations: ['user'],
        order: { createdAt: sort ? sort : 'DESC' },
        select: {
          postId: true,
          userId: true,
          title: true,
          postCategory: true,
          createdAt: true,
          updatedAt: true,
          //   user: { // 관계 설정 후 활성화
          //     nickname: true,
          //   },
        },
      },
    );
    // 2. 데이터 가공
    const result = {
      posts: items.map((post) => ({
        postId: post.postId,
        userId: post.userId,
        // nickname: post?.user?.nickname,
        title: post.title,
        numComments: 0,
        postCategory: post.postCategory,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      meta,
    };
    // 3. 반환
    return result;
  }

  /** 게시글 상세 조회(R-D) API **/
  async findOnePost(postId: number) {
    // 1. postId에 해당하는 post 불러오기
    const post = await this.postRepository.findOne({
      where: { postId },
      //   relations:
    });
    // 1-1. post 존재하지 않으면 에러메시지(404)
    if (!post) {
      throw new NotFoundException(POST_MESSAGE.POST.READ_DETAIL.FAIL);
    }
    // 2. 데이터 가공
    const result = {
      postId: post.postId,
      userId: post.userId,
      //   nickname: post.user?.nickname,
      title: post.title,
      postCategory: post.postCategory,
      content: post.content,
      //   numLikes: post.numLikes, // 좋아요 수
      //   numDislikes: post.numDislikes, // 싫어요 수
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      hashtagsString: post.hashtags,
    };
    // 3. 반환
    return result;
  }

  /** 게시글 수정(U) API **/
  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
    userId: number,
  ) {
    // 1. 해당 postId의 post를 불러온다.
    const { title, content, urlsArray, postCategory, hashtagsString } =
      updatePostDto;
    const post = await this.postRepository.findOne({
      where: { postId },
      // withDeleted: true,
    });
    // 1-1. post가 존재하는지? 없으면 에러메시지(404)
    if (!post) {
      throw new NotFoundException(POST_MESSAGE.POST.NOT_FOUND);
    }
    // 1-2.작성자 본인인지? 아니면 에러메시지(403)
    if (post.userId !== userId) {
      throw new ForbiddenException(POST_MESSAGE.POST.UPDATE.FAILURE.FORBIDDEN);
    }
    // 2. 해시태그가 입력된 경우 유효성 체크
    let hashtags: string[] = [];
    const hashtagPattern = /#\S+/g; // 해시태그 정규 표현식
    if (hashtagsString) {
      const isValidHashtags = this.validateHashtags(hashtagsString);
      if (!isValidHashtags) {
        throw new BadRequestException('해시태그를 양식에 맞게 입력해주세요.'); // 유효하지 않은 해시태그에 대한 예외 처리
      }
      hashtags = hashtagsString.match(hashtagPattern); // 해시태그와 매칭
    }
    // 3. AWS S3 관련 로직 => S3 추가 후 다시 작성
    console.log(urlsArray);

    // 4. DB에서 수정
    await this.postRepository.update(
      { postId },
      {
        title,
        content,
        postCategory,
        hashtags: hashtagsString.length > 0 ? hashtags : post.hashtags,
      },
    );
  }

  /** 게시글 삭제(D) API **/
  async deletePost(postId: number, userId: number) {
    // 1. postId로 해당 post 가져오기
    const post = await this.postRepository.findOne({
      where: { postId },
      // withDeleted: true,
      // relations:
    });
    // 1-1. post가 존재하니? 아니면 에러메시지(404)
    if (!post) {
      throw new NotFoundException(POST_MESSAGE.POST.NOT_FOUND);
    }
    // 1-2. 본인이 작성한 post가 맞니? 아니면 에러메시지(403)
    if (post.userId !== userId) {
      throw new ForbiddenException(POST_MESSAGE.POST.DELETE.FAILURE.FORBIDDEN);
    }
    // 2. DB에서 게시글 삭제
    await this.postRepository.remove(post);
  }

  /** hashtag 유효성 검사 **/
  private validateHashtags(hashtagsString: string): boolean {
    // 해시태그가 비어있으면 true 반환
    if (!hashtagsString.trim()) {
      return true; // 아무것도 입력되지 않았을 경우 유효한 것으로 간주
    }

    const hashtagPattern = /#\S+/g; // 해시태그 정규 표현식
    const hashtagItem = hashtagsString.match(hashtagPattern); // 입력된 해시태그와 매칭

    // 유효한 해시태그가 한 개도 없을 경우
    if (!hashtagItem || hashtagItem.length === 0) {
      return false;
    }

    // 모든 해시태그가 #으로 시작하고 공백이 없는지 체크
    for (const tag of hashtagItem) {
      if (tag.trim().length < 2) {
        // #포함 최소 2글자 이상이어야 함
        return false;
      }
    }

    return true; // 모든 해시태그가 유효할 경우
  }
}
