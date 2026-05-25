import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
  // Plugins VOR NestJS-Initialisierung am Adapter registrieren,
  // damit Fastify den Content-Type-Parser kennt bevor Routen aufgebaut werden
  const adapter = new FastifyAdapter({ logger: true });
  await adapter.getInstance().register(fastifyCookie);
  await adapter.getInstance().register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 5,
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  app.enableCors({
    // Bare-Domain klopilot.ch + alle Subdomains + localhost für Dev
    origin: [
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
      /^https?:\/\/([\w-]+\.)?klopilot\.ch$/,
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('klopilot.ch API')
    .setDescription(
      'Community-Plattform für Toilettenbewertungen.\n\n' +
        '**Public API (v1):** Endpunkte unter `/v1/` benötigen einen `X-Api-Key`-Header.\n' +
        'Key erstellen: `POST /api-keys` (JWT-Auth erforderlich).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth('klo_refresh')
    .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'X-Api-Key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // OpenAPI-Spec als JSON exportieren
  const { writeFileSync, mkdirSync } = await import('fs');
  const { join } = await import('path');
  const docsDir = join(process.cwd(), '..', '..', 'docs', 'api');
  try {
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'openapi.json'), JSON.stringify(document, null, 2));
  } catch {
    // Im Production-Build kein Schreibrecht — ignorieren
  }

  const port = process.env.API_PORT ?? 3101;
  await app.listen(port, '0.0.0.0');
  console.log(`API läuft auf http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
