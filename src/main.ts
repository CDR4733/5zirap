import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');

  // 모든 엔드포인트 앞에 '/api' 붙이기
  // app.setGlobalPrefix('api');

  // Validation Pipe 적용하기
  app.useGlobalPipes(
    new ValidationPipe({
      // transform: 자동으로 타입 변경
      transform: true,
      // whitelist: Validator가 검사대상자의 '데코레이터가 없는 프로퍼티'를 모두 제거
      whitelist: true,
      // forbidNonWhitelisted: 위 설정이 프로퍼티를 제거하면서 에러를 던지도록 설정
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 적용하기
  const config = new DocumentBuilder()
    .setTitle('5zirap')
    .setDescription('5zirap Refactoring')
    .setVersion('1.0')
    .addTag('NestJS')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Swagger 새로고침 해도 JWT 유지
      tagsSorter: 'alpha', // API 그룹(태그) 정렬을 알파벳 순으로
      operationsSorter: 'summary', // API 그룹 내 정렬을 summary 이름 순으로
    },
  });

  await app.listen(port);
}
bootstrap();
