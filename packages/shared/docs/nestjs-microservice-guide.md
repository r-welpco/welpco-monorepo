# NestJS Backend Development Guide

This guide establishes essential patterns and standards for developing the **single NestJS backend** and its **domain modules** in the Welpco platform. The architecture is **one backend app** with domain modules (user-management, profile-management, etc.); there are no separate microservice processes or Kafka. Communication between domains is **synchronous in-process**. Follow these patterns for module structure, entities, DTOs, validation, and testing within the backend.

## Table of Contents

1. [Service Structure](#service-structure)
2. [Entity Patterns](#entity-patterns)
3. [DTO Patterns](#dto-patterns)
4. [Validation](#validation)
5. [Error Handling](#error-handling)
6. [Event Patterns](#event-patterns)
7. [Database](#database)
8. [Testing](#testing)
9. [API Documentation](#api-documentation)
10. [Authentication](#authentication)

## Service Structure

### Standard Folder Organization

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts             # Root module
├── entities/                 # TypeORM entities
│   ├── index.ts             # Export all entities
│   └── *.entity.ts
├── modules/                  # Feature modules
│   └── [feature-name]/
│       ├── [feature].module.ts
│       ├── [feature].service.ts
│       ├── [feature].controller.ts
│       └── dto/
│           ├── create-[feature].dto.ts
│           ├── update-[feature].dto.ts
│           └── [feature]-response.dto.ts
├── database/
│   ├── database.module.ts
│   └── data-source.ts       # For migrations
├── events/
│   ├── events.module.ts
│   ├── event-publisher.service.ts
│   └── consumers/
│       └── *.consumer.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── logging.interceptor.ts
└── health/
    ├── health.module.ts
    └── health.controller.ts
```

### Module Structure

Each feature module should follow this pattern:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity]),
    EventsModule, // If events are needed
  ],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // If used by other modules
})
export class FeatureModule {}
```

## Entity Patterns

### Entity Definition

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  // ... other decorators
} from 'typeorm';

@Entity('table_name') // Use snake_case for table names
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'column_name' }) // Use snake_case for column names
  fieldName: string;

  @Column({ nullable: true })
  optionalField?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Naming Conventions

- **Entity Classes**: PascalCase (e.g., `CustomerProfile`)
- **Table Names**: snake_case (e.g., `customer_profiles`)
- **Column Names**: snake_case (e.g., `first_name`)
- **Relations**: Use descriptive names (e.g., `customerProfile`, not `profile`)

### Relationships

```typescript
// One-to-One
@OneToOne(() => RelatedEntity, (related) => related.owner)
@JoinColumn({ name: 'related_id' })
related: RelatedEntity;

// One-to-Many
@OneToMany(() => RelatedEntity, (related) => related.owner)
relatedItems: RelatedEntity[];

// Many-to-One
@ManyToOne(() => OwnerEntity, (owner) => owner.items)
@JoinColumn({ name: 'owner_id' })
owner: OwnerEntity;

// Many-to-Many
@ManyToMany(() => RelatedEntity)
@JoinTable({
  name: 'junction_table',
  joinColumn: { name: 'entity_id' },
  inverseJoinColumn: { name: 'related_id' },
})
relatedItems: RelatedEntity[];
```

### Database Indexes

Always add indexes for:
- Foreign key columns (for join performance)
- Frequently queried fields (status, active, etc.)
- Composite indexes for common query patterns

```typescript
import { Entity, Column, Index } from 'typeorm';

@Entity('service_offerings')
@Index(['welperId']) // Single column index
@Index(['active']) // Single column index
@Index(['welperId', 'active']) // Composite index for common query pattern
export class ServiceOffering extends BaseEntity {
  @Column({ name: 'welper_id' })
  welperId: string;

  @Column({ default: true })
  active: boolean;
}
```

## DTO Patterns

### Request DTOs

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateEntityDto {
  @ApiProperty({
    description: 'Entity name',
    example: 'Example Name',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
```

### Response DTOs

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class EntityResponseDto {
  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Entity name' })
  name: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
```

### Update DTOs

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEntityDto } from './create-entity.dto';

export class UpdateEntityDto extends PartialType(CreateEntityDto) {}
```

## Validation

### Global ValidationPipe

Configure in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true, // Automatically transform payloads to DTO instances
  }),
);
```

### Custom Validators

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidCustomField', async: false })
export class IsValidCustomFieldConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    // Validation logic
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Custom validation error message';
  }
}

export function IsValidCustomField(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCustomFieldConstraint,
    });
  };
}
```

## Error Handling

### Global Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '@welpco/types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const messageText =
      typeof message === 'string'
        ? message
        : (message as any)?.message || 'An error occurred';

    const errorResponse = {
      statusCode: status,
      errorCode: this.getErrorCode(status, messageText), // Use standardized error codes
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: messageText,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number, message: string): ErrorCode {
    // Map HTTP status codes and messages to standardized error codes
    // See packages/types/src/domain/error-codes.enum.ts
    if (status === HttpStatus.NOT_FOUND) {
      if (message.toLowerCase().includes('user')) {
        return ErrorCode.USER_NOT_FOUND;
      }
      if (message.toLowerCase().includes('profile')) {
        return ErrorCode.PROFILE_NOT_FOUND;
      }
    }
    if (status === HttpStatus.UNAUTHORIZED) {
      return ErrorCode.UNAUTHORIZED;
    }
    if (status === HttpStatus.FORBIDDEN) {
      return ErrorCode.FORBIDDEN;
    }
    if (status === HttpStatus.BAD_REQUEST) {
      return ErrorCode.VALIDATION_ERROR;
    }
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}
```

### Standardized Error Codes

Use the shared `ErrorCode` enum from `@welpco/types`:

```typescript
import { ErrorCode } from '@welpco/types';

// In exception filter
errorCode: ErrorCode.PROFILE_NOT_FOUND
```

### Standard HTTP Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

// Use appropriate exceptions
throw new NotFoundException('Resource not found');
throw new BadRequestException('Invalid input');
throw new ForbiddenException('Access denied');
throw new UnauthorizedException('Authentication required');
throw new ConflictException('Resource already exists');
```

## Event Patterns

### Event Naming Convention

Events follow the pattern: `welpco-events.[domain].[entity].[action]`

Examples:
- `welpco-events.user-management.user.created`
- `welpco-events.profile-management.profile.updated`

### Event Publisher Service (In-Process)

The platform uses a **single backend** and **in-process** communication. There is no Kafka or separate microservice processes. The event publisher is a no-op or in-memory implementation used for logging and future extensibility (e.g. SQS/SNS if needed later).

```typescript
import { Injectable, Logger } from '@nestjs/common';

export interface EntityCreatedEvent {
  entityId: string;
  // ... other fields
  timestamp: string;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  async publishEntityCreated(event: EntityCreatedEvent): Promise<void> {
    this.logger.log(`Published entity.created event for ${event.entityId}`);
    // In-process: no Kafka. Cross-domain calls are synchronous (e.g. ProfileCreationService.createProfileForUser).
  }
}
```

### Events Module Setup

```typescript
import { Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';

@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
```

## Database

### Database Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Entity1, Entity2 } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_DATABASE') || 'welpco_service_name',
        entities: [Entity1, Entity2],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Entity1, Entity2]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

### Migrations

```typescript
// data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'welpco_service_name',
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
```

### Database per Service Principle

- Each microservice has its own database
- No direct database access between services
- Communication via REST APIs and events only
- Foreign key references use UUIDs (not actual foreign keys)

## Testing

### Unit Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service';
import { Entity } from '../entities/entity.entity';

describe('Service', () => {
  let service: Service;
  let repository: Repository<Entity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Service,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            // ... other methods
          },
        },
      ],
    }).compile();

    service = module.get<Service>(Service);
    repository = module.get<Repository<Entity>>(getRepositoryToken(Entity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test cases...
});
```

### E2E Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .expect(200);
  });
});
```

## API Documentation

### Swagger Configuration

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Service Name API')
  .setDescription('API documentation for the Service Name domain service.')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('TagName', 'Tag description')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Controller Documentation

```typescript
@ApiTags('Feature')
@Controller('feature')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeatureController {
  @Get(':id')
  @ApiOperation({ summary: 'Get feature by ID' })
  @ApiParam({ name: 'id', description: 'Feature ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature retrieved successfully',
    type: FeatureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async getFeature(@Param('id') id: string) {
    // Implementation
  }
}
```

## Authentication

### Using Auth Guards

```typescript
// Welpco BFF: import from the app-local auth barrel (not a workspace package)
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/auth';

@Controller('feature')
@UseGuards(JwtAuthGuard) // Require authentication
@ApiBearerAuth()
export class FeatureController {
  @Get('me')
  @UseGuards(RolesGuard) // Additional role-based guard
  @Roles(AccountType.CUSTOMER) // Specific roles
  async getMyFeature(@CurrentUser() user: { userId: string }) {
    // user.userId contains the authenticated user's ID
  }
}
```

### Authorization Patterns

- Always verify user owns the resource they're accessing
- Use `@CurrentUser()` decorator to get authenticated user
- Check `userId` matches resource owner before operations

```typescript
async updateFeature(
  userId: string,
  featureId: string,
  updateDto: UpdateDto,
) {
  const feature = await this.findById(featureId);
  
  // Verify ownership
  if (feature.ownerId !== userId) {
    throw new ForbiddenException('You can only update your own feature');
  }
  
  // Update logic
}
```

## Main.ts Configuration

### Standard Bootstrap

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  // ... (see API Documentation section)

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Service is running on: http://localhost:${port}`);
}

bootstrap();
```

## Best Practices

1. **Domain Boundaries**: Each service owns its data. No direct database access between services.
2. **Event-Driven**: Use events for cross-domain communication, not direct API calls.
3. **Idempotency**: Make operations idempotent where possible.
4. **Error Messages**: Provide clear, actionable error messages.
5. **Logging**: Log important operations and errors with context.
6. **Validation**: Validate all inputs at the DTO level.
7. **Type Safety**: Use TypeScript strictly. Avoid `any` types.
8. **Testing**: Aim for high test coverage, especially for business logic.
9. **Documentation**: Keep Swagger docs up to date.
10. **Security**: Always verify user authorization before operations.

