import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Server, Socket } from 'socket.io';
import { authConfig } from '../../config/auth.config';
import { AppException } from '../../common/exceptions/app.exception';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ChannelsRepository } from '../channels/repositories/channels.repository';
import { ChannelMembersRepository } from '../channels/repositories/channel-members.repository';
import { WorkspaceMembersRepository } from '../workspaces/repositories/workspace-members.repository';
import { MESSAGES_ERROR_CODES } from './messages.types';
import { ChannelRoomActionDto } from './mobile/dto/channel-room-action.dto';
import type { MessageResponseDto } from './mobile/dto/message-response.dto';
import { WorkspaceRoomActionDto } from './mobile/dto/workspace-room-action.dto';

type AccessTokenPayload = {
  sub: string;
  email: string;
  username: string;
  role: AuthUser['role'];
  sessionId: string;
  type: 'access';
};

type RealtimeSocket = Socket & {
  data: {
    user?: AuthUser;
  };
};

type TypingPayload = {
  workspaceId: string;
  channelId: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
};

@Injectable()
@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway
  implements
    OnGatewayConnection<RealtimeSocket>,
    OnGatewayDisconnect<RealtimeSocket>
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly channelsRepository: ChannelsRepository,
    private readonly channelMembersRepository: ChannelMembersRepository,
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
  ) {}

  @SubscribeMessage('workspace.join')
  async handleJoinWorkspace(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: WorkspaceRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, WorkspaceRoomActionDto);
    const user = this.ensureSocketUser(client);
    await this.assertWorkspaceMembership(user.id, dto.workspaceId);

    await client.join(this.workspaceRoom(dto.workspaceId, user.id));

    return {
      joined: true,
      room: this.workspaceRoom(dto.workspaceId, user.id),
      workspaceId: dto.workspaceId,
    };
  }

  @SubscribeMessage('workspace.leave')
  async handleLeaveWorkspace(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: WorkspaceRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, WorkspaceRoomActionDto);
    const user = this.ensureSocketUser(client);
    await this.assertWorkspaceMembership(user.id, dto.workspaceId);

    await client.leave(this.workspaceRoom(dto.workspaceId, user.id));

    return {
      joined: false,
      room: this.workspaceRoom(dto.workspaceId, user.id),
      workspaceId: dto.workspaceId,
    };
  }

  async handleConnection(client: RealtimeSocket) {
    try {
      client.data.user = await this.authenticateClient(client);
    } catch (error) {
      this.logger.warn(
        `WebSocket connection rejected: ${error instanceof Error ? error.message : 'Unauthorized'}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket) {
    const userId = client.data.user?.id;

    if (userId) {
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        if (key.endsWith(`:${userId}`)) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(key);
        }
      }
      this.logger.debug(`WebSocket disconnected for user ${userId}`);
    }
  }

  @SubscribeMessage('channel.join')
  async handleJoinChannel(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ChannelRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, ChannelRoomActionDto);
    const user = this.ensureSocketUser(client);
    await this.assertChannelMembership(user.id, dto.workspaceId, dto.channelId);

    await client.join(this.channelRoom(dto.channelId));

    return {
      channelId: dto.channelId,
      joined: true,
      room: this.channelRoom(dto.channelId),
      workspaceId: dto.workspaceId,
    };
  }

  @SubscribeMessage('channel.leave')
  async handleLeaveChannel(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ChannelRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, ChannelRoomActionDto);
    const user = this.ensureSocketUser(client);
    await this.assertChannelMembership(user.id, dto.workspaceId, dto.channelId);

    await client.leave(this.channelRoom(dto.channelId));

    return {
      channelId: dto.channelId,
      joined: false,
      room: this.channelRoom(dto.channelId),
      workspaceId: dto.workspaceId,
    };
  }

  @SubscribeMessage('typing.start')
  async handleTypingStart(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ChannelRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, ChannelRoomActionDto);
    const user = this.ensureSocketUser(client);
    const membership = await this.assertChannelMembership(
      user.id,
      dto.workspaceId,
      dto.channelId,
    );
    const typingPayload = this.buildTypingPayload(
      dto.workspaceId,
      dto.channelId,
      {
        id: user.id,
        username: membership.user.username,
        avatarUrl: membership.user.avatarUrl,
      },
    );

    this.clearTypingTimeout(dto.channelId, user.id);

    client
      .to(this.channelRoom(dto.channelId))
      .emit('typing.start', typingPayload);

    const timeout = setTimeout(() => {
      this.server
        .to(this.channelRoom(dto.channelId))
        .emit('typing.stop', typingPayload);
      this.typingTimeouts.delete(this.typingKey(dto.channelId, user.id));
    }, 4000);

    this.typingTimeouts.set(this.typingKey(dto.channelId, user.id), timeout);

    return { ok: true };
  }

  @SubscribeMessage('typing.stop')
  async handleTypingStop(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ChannelRoomActionDto,
  ) {
    const dto = this.validatePayload(payload, ChannelRoomActionDto);
    const user = this.ensureSocketUser(client);
    const membership = await this.assertChannelMembership(
      user.id,
      dto.workspaceId,
      dto.channelId,
    );

    this.clearTypingTimeout(dto.channelId, user.id);

    client.to(this.channelRoom(dto.channelId)).emit(
      'typing.stop',
      this.buildTypingPayload(dto.workspaceId, dto.channelId, {
        id: user.id,
        username: membership.user.username,
        avatarUrl: membership.user.avatarUrl,
      }),
    );

    return { ok: true };
  }

  emitMessageCreated(
    workspaceId: string,
    channelId: string,
    message: MessageResponseDto,
  ) {
    this.server.to(this.channelRoom(channelId)).emit('message.created', {
      channelId,
      message,
      workspaceId,
    });
  }

  emitMessageUpdated(
    workspaceId: string,
    channelId: string,
    message: MessageResponseDto,
  ) {
    this.server.to(this.channelRoom(channelId)).emit('message.updated', {
      channelId,
      message,
      workspaceId,
    });
  }

  emitMessageDeleted(
    workspaceId: string,
    channelId: string,
    messageId: string,
  ) {
    this.server.to(this.channelRoom(channelId)).emit('message.deleted', {
      channelId,
      messageId,
      workspaceId,
    });
  }

  emitChannelMetaUpdated(
    userId: string,
    payload: {
      workspaceId: string;
      channelId: string;
      unreadCount: number;
      lastReadAt: Date | null;
      lastMessageAt: Date | null;
      lastMessage: {
        id: string;
        content: string;
        senderId: string;
        createdAt: Date;
      } | null;
    },
  ) {
    this.server
      .to(this.workspaceRoom(payload.workspaceId, userId))
      .emit('channel.meta.updated', payload);
  }

  emitTypingStop(
    workspaceId: string,
    channelId: string,
    user: { id: string; username: string; avatarUrl?: string | null },
  ) {
    this.clearTypingTimeout(channelId, user.id);
    this.server.to(this.channelRoom(channelId)).emit('typing.stop', {
      workspaceId,
      channelId,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
    });
  }

  private async authenticateClient(client: RealtimeSocket): Promise<AuthUser> {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Access token is missing');
    }

    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: authConfig.jwtSecret,
      },
    );

    if (payload.type !== 'access') {
      throw new WsException('Invalid access token');
    }

    return {
      id: payload.sub,
      currentWorkspaceId: null,
      email: payload.email,
      sessionId: payload.sessionId,
      username: payload.username,
      role: payload.role,
    };
  }

  private extractToken(client: RealtimeSocket) {
    const authToken = client.handshake.auth?.['token'];

    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.startsWith('Bearer ')
        ? authToken.slice('Bearer '.length)
        : authToken;
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      const [type, token] = authorization.split(' ');

      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return undefined;
  }

  private channelRoom(channelId: string) {
    return `channel:${channelId}`;
  }

  private typingKey(channelId: string, userId: string) {
    return `${channelId}:${userId}`;
  }

  private workspaceRoom(workspaceId: string, userId: string) {
    return `workspace:${workspaceId}:user:${userId}`;
  }

  private clearTypingTimeout(channelId: string, userId: string) {
    const key = this.typingKey(channelId, userId);
    const timeout = this.typingTimeouts.get(key);

    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }
  }

  private buildTypingPayload(
    workspaceId: string,
    channelId: string,
    user: { id: string; username: string; avatarUrl?: string | null },
  ): TypingPayload {
    return {
      workspaceId,
      channelId,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  private ensureSocketUser(client: RealtimeSocket) {
    const user = client.data.user;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    return user;
  }

  private validatePayload<T extends object>(
    payload: unknown,
    dtoClass: new () => T,
  ) {
    const dto = plainToInstance(dtoClass, payload);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .filter(Boolean);

      throw new WsException(messages[0] ?? 'Invalid payload');
    }

    return dto;
  }

  private async assertWorkspaceMembership(userId: string, workspaceId: string) {
    const membership =
      await this.workspaceMembersRepository.findByWorkspaceAndUserRaw(
        workspaceId,
        userId,
      );

    if (!membership || !membership.isActive) {
      throw new WsException(
        new AppException(
          MESSAGES_ERROR_CODES.CHANNEL_NOT_FOUND,
          'You are not an active member of this workspace',
          { status: HttpStatus.FORBIDDEN },
        ).message,
      );
    }
  }

  private async assertChannelMembership(
    userId: string,
    workspaceId: string,
    channelId: string,
  ) {
    const channel = await this.channelsRepository.findById(channelId);

    if (!channel || channel.workspaceId !== workspaceId) {
      throw new WsException(
        new AppException(
          MESSAGES_ERROR_CODES.CHANNEL_NOT_FOUND,
          'Channel not found',
          { status: HttpStatus.NOT_FOUND },
        ).message,
      );
    }

    const membership = await this.channelMembersRepository.findByChannelAndUser(
      channelId,
      userId,
    );

    if (!membership) {
      throw new WsException(
        new AppException(
          MESSAGES_ERROR_CODES.CHANNEL_NOT_FOUND,
          'You are not a member of this channel',
          { status: HttpStatus.FORBIDDEN },
        ).message,
      );
    }

    return membership;
  }
}
