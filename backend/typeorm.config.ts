import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const configService = new ConfigService();

// Utiliser DATABASE_URL si disponible (Render), sinon variables séparées
const databaseUrl = configService.get<string>('DATABASE_URL');
let dataSourceOptions;

if (databaseUrl) {
  dataSourceOptions = {
    type: 'postgres' as const,
    url: databaseUrl,
    ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  };
} else {
  dataSourceOptions = {
    type: 'postgres' as const,
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT') || '5432'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
  };
}

export default new DataSource({
  ...dataSourceOptions,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
});