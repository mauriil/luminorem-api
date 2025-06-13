import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { CustomLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Usar el logger personalizado
  const customLogger = app.get(CustomLoggerService);
  app.useLogger(customLogger);

  // Configurar servicio de archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Spiritual Guides API')
    .setDescription('API for creating and managing spiritual guides')
    .setVersion('1.0')
    .addTag('spiritual-guides')
    .addTag('users')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  customLogger.startupMessage(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  customLogger.startupMessage(`Swagger documentation: http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap(); 