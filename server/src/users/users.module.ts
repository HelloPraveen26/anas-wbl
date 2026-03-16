import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { HubService } from './hub.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HttpModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, HubService],
  exports: [UsersService, HubService],
})
export class UsersModule {}