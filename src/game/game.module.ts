import { Module } from '@nestjs/common';
import { GameSocket } from './controllers/game.gateway';
import { GameService } from './service/game.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ ttl: 60, max: 360 }),
  ],
  controllers: [],
  providers: [GameSocket, GameService],
})
export class GameModule {}
