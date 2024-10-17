import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MainModule } from './main/main.module';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

require('dotenv').config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL),
    AuthModule,
    MainModule,
    GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
