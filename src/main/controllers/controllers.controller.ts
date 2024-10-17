import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../middleware';
import { Response } from 'express';

@Controller('api')
@UseGuards(AuthGuard)
export class ControllersController {
  @Get('authtest')
  authtest() {
    throw new HttpException('', HttpStatus.OK);
  }

  @Get('myname')
  myname(@Req() req: Request) {
    const userdata = req['user'];
    throw new HttpException(userdata, HttpStatus.OK);
  }
}
