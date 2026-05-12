import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export interface TypeOrmConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  entities?: string[];
  migrations?: string[];
  synchronize?: boolean;
  logging?: boolean;
}

export const createTypeOrmConfig = (
  configService: ConfigService,
  options?: Partial<TypeOrmConfig>,
): DataSourceOptions => {
  return {
    type: 'postgres',
    host: options?.host || configService.get<string>('DB_HOST') || 'localhost',
    port: options?.port || configService.get<number>('DB_PORT') || 5432,
    username: options?.username || configService.get<string>('DB_USERNAME') || 'postgres',
    password: options?.password || configService.get<string>('DB_PASSWORD') || 'postgres',
    database: options?.database || configService.get<string>('DB_DATABASE') || 'welpco',
    entities: options?.entities || [],
    migrations: options?.migrations || [],
    synchronize: options?.synchronize ?? configService.get<boolean>('DB_SYNCHRONIZE') ?? false,
    logging: options?.logging ?? configService.get<boolean>('DB_LOGGING') ?? false,
  };
};

export const createDataSource = (
  config: DataSourceOptions,
): DataSource => {
  return new DataSource(config);
};

