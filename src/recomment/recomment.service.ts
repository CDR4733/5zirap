import {
  BadRequestException,
  NotFoundException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateRecommentDto } from './dtos/create-recomment.dto';
import { UpdateRecommentDto } from './dtos/update-recomment.dto';

import { User } from 'src/users/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { COMMENT_MESSAGE } from 'src/constants/comment-message.constant';

@Injectable()
export class RecommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  /** 대댓글 생성(C) API **/
  async createRecomment(
    commentId: number,
    user: User,
    createRecommentDto: CreateRecommentDto,
  ) {
    // 1. 해당 댓글이 존재하는지 확인 ( parentId = NULL 이여야 댓글 )
    const findComment = await this.commentRepository.findOne({
      where: { commentId, parentId: IsNull() },
    });

    if (!findComment) {
      throw new BadRequestException('댓글이 존재하지 않습니다.');
    }

    // 2. 대댓글 저장
    const newRecomment = await this.commentRepository.save({
      parentId: commentId, // 부모댓글 id
      postId: findComment.postId, // 부모댓글이 달려있는 게시글 id
      userId: user.userId, // 대댓글을 쓴 사람 id
      content: createRecommentDto.content, // 대댓글 내용
    });

    // // 3. 댓글 작성 포인트 지급
    // const isValidPoint = await this.pointService.validatePointLog(
    //   user.id,
    //   PointType.COMMENT
    // );
    // if (isValidPoint)
    //   this.pointService.savePointLog(user.id, PointType.COMMENT, true);

    // // 4. 알람을 줄 것인가 여부
    // // 부모댓글을 쓴 사람이 사용자인지 확인
    // if (user.id !== findComment.userId) {
    //   await this.alarmService.createAlarm(
    //     findComment.userId, // 부모댓글을 쓴 사용자 id
    //     AlarmFromType.COMMENT, // 유형은 COMMENT
    //     newRecomment.parentId // 어떤 댓글에(commentId) 새로운 대댓글이 달렸는지
    //   );
    // }

    return newRecomment;
  }

  /** 대댓글 목록 조회(R-A) API **/
  async findAllRecomments(commentId: number) {
    // 1. commentId로 대댓글을 확인
    const recomments = await this.commentRepository.find({
      where: { parentId: commentId },
      relations: ['user', 'commentLikes', 'commentDislikes'],
      select: {
        user: {
          nickname: true,
        },
      },
    });

    // 2. 응답 형태 수정 및 반환
    return recomments.map((recomment) => ({
      commentId: recomment.commentId,
      parentId: recomment.parentId,
      content: recomment.content,
      userId: recomment.userId,
      nickname: recomment.user?.nickname,
      postId: recomment.postId,
      createdAt: recomment.createdAt,
      updateAt: recomment.updateAt,
      likes: recomment.commentLikes.length,
      dislikes: recomment.commentDislikes.length,
    }));
  }

  /** 대댓글 수정(U) API **/
  async updateRecomment(
    user: User,
    commentId: number,
    recommentId: number,
    updateRecommentDto: UpdateRecommentDto,
  ) {
    // 1. 대댓글이 존재하는지 확인
    const recomment = await this.commentRepository.findOneBy({
      commentId: recommentId,
    });
    if (!recomment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    }
    // 2. 작성자 본인인지 확인
    const userId = user.userId;
    if (recomment.userId !== userId) {
      throw new ForbiddenException(
        COMMENT_MESSAGE.COMMENT.UPDATE.FAILURE.FORBIDDEN,
      );
    }
    // 3. 대댓글 수정
    const updateRecomment = await this.commentRepository.update(
      { commentId: recommentId },
      { content: updateRecommentDto.content },
    );
    // 4. 반환
    return updateRecomment;
  }

  /** 대댓글 삭제(D) API **/
  async deleteRecomment(user: User, commentId: number, recommentId: number) {
    // 1. 대댓글이 존재하는지 확인
    const recomment = await this.commentRepository.findOneBy({
      commentId: recommentId,
    });
    if (!recomment) {
      throw new NotFoundException(COMMENT_MESSAGE.COMMENT.NOT_FOUND);
    }
    // 2. 작성자 본인인지 확인
    const userId = user.userId;
    if (recomment.userId !== userId) {
      throw new ForbiddenException(
        COMMENT_MESSAGE.COMMENT.DELETE.FAILURE.FORBIDDEN,
      );
    }
    // 3. 댓글 삭제 : '삭제된 댓글입니다.' 내용만 바꿈
    await this.commentRepository.save({
      commentId: recommentId,
      content: '삭제된 댓글입니다.',
    });

    // // 댓글 삭제로 포인트 차감
    // this.pointService.savePointLog(userId, PointType.POST, false);

    return recomment;
  }
}
