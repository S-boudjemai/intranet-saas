import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database - soit DATABASE_URL soit variables séparées
  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASS: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  // JWT (simplifié sans refresh tokens)
  JWT_SECRET: Joi.string().required(),

  // AWS S3 - optionnel pour les tests
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().optional(),

  // Email Legacy (Mailtrap fallback) - optionnel
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASS: Joi.string().optional(),
  MAIL_FROM: Joi.string().default('noreply@franchisedesk.fr'),
  MAIL_FROM_NAME: Joi.string().default('FranchiseDesk'),

  // Email Moderne (SendGrid) - requis en production
  SENDGRID_API_KEY: Joi.string().optional(),

  // Frontend URL pour les liens d'emails
  FRONTEND_URL: Joi.string().default('http://localhost:5174'),

  // OneSignal - pour les notifications push
  ONESIGNAL_APP_ID: Joi.string().optional(),
  ONESIGNAL_API_KEY: Joi.string().optional(),
});
