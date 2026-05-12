// Database connection utilities
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export const getDatabaseUrl = (config: DatabaseConfig): string => {
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
};

