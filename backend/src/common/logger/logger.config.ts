import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, stack, context, ...meta }) => {
      const logEntry: any = {
        timestamp,
        level,
        message,
        context,
        ...meta,
      };

      if (stack) {
        logEntry.stack = stack;
      }

      return JSON.stringify(logEntry);
    },
  ),
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context }) => {
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${ctx} ${message}`;
  }),
);

export const createWinstonLogger = (nodeEnv: string) => {
  const isProduction = nodeEnv === 'production';

  return WinstonModule.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? logFormat : devFormat,
    transports: [
      new winston.transports.Console({
        silent: nodeEnv === 'test',
      }),
      ...(isProduction
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: logFormat,
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: logFormat,
            }),
          ]
        : []),
    ],
  });
};
