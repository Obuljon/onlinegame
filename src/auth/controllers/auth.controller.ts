import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { SigninDTO, SignupDTO } from '../dtos';
import { AuthService } from '../services/auth.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Controller('api/auth/v1/')
export class AuthController {
  constructor(
    private authservice: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('signin')
  async signin(@Body() body: SigninDTO) {
    const { email, password } = body;
    const extant = await this.authservice.findOneUser(email);

    // ////////////////////////////////////////////////////////////////////
    // agar email orqali user topilmasa
    if (!extant) throw new NotFoundException(['error login or password']);
    //////////////////////////////////////////////////////////////////////////////

    const hashpassword = extant.password;
    const ismatch = await compare(password, hashpassword);

    ///////////////////////////////////////////////////////////////////////////
    // agar user ni paroli noto'gri bo'lsa
    if (!ismatch) throw new NotFoundException(['error login or password']);
    // /////////////////////////////////////////////////////////////////////////

    if (ismatch) {
      const payload = { sub: extant['_id'], username: email };
      const access_token = await this.jwtService.signAsync(payload);
      throw new HttpException(access_token, HttpStatus.CREATED);
    }

    throw new NotFoundException(['Not Found !!']);
  }

  @Post('signup')
  async signup(@Body() { email, password, username }: SignupDTO) {
    ////////////////////////////////////////////////////////////////////////
    // email mavjudligini tekshirish
    const extant = await this.authservice.findOneUser(email);
    if (extant) throw new BadRequestException(['Email is available !']);
    /////////////////////////////////////////////////////////////////////////////////

    const hashpassword = await hash(password, 10);
    const newuser = await this.authservice.addUser({
      email,
      username,
      password: hashpassword,
    });
    if (newuser)
      throw new HttpException('Record created successfully.', HttpStatus.OK);

    throw new BadRequestException(['Unable to create record.']);
  }
}
