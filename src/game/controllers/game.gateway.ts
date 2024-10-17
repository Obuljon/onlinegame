import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from '../service/game.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { activeUsers, gamedb, userdata } from 'src/auth/dtos/socketdtos';
require('dotenv').config();

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_CONNECTION,
    credentials: true,
  },
})
@UseInterceptors(CacheInterceptor)
export class GameSocket
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly gameService: GameService) {}

  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('GameSocket');
  private users: Map<string, Socket> = new Map();
  private activeUsers: activeUsers[] = [];
  afterInit() {}

  handleConnection(client: Socket) {
    // this.logger.log(`Client connected: ${client.id}`);
    this.users.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    // this.logger.log(`Client disconnected: ${client.id}`);
    this.activeUsers = this.activeUsers.filter(
      (item) => item.userid != client.id,
    );
    this.users.delete(client.id);
  }

  // Sending data to separate rooms
  sendGameResult(victory: string, defeat: string, gameplaye: string) {
    // Sending "Game Over" data to room1
    this.server
      .to(defeat)
      .emit('game-over', { gameplaye, message: 'Game Over!' });

    // Sending "Winner" data to room2
    this.server
      .to(victory)
      .emit('winner', { gameplaye, message: 'You are the winner!' });
  }

  // o'yinchi oyinga kirish uchun so'rov yuboradi
  @SubscribeMessage('playe-game')
  playeGame(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    const rooms = Array.from(socket.rooms);
    // The first room (rooms[0]) is always the socket ID itself, so we start from index 1
    rooms.forEach((room, index) => {
      if (index > 0) {
        socket.leave(room); // Leave all rooms except the socket ID (index 0)
      }
    });
    const { username, email } = data;
    const userdata: userdata = {
      username,
      email,
      playe: true,
      placegame: '*',
      walkinggame: null,
    };

    socket.data = userdata;

    const defRoom = Array.from(socket.rooms)[0];

    // o'yin o'ynash uchun so'rov tashlaganda uni o'yinga qoshadi
    this.activeUsers.push({ userid: defRoom });

    // faqat 1 ta o'yinchi oyin o'ynashni hohlaganda unga kutish beriladi
    if (this.activeUsers.length <= 1) {
      return this.server
        .to(defRoom)
        .emit('player-wait', { message: 'player wait', gamestart: false });
    }

    // raqib topilganida unga o'inni boshlashni tahlif etiladi
    else {
      const gameroom = uuidv4();
      const [x, o] = this.activeUsers;
      const [playerXroom, playerOroom] = [x.userid, o.userid];

      // 2 - userni o'yin room ga qo'shilishi
      socket.join(gameroom);

      // 2 - userni o'yindagi dagi o'rni yabi 0 bo'ladi
      socket.data.placegame = '0';

      // 1 - userni oyin room da qo'shilishi
      this.users.get(playerXroom).join(gameroom);

      // 2 - userni o'yindagi dagi o'rni yabi 0 bo'ladi
      this.users.get(playerXroom).data.placegame = 'x';

      const createGame: gamedb = {
        walkinggame: 'x',
        gamerx: playerXroom,
        gamer0: playerOroom,
        name: gameroom,
        background: '*********',
      };
      // redisdb ga yangi o'yin yaratilshi kerak
      this.gameService.postData(createGame);

      this.activeUsers = this.activeUsers.filter(
        (item) =>
          item.userid !== socket.id &&
          item.userid !== this.users.get(playerXroom).id,
      );

      socket.data.playe = false;
      this.users.get(playerXroom).data.playe = false;

      this.server.to(playerOroom).emit('players-game', {
        walkinggame: 'x',
        gameposition: '0',
        message: 'players to the game',
        gamestart: false,
        myenemy: {
          email: this.users.get(playerXroom).data.email,
          username: this.users.get(playerXroom).data.username,
        },
        gameplaye: createGame.background,
      });

      this.server.to(playerXroom).emit('players-game', {
        walkinggame: 'x',
        gameposition: 'x',
        message: 'players to the game',
        gamestart: true,
        myenemy: {
          email: this.users.get(playerOroom).data.email,
          username: this.users.get(playerOroom).data.username,
        },
        gameplaye: createGame.background,
      });
    }
  }

  @SubscribeMessage('leave-game')
  leaveGame(@ConnectedSocket() socket: Socket) {
    // o'yin boshlanmasdan uni bekor qilish
    const userid = socket.id;
    this.activeUsers = this.activeUsers.filter(
      (item) => item.userid !== userid,
    );

    socket.data.playe = false;
    // qo'shimcha javoblar uchun code ****

    return;
  }

  @SubscribeMessage('live-game')
  async liveGame(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    // gemer ni o'yindagi o'rnini aniqlash x yoki 0 da o'ynashini aniqlash
    const { placegame, userId } = socket.data;

    // gamer ni o'in roomni aniqlash
    const roomgame = Array.from(socket.rooms)[1];

    // geamer ni room lari orasida 1 - index da hech qanday room bo'lmasa dastur tugaydi
    if (!roomgame) return;

    // redis dan o'yin malumotlarni olish
    let datagame: gamedb = await this.gameService.getData(roomgame);

    // redisdb dan malumot null qaytsa dastur to'htaydi
    if (!datagame) return;

    let { gamer0, name, gamerx, background }: any = datagame;

    // o'yinda yurish userda bo'lmasa
    if (socket.data.placegame === datagame.walkinggame) {
      return this.server
        .to(name)
        .emit('walking-not', { message: 'walking is not' });
    }

    background = this.gameService.updateBoard(
      background,
      Number(data),
      placegame,
    );

    if (!background.includes('*')) {
      this.server.to(roomgame).emit('drow', { gameplaye: background });
    }

    // g'olibni borligini tekshiradi
    const iswinner = this.gameService.checkWinner(background);
    if (iswinner) {
      this.users.get(gamer0).data.placegame = '*';
      this.users.get(gamer0).leave(roomgame);

      this.users.get(gamerx).data.placegame = '*';
      this.users.get(gamerx).leave(roomgame);

      this.gameService.deleteData(roomgame);

      return this.sendGameResult(
        iswinner == 'x' ? datagame.gamerx : datagame.gamer0,
        iswinner == '0' ? datagame.gamerx : datagame.gamer0,
        background,
      );
    }

    await this.gameService.postData({
      name: roomgame,
      background,
      gamer0,
      gamerx,
      walkinggame: placegame == 'x' ? '0' : 'x',
    });

    return this.server.to(roomgame).emit('live-game', {
      ...socket.data,
      background,
      walkinggame: placegame != 'x' ? 'x' : '0',
    });
  }

  @SubscribeMessage('game-over')
  async gameover(@ConnectedSocket() socket: Socket) {
    const roomgame = Array.from(socket.rooms)[1];
    const gameplaye = await this.gameService.getData(roomgame);
    if (gameplaye) {
      if (gameplaye.gamer0 == socket.id) {
        return this.sendGameResult(
          gameplaye.gamerx,
          gameplaye.gamer0,
          gameplaye.background,
        );
      } else {
        return this.sendGameResult(
          gameplaye.gamer0,
          gameplaye.gamerx,
          gameplaye.background,
        );
      }
    }
  }
}
