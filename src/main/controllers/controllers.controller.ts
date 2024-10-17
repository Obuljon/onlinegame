import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../middleware';

@Controller('api')
@UseGuards(AuthGuard)
export class ControllersController {
  @Get('authtest')
  authtest() {
    throw new HttpException('', HttpStatus.OK);
  }
}
