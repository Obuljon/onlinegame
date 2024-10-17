import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

require('dotenv').config();

async function bootstrap() {
  const port = process.env.PORT || 4040;
  const logger: Logger = new Logger('Listen');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(port, () => logger.log(`server in run port:${port}`));
}
bootstrap();
