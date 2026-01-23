import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { COMMENT_MESSAGE } from 'src/constants/comment-message.constant';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';

import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { CommentDislike } from './entities/comment-dislike.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(CommentDislike)
    private readonly commentDislikeRepository: Repository<CommentDislike>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /** 댓글 생성(C) API **/
  async createComment(
    userId: number,
    postId: number,
    createCommentDto: CreateCommentDto,
  ) {
    // 1. 사용자 정보 확인
    const user = await this.userRepository.findOne({
      where: { userId },
      withDeleted: true,
    });
    if (!user) {
      throw new UnauthorizedException(COMMENT_MESSAGE.COMMENT.UNAUTHORIZED);
    }

    // 2. 게시글 존재 확인
    const post = await this.postRepository.findOneBy({
      postId,
    });
    if (!post) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NO_POST);
    }
    // 닉네임 저장
    const nickname = user.nickname;

    // 3. 댓글 저장
    const data = await this.commentRepository.save({
      userId,
      postId,
      ...createCommentDto,
    });

    // // 4. 댓글 생성 포인트 확인
    // const isValidPoint = await this.pointService.validatePointLog(
    //   userId,
    //   PointType.COMMENT
    // );
    // // 4-1. 포인트 획득 가능하고 게시글 작성자가 아닐 때, 댓글 생성 포인트 지급
    // if (isValidPoint && post.userId !== userId) {
    //   console.log('postId 전달:', postId); // 디버깅용 로그
    //   this.pointService.savePointLog(userId, PointType.COMMENT, true);
    // }

    // // 5. 알람(SSE) 전송
    // // 댓글을 다는 사람(로그인한 사람)이 게시글을 쓴 사람이 아닌 경우에만 알람
    // if (userId !== post.userId) {
    //   await this.alarmService.createAlarm(
    //     post.userId, // 게시글 글쓴이(알람을 받을 사용자)에게
    //     AlarmFromType.POST, // 유형은 POST
    //     post.id // 어떤 게시글에(postId) 새로운 댓글이 달렸는지
    //   );
    // }

    // 6. 반환
    return {
      commentId: data.commentId,
      userId: data.userId,
      nickName: nickname,
      postId: data.postId,
      parentId: data.parentId,
      content: data.content,
      createdAt: data.createdAt,
      updateAt: data.updateAt,
    };
  }

  /** 댓글 목록 조회(R-A) API **/
  async findAllComments(postId: number) {
    // 1. 댓글 목록 조회
    const comments = await this.commentRepository.find({
      where: { postId, parentId: IsNull() },
      relations: ['user', 'commentLikes', 'commentDislikes'],
      select: {
        user: {
          nickname: true,
        },
      },
    });

    // 2. 각 댓글에 대한 대댓글 갯수 추가
    const commentsWithRecommentsCount = await Promise.all(
      comments.map(async (comment) => {
        const recommentsCount = await this.commentRepository.count({
          where: { parentId: comment.commentId },
        });

        return {
          commentId: comment.commentId,
          parentId: comment.parentId,
          content: comment.content,
          userId: comment.userId,
          postId: comment.postId,
          createdAt: comment.createdAt,
          updateAt: comment.updateAt,
          nickname: comment.user?.nickname,
          likes: comment.commentLikes.length,
          dislikes: comment.commentDislikes.length,
          recommentsCount,
        };
      }),
    );

    return commentsWithRecommentsCount;
  }

  /** 댓글 수정(U) API **/
  async updateComment(
    userId: number,
    postId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ) {
    // 1. 게시글이 존재하는지 확인
    const post = await this.postRepository.findOneBy({ postId });
    if (!post) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NO_POST);
    }

    // 2. 댓글이 존재하는지 확인 + 작성자 본인인지 확인
    const comment = await this.commentRepository.findOneBy({ commentId });
    if (!comment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    } else if (comment.userId !== userId) {
      throw new ForbiddenException(
        COMMENT_MESSAGE.COMMENT.UPDATE.FAILURE.FORBIDDEN,
      );
    }

    // 3. 수정 내용 저장
    const updatedComment = await this.commentRepository.save({
      commentId,
      ...updateCommentDto,
    });

    // 4. 반환
    return updatedComment;
  }

  /** 댓글 삭제(D) API **/
  async deleteComment(userId: number, commentId: number) {
    // 1. 댓글이 존재하는지 확인, 작성자 본인인지 확인
    const comment = await this.commentRepository.findOneBy({ commentId });
    if (!comment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    } else if (comment.userId !== userId) {
      throw new ForbiddenException(
        COMMENT_MESSAGE.COMMENT.DELETE.FAILURE.FORBIDDEN,
      );
    }

    // // 2. 댓글 삭제로 포인트 차감
    // this.pointService.savePointLog(userId, PointType.COMMENT, false);

    // 3. 댓글 삭제 : 사실 내용만 바꿈.
    await this.commentRepository.save({
      commentId,
      content: '삭제된 댓글입니다.',
    });
  }

  /** 댓글 좋아요 클릭 API **/
  async clickCommentLike(userId: number, commentId: number) {
    // 1. 좋아요를 누를 댓글 정보
    const existingComment = await this.commentRepository.findOneBy({
      commentId,
    });
    // 1-1. 댓글이 존재하지 않으면 에러처리
    if (!existingComment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    }
    // 1-2. 본인의 댓글에는 좋아요를 누를 수 없도록
    if (existingComment.userId === userId) {
      throw new BadRequestException(COMMENT_MESSAGE.LIKE.CLICK.FAILURE.NO_SELF);
    }

    // 2. 내가 싫어요를 누른 상태인지 아닌지 확인
    const alreadyDislike = await this.commentDislikeRepository.findOneBy({
      userId,
      commentId,
    });
    // 2-1. 싫어요를 누른 상태라면 좋아요를 누를 수 없도록
    if (alreadyDislike) {
      throw new BadRequestException(
        COMMENT_MESSAGE.LIKE.CLICK.FAILURE.ALREADY_DISLIKE,
      );
    }

    // 3. 내가 좋아요를 누른 상태인지 아닌지 확인
    const commentLike = await this.commentLikeRepository.findOneBy({
      userId,
      commentId,
    });
    if (!commentLike) {
      // 3-1A. 댓글 좋아요 명단에 내가 없다면 => 댓글 좋아요 등록
      await this.commentLikeRepository.save({
        userId,
        commentId,
      });
      // // 3-1B. 댓글 좋아요에 따른 포인트 지급
      // const isValidPoint = await this.pointService.validatePointLog(
      //   userId,
      //   PointType.COMMENT_LIKE
      // );
      // if (isValidPoint) {
      //   this.pointService.savePointLog(userId, PointType.COMMENT_LIKE, true);
      // }
    } else {
      // 3-2A. 댓글 좋아요 명단에 내가 있다면 => 댓글 좋아요 취소
      await this.commentLikeRepository.delete({
        userId,
        commentId,
      });
      // // 3-2B. 댓글 좋아요 취소에 따른 포인트 차감
      // this.pointService.savePointLog(userId, PointType.COMMENT_LIKE, false);
    }
  }

  /** 댓글 싫어요 클릭 API **/
  async clickCommentDislike(userId: number, commentId: number) {
    // 1. 싫어요를 누를 댓글 정보
    const existingComment = await this.commentRepository.findOneBy({
      commentId,
    });
    // 1-1. 댓글이 존재하지 않으면 에러처리
    if (!existingComment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    }
    // 1-2. 본인의 댓글에는 싫어요를 누를 수 없도록
    if (existingComment.userId == userId) {
      throw new BadRequestException(
        COMMENT_MESSAGE.DISLIKE.CLICK.FAILURE.NO_SELF,
      );
    }

    // 2. 내가 좋아요를 누른 상태인지 아닌지 확인
    const alreadyLike = await this.commentLikeRepository.findOneBy({
      userId,
      commentId,
    });
    // 2-1. 좋아요를 누른 상태라면 싫어요를 누를 수 없도록
    if (alreadyLike) {
      throw new BadRequestException(
        COMMENT_MESSAGE.DISLIKE.CLICK.FAILURE.ALREADY_LIKE,
      );
    }

    // 3. 내가 싫어요를 누른 상태인지 아닌지 확인
    const commentDislike = await this.commentDislikeRepository.findOneBy({
      userId,
      commentId,
    });
    if (!commentDislike) {
      // 3-1. 댓글 싫어요 명단에 내가 없다면 => 댓글 싫어요 등록
      await this.commentDislikeRepository.save({
        userId,
        commentId,
      });
    } else {
      // 3-2. 댓글 싫어요 명단에 내가 있다면 => 댓글 싫어요 취소
      await this.commentDislikeRepository.delete({
        userId,
        commentId,
      });
    }
  }
}
