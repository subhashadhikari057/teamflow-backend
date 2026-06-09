# AGENT.md — Teamflow Backend Architecture & Coding Standards

> This file is the single source of truth for how the backend is structured,
> written, and maintained. Every module, every file, every line of code must
> follow these rules without exception.

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Project Structure](#2-project-structure)
3. [Module Structure](#3-module-structure)
4. [API Surface — Admin, Mobile, Auth](#4-api-surface--admin-mobile-auth)
5. [DTO Rules](#5-dto-rules)
6. [Controller Rules](#6-controller-rules)
7. [Service Rules](#7-service-rules)
8. [Repository / Database Rules](#8-repository--database-rules)
9. [Swagger Documentation Rules](#9-swagger-documentation-rules)
10. [Validation Rules](#10-validation-rules)
11. [Error Handling Rules](#11-error-handling-rules)
12. [Guard & Auth Rules](#12-guard--auth-rules)
13. [Response Shape](#13-response-shape)
14. [Naming Conventions](#14-naming-conventions)
15. [What Belongs Where — Quick Reference](#15-what-belongs-where--quick-reference)

---

## 1. Core Principles

### SOLID

**S — Single Responsibility**
Every class does one thing and one thing only.
- Controller handles HTTP only
- Service handles business logic only
- Repository handles database only
- DTO handles data shape and validation only

**O — Open/Closed**
Classes are open for extension, closed for modification.
- Extend behavior via composition, not by editing existing classes
- Use NestJS providers and injection over direct instantiation

**L — Liskov Substitution**
Subtypes must be substitutable for their base types.
- Always code against interfaces, not concrete implementations
- Infrastructure services (email, storage, push) must implement interfaces

**I — Interface Segregation**
No class should be forced to implement methods it does not use.
- Split large interfaces into smaller focused ones
- A `UserService` should not implement `BillingService` methods

**D — Dependency Inversion**
Depend on abstractions, not concretions.
- Always inject dependencies via NestJS DI
- Never instantiate services with `new` inside other services
- Infrastructure implementations are injected, not imported directly

---

### Additional Rules

- **No business logic in controllers** — ever
- **No database calls in controllers** — ever
- **No raw Prisma calls in services** — use a repository layer
- **Everything passes through a DTO** — no raw `body`, `query`, or `param` without a typed DTO
- **Every API must have request and response DTOs** — no endpoint without typed request DTOs and typed response DTOs
- **No `any` type** — TypeScript strict mode is on, use it
- **No silent failures** — every error must be thrown as a typed exception

---

## 2. Project Structure

```
src/
│
├── modules/                          # Feature modules (business logic lives here)
│   ├── auth/
│   ├── users/
│   ├── workspaces/
│   ├── channels/
│   ├── messages/
│   ├── files/
│   ├── search/
│   ├── notifications/
│   ├── presence/
│   ├── calls/
│   └── billing/
│
├── infrastructure/                   # Technical services (no business logic)
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── migrations/
│   │   └── seeds/
│   ├── redis/
│   │   └── redis.service.ts
│   ├── queue/
│   │   ├── queue.module.ts
│   │   └── base.processor.ts
│   ├── websocket/
│   │   └── websocket.gateway.ts
│   ├── storage/
│   │   ├── storage.interface.ts
│   │   └── s3.service.ts
│   ├── email/
│   │   ├── email.interface.ts
│   │   └── resend.service.ts
│   └── push/
│       └── push.service.ts
│
├── common/                           # Shared code (no business logic, no DB calls)
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── dto/
│   └── utils/
│
└── config/                           # Environment config and validation
    ├── app.config.ts
    ├── database.config.ts
    ├── jwt.config.ts
    ├── redis.config.ts
    └── config.validation.ts
```

---

## 3. Module Structure

Every feature module follows this exact structure:

```
src/modules/<module-name>/
│
├── <module-name>.module.ts           # NestJS module definition
│
├── admin/                            # Admin API (/api/admin/...)
│   ├── admin-<module-name>.controller.ts
│   ├── admin-<module-name>.service.ts
│   └── dto/
│       ├── admin-create-<entity>.dto.ts
│       ├── admin-update-<entity>.dto.ts
│       └── admin-<entity>-response.dto.ts
│
├── mobile/                           # Mobile API (/api/mobile/...)
│   ├── mobile-<module-name>.controller.ts
│   ├── mobile-<module-name>.service.ts
│   └── dto/
│       ├── mobile-<entity>-response.dto.ts
│       └── mobile-query-<entity>.dto.ts
│
├── repositories/                     # Database access layer
│   └── <module-name>.repository.ts
│
├── interfaces/                       # TypeScript interfaces and types
│   └── <module-name>.interface.ts
│
└── <module-name>.types.ts            # Enums and shared types for this module
```

### Real Example — Messages Module

```
src/modules/messages/
├── messages.module.ts
├── admin/
│   ├── admin-messages.controller.ts
│   ├── admin-messages.service.ts
│   └── dto/
│       ├── admin-message-response.dto.ts
│       └── admin-message-query.dto.ts
├── mobile/
│   ├── mobile-messages.controller.ts
│   ├── mobile-messages.service.ts
│   └── dto/
│       └── mobile-message-response.dto.ts
├── repositories/
│   └── messages.repository.ts
├── interfaces/
│   └── messages.interface.ts
└── messages.types.ts
```

---

## 4. API Surface — Admin, Mobile, Auth

### Route Prefixes

| Surface | Prefix | Guard |
|---|---|---|
| Admin | `/api/admin/` | `JwtAuthGuard` + `AdminGuard` |
| Mobile | `/api/mobile/` | `JwtAuthGuard` + `MobileGuard` |
| Auth (shared) | `/api/auth/` | Varies by endpoint |

### Controller Prefix Convention

```typescript
// Admin controller
@Controller('api/admin/messages')

// Mobile controller
@Controller('api/mobile/messages')

// Shared auth controller
@Controller('api/auth')
```

### Why Separate Controllers Per Surface?

- Each surface has different auth guards
- Admin responses often expose extra fields (internal IDs, audit info)
- Mobile responses are slimmer (optimized for bandwidth)
- Each surface can evolve independently without breaking others
- Swagger docs are cleanly separated per surface

---

## 5. DTO Rules

### Absolute Rules

- **Every request body must be a DTO class** — never use plain objects
- **Every query param must be a DTO class** — use `@Query() dto: QueryDto`
- **Every route param must be a DTO class** — use `@Param() dto: ParamDto`
- **Every response must be typed with a response DTO** — no raw Prisma models returned
- **DTOs live inside their surface folder** — `web/dto/`, `admin/dto/`, `mobile/dto/`
- **Shared DTOs** (used across surfaces) live in `common/dto/`

### DTO File Structure

```typescript
// send-message.dto.ts
import { IsString, IsUUID, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The channel to send the message to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  channelId: string;

  @ApiProperty({
    description: 'Message content (markdown supported)',
    example: 'Hello team! 👋',
    minLength: 1,
    maxLength: 40000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40000)
  content: string;

  @ApiPropertyOptional({
    description: 'Thread ID if this is a reply',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  threadId?: string;
}
```

### Response DTO — Never return raw Prisma models

```typescript
// message-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class MessageAuthorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Ashim Shrestha' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.teamflow.com/avatars/ashim.jpg' })
  @Expose()
  avatarUrl?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Hello team! 👋' })
  @Expose()
  content: string;

  @ApiProperty({ type: MessageAuthorDto })
  @Expose()
  @Type(() => MessageAuthorDto)
  author: MessageAuthorDto;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:35:00Z' })
  @Expose()
  editedAt?: Date;
}
```

### Query DTO — Pagination

```typescript
// message-query.dto.ts
import { IsOptional, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MessageQueryDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination (last message ID)', })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of messages to return', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Filter messages before this date' })
  @IsOptional()
  @IsDateString()
  before?: string;
}
```

---

## 6. Controller Rules

### What Controllers Are Allowed To Do

- Define routes (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`)
- Apply guards (`@UseGuards`)
- Apply decorators (`@CurrentUser`, `@Roles`)
- Extract request data via DTOs (`@Body`, `@Query`, `@Param`)
- Call **one** service method per endpoint
- Return the service result
- Apply Swagger decorators (`@ApiOperation`, `@ApiResponse`)

### What Controllers Are NEVER Allowed To Do

- Write business logic
- Call the database directly
- Call Prisma directly
- Call repositories directly
- Perform conditional logic beyond route handling
- Transform data (that belongs in service or interceptor)
- Call multiple services in one endpoint handler

### Controller Template

```typescript
// messages.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MessageIdParamDto } from '@common/dto/params/message-id-param.dto';
import { AuthUser } from '@common/interfaces/auth-user.interface';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Not a member of this channel' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendMessage(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages in a channel (cursor paginated)' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Query() query: MessageQueryDto,
  ): Promise<MessageResponseDto[]> {
    return this.messagesService.getMessages(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'Cannot edit another user\'s message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async updateMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.updateMessage(user.id, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete another user\'s message' })
  async deleteMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
  ): Promise<void> {
    return this.messagesService.deleteMessage(user.id, params.id);
  }
}
```

---

## 7. Service Rules

### What Services Are Allowed To Do

- Implement all business logic
- Call repositories for database operations
- Call infrastructure services (email, storage, push, queue)
- Throw typed HTTP exceptions
- Transform data from repository layer to response DTOs
- Coordinate between multiple repositories if needed

### What Services Are NEVER Allowed To Do

- Call Prisma directly (use repositories)
- Handle HTTP concerns (`Request`, `Response` objects)
- Know about controllers or HTTP layer
- Call another surface's service directly (e.g., admin service calling web service)

### Service Template

```typescript
// messages.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from '../repositories/messages.repository';
import { ChannelsRepository } from '@modules/channels/repositories/channels.repository';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly channelsRepository: ChannelsRepository,
  ) {}

  async sendMessage(userId: string, dto: SendMessageDto): Promise<MessageResponseDto> {
    // 1. Validate business rules
    const isMember = await this.channelsRepository.isMember(userId, dto.channelId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    // 2. Execute operation via repository
    const message = await this.messagesRepository.create({
      userId,
      channelId: dto.channelId,
      content: dto.content,
      threadId: dto.threadId ?? null,
    });

    // 3. Return typed response DTO
    return plainToInstance(MessageResponseDto, message, {
      excludeExtraneousValues: true,
    });
  }

  async getMessages(userId: string, query: MessageQueryDto): Promise<MessageResponseDto[]> {
    const messages = await this.messagesRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      before: query.before,
      userId,
    });

    return plainToInstance(MessageResponseDto, messages, {
      excludeExtraneousValues: true,
    });
  }

  async updateMessage(userId: string, messageId: string, dto: UpdateMessageDto): Promise<MessageResponseDto> {
    const message = await this.messagesRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You cannot edit another user\'s message');
    }

    const updated = await this.messagesRepository.update(messageId, {
      content: dto.content,
      editedAt: new Date(),
    });

    return plainToInstance(MessageResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messagesRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You cannot delete another user\'s message');
    }

    await this.messagesRepository.softDelete(messageId);
  }
}
```

---

## 8. Repository / Database Rules

### What Repositories Are Allowed To Do

- Execute all Prisma queries
- Map raw Prisma results to domain objects
- Handle database-level errors
- Implement pagination logic

### What Repositories Are NEVER Allowed To Do

- Contain business logic
- Throw HTTP exceptions (throw domain-level errors only)
- Know about DTOs
- Know about HTTP layer

### Repository Template

```typescript
// messages.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Message, Prisma } from '@prisma/client';

interface CreateMessageInput {
  userId: string;
  channelId: string;
  content: string;
  threadId: string | null;
}

interface FindManyInput {
  cursor?: string;
  limit: number;
  before?: string;
  userId: string;
}

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateMessageInput): Promise<Message> {
    return this.prisma.message.create({
      data: {
        userId: input.userId,
        channelId: input.channelId,
        content: input.content,
        threadId: input.threadId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id, deletedAt: null },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async findMany(input: FindManyInput): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        deletedAt: null,
        ...(input.before && { createdAt: { lt: new Date(input.before) } }),
      },
      take: input.limit,
      ...(input.cursor && {
        cursor: { id: input.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

---

## 9. Swagger Documentation Rules

### Every Controller Must Have

- `@ApiTags('ModuleName')` on the class
- `@ApiBearerAuth()` on the class if auth required
- `@ApiOperation({ summary: '...' })` on every endpoint
- `@ApiResponse` for every possible status code (200, 201, 400, 401, 403, 404)
- Response type defined: `@ApiResponse({ status: 200, type: ResponseDto })`

### Every DTO Must Have

- `@ApiProperty()` on every required field
- `@ApiPropertyOptional()` on every optional field
- `description` on every property
- `example` on every property

### Swagger Tags By Surface

```typescript
// Admin
@ApiTags('Admin — Messages')

// Mobile
@ApiTags('Mobile — Messages')

// Shared auth
@ApiTags('Auth')
```

### Swagger Setup in main.ts

```typescript
const config = new DocumentBuilder()
  .setTitle('Teamflow API')
  .setDescription('Teamflow backend API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Auth')
  .addTag('Admin — Users')
  .addTag('Admin — Workspaces')
  .addTag('Mobile — Messages')
  .build();
```

---

## 10. Validation Rules

### Always Use class-validator Decorators

```typescript
// Strings
@IsString()
@MinLength(1)
@MaxLength(255)

// Numbers
@IsInt()
@Min(1)
@Max(100)

// UUIDs
@IsUUID()

// Email
@IsEmail()

// Enums
@IsEnum(MessageType)

// Optional fields
@IsOptional()
// ^ Must always be first decorator on optional fields

// Arrays
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(50)

// Nested objects
@ValidateNested()
@Type(() => NestedDto)

// Numbers from query strings (always transform)
@Type(() => Number)
@IsInt()
```

### Global Validation Pipe Setup

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,          // Strip unknown properties
    forbidNonWhitelisted: true, // Throw on unknown properties
    transform: true,          // Auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

## 11. Error Handling Rules

### Always Use NestJS Built-in Exceptions

```typescript
throw new BadRequestException('Invalid workspace slug');
throw new UnauthorizedException('Token expired');
throw new ForbiddenException('Insufficient permissions');
throw new NotFoundException('Channel not found');
throw new ConflictException('Email already registered');
throw new UnprocessableEntityException('Cannot delete last workspace owner');
throw new InternalServerErrorException('Something went wrong');
```

### Global Exception Filter

All errors are caught by a global filter that returns:

```json
{
  "success": false,
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Channel not found",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/channels/abc"
}
```

### Never

- Swallow errors silently (`catch(e) {}`)
- Expose stack traces in production
- Return raw Prisma errors to the client
- Use generic `Error` — always use typed NestJS exceptions

---

## 12. Guard & Auth Rules

### Guards Available

| Guard | Purpose | Applied At |
|---|---|---|
| `JwtAuthGuard` | Validates JWT, attaches user | All authenticated routes |
| `AdminGuard` | Checks user has ADMIN role | All `/api/admin/` routes |
| `MobileGuard` | Validates mobile-specific headers | All `/api/mobile/` routes |
| `WorkspaceMemberGuard` | Checks workspace membership | Workspace-scoped routes |
| `ChannelMemberGuard` | Checks channel membership | Channel-scoped routes |

### CurrentUser Decorator

```typescript
// Usage in controller
@Get('profile')
getProfile(@CurrentUser() user: AuthUser) {
  return this.usersService.getProfile(user.id);
}

// AuthUser interface
interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
}
```

### Admin Routes Must Always Have Both Guards

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin/users')
export class AdminUsersController {}
```

---

## 13. Response Shape

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cursor": "next-cursor-value",
    "hasMore": true,
    "total": 150
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    { "field": "content", "message": "content must be shorter than or equal to 40000 characters" }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/messages"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "cursor": "550e8400-e29b-41d4-a716-446655440099",
    "hasMore": true,
    "limit": 50
  }
}
```

---

## 14. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| Controller | `<surface>-<entity>.controller.ts` | `admin-messages.controller.ts` |
| Service | `<surface>-<entity>.service.ts` | `admin-messages.service.ts` |
| Repository | `<entity>.repository.ts` | `messages.repository.ts` |
| Module | `<entity>.module.ts` | `messages.module.ts` |
| DTO (request) | `<surface>-<verb>-<entity>.dto.ts` | `admin-create-message.dto.ts` |
| DTO (response) | `<surface>-<entity>-response.dto.ts` | `mobile-message-response.dto.ts` |
| DTO (query) | `<surface>-<entity>-query.dto.ts` | `mobile-message-query.dto.ts` |
| Interface | `<entity>.interface.ts` | `messages.interface.ts` |
| Guard | `<name>.guard.ts` | `jwt-auth.guard.ts` |
| Decorator | `<name>.decorator.ts` | `current-user.decorator.ts` |
| Filter | `<name>.filter.ts` | `http-exception.filter.ts` |
| Interceptor | `<name>.interceptor.ts` | `response.interceptor.ts` |

### Classes

| Type | Convention | Example |
|---|---|---|
| Admin Controller | Admin + PascalCase + Controller | `AdminMessagesController` |
| Mobile Controller | Mobile + PascalCase + Controller | `MobileMessagesController` |
| Auth Controller | PascalCase + Controller | `AuthController` |
| Service | Surface + PascalCase + Service | `AdminMessagesService` |
| Repository | PascalCase + Repository | `MessagesRepository` |
| DTO | PascalCase + Dto | `SendMessageDto` |
| Response DTO | PascalCase + ResponseDto | `MessageResponseDto` |
| Interface | I + PascalCase | `IMessagesService` |
| Enum | PascalCase | `MessageType` |

### Variables & Methods

- camelCase for variables and methods
- SCREAMING_SNAKE_CASE for constants
- Prefix booleans with `is`, `has`, `can`: `isAdmin`, `hasPermission`, `canEdit`
- Prefix async methods that return arrays with `find`: `findMessages`, `findById`
- Prefix create methods with `create`: `createMessage`
- Prefix update methods with `update`: `updateMessage`
- Prefix delete methods with `delete` or `softDelete`: `deleteMessage`

---

## 15. What Belongs Where — Quick Reference

| Code | Goes In |
|---|---|
| Route definition | Controller |
| HTTP status code | Controller |
| Request validation | DTO + ValidationPipe |
| Response serialization | DTO + class-transformer |
| Business logic | Service |
| Permission checks | Service (throw ForbiddenException) |
| Database queries | Repository |
| Prisma calls | Repository only |
| Email sending | Infrastructure/email service |
| File upload | Infrastructure/storage service |
| Queue jobs | Infrastructure/queue service |
| Redis operations | Infrastructure/redis service |
| Swagger docs | Controller + DTO decorators |
| Auth validation | Guards |
| Request transformation | Pipes or Interceptors |
| Error formatting | Global exception filter |
| Response wrapping | Global response interceptor |
| Environment variables | Config module |
| Constants | `<module>.types.ts` or `common/utils/` |
| Shared interfaces | `common/interfaces/` or module `interfaces/` |
| Shared DTOs (pagination etc.) | `common/dto/` |

---

> Last updated: project initialization
> Maintained by: backend team
> Any deviation from this guide must be discussed and documented before implementation.
