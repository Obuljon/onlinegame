import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { gamedb } from 'src/auth/dtos/socketdtos';

@Injectable()
export class GameService implements OnModuleInit {
  private redisClient: Redis;
  private logger: Logger = new Logger('Redis');
  async onModuleInit() {
    this.redisClient = new Redis();
    try {
      const result = await this.redisClient.ping();
      if (result === 'PONG') {
        this.logger.log(`Successfully connected to Redis`);
      } else {
        console.log('Failed to connect to Redis');
      }
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  async getData(name: string): Promise<gamedb | null> {
    const value = await this.redisClient
      .get(name)
      .then((v) => v)
      .catch((err) => null);
    return JSON.parse(value);
  }

  async postData(createDataDto: gamedb) {
    const { gamerx, gamer0, name, background } = createDataDto;
    await this.redisClient
      .set(name, JSON.stringify({ gamer0, gamerx, background }))
      .catch((err) => null); //  ? Set data in the cache
  }

  async deleteData(data: string) {
    await this.redisClient.del(data); // ? Delete data from the cache
  }

  updateBoard(board: string, index: number, marker: string) {
    // Check if the marker is valid ('x' or '0')
    if (marker !== 'x' && marker !== '0') {
      return board;
    }

    // Check if the index is within bounds
    if (index < 0 || index >= board.length) {
      return board;
    }

    // Check if the position is available (*)
    if (board[index] !== '*') {
      return board;
    }

    // Update the board at the given index with the marker
    let updatedBoard =
      board.substring(0, index) + marker + board.substring(index + 1);

    return updatedBoard;
  }

  checkWinner(board) {
    // To'ldirilgan 3x3 matritsani tuzamiz
    const matrix = [
      [board[0], board[1], board[2]],
      [board[3], board[4], board[5]],
      [board[6], board[7], board[8]],
    ];

    // G'olib bo'lish uchun 3 ta qatorni tekshirish
    for (let i = 0; i < 3; i++) {
      // Gorizontal qatorlar
      if (matrix[i][0].charCodeAt(0) == 120 || matrix[i][0].charCodeAt(0) == 48)
        if (
          matrix[i][0] === matrix[i][1] &&
          matrix[i][1] === matrix[i][2] &&
          matrix[i][0] !== ''
        ) {
          return matrix[i][0];
        }
      // Vertikal qatorlar
      if (matrix[0][i].charCodeAt(0) == 120 || matrix[0][i].charCodeAt(0) == 48)
        if (
          matrix[0][i] === matrix[1][i] &&
          matrix[1][i] === matrix[2][i] &&
          matrix[0][i] !== ''
        ) {
          return matrix[0][i];
        }
    }

    // Diagonal qatorlar
    if (matrix[0][0].charCodeAt(0) == 120 || matrix[0][0].charCodeAt(0) == 48)
      if (
        matrix[0][0] === matrix[1][1] &&
        matrix[1][1] === matrix[2][2] &&
        matrix[0][0] !== ''
      ) {
        return matrix[0][0];
      }
    if (matrix[2][2].charCodeAt(0) == 120 || matrix[2][2].charCodeAt(0) == 48)
      if (
        matrix[0][2] === matrix[1][1] &&
        matrix[1][1] === matrix[2][0] &&
        matrix[0][2] !== ''
      ) {
        return matrix[0][2];
      }

    // Agar g'olib bo'lmasa
    return null;
  }
}
