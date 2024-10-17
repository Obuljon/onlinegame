import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ControllersController } from './controllers/controllers.controller';
import { ServicesService } from './services/services.service';
import { AuthGuard } from 'src/middleware/auth/authguard.middleware';

@Module({
  controllers: [ControllersController],
  providers: [ServicesService],
})
export class MainModule {}
