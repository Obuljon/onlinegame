import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/models';
import { SignupDTO } from '../dtos';
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async addUser(body: SignupDTO): Promise<User | null> {
    const adduser = new this.userModel(body);
    return adduser.save().catch((err) => {
      console.log(err);
      return null;
    });
  }

  async findOneUser(email: string): Promise<User> {
    return this.userModel.findOne({ email }).catch((err) => null);
  }

  async findUsers(): Promise<User[] | []> {
    return this.userModel.find().catch((err) => []);
  }

  async findByIdUser(id: string): Promise<User | null> {
    return this.userModel.findById(id).catch((err) => null);
  }
}
