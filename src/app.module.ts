import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { configModuleValidationSchema } from './configs/env-validation.config';
import { typeOrmModuleOptions } from './configs/database.config';

import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { PointModule } from './point/point.module';

import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { RecommentModule } from './recomment/recomment.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'front', 'html'), // public 폴더를 정적 파일의 루트로 설정
        serveRoot: '/', // 기본 URL 경로를 '/'로 설정
      },
      {
        rootPath: join(__dirname, '..', 'front'), // public 폴더를 정적 파일의 루트로 설정
        serveRoot: '/static', // 기본 URL 경로를 '/'로 설정
      },
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configModuleValidationSchema,
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    RedisModule,
    AuthModule,
    UserModule,
    PointModule,
    PostModule,
    CommentModule,
    RecommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
