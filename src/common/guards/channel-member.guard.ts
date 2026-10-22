import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChannelMembersRepository } from '../../modules/channels/repositories/channel-members.repository';
import { CHANNELS_ERROR_CODES } from '../../modules/channels/channels.types';
import { AppException } from '../exceptions/app.exception';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  constructor(
    private readonly channelMembersRepository: ChannelMembersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser; channelMember?: unknown }>();

    const user = request.user as AuthUser;
    const rawChannelId = request.params['channelId'];
    const channelId = Array.isArray(rawChannelId)
      ? rawChannelId[0]
      : rawChannelId;

    if (!channelId) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel ID is missing from the request',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const member = await this.channelMembersRepository.findByChannelAndUserRaw(
      channelId,
      user.id,
    );

    if (!member) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'You are not a member of this channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    request['channelMember'] = member;
    return true;
  }
}
