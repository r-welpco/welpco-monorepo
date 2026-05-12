import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTypeOrmConfig } from './typeorm.config';

@Module({})
export class DatabaseModule {
  static forRoot(options?: {
    entities?: any[];
    migrations?: string[];
    synchronize?: boolean;
    logging?: boolean;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            return createTypeOrmConfig(configService, {
              entities: options?.entities || [],
              migrations: options?.migrations || [],
              synchronize: options?.synchronize,
              logging: options?.logging,
            });
          },
          inject: [ConfigService],
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}

