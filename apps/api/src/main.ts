import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  await app.register(fastifyCookie);

  app.enableCors({
    origin: [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /\.klopilot\.ch$/],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('klopilot.ch API')
    .setDescription('Community-Plattform für Toilettenbewertungen')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth('klo_refresh')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 3101;
  await app.listen(port, '0.0.0.0');
  console.log(`API läuft auf http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
