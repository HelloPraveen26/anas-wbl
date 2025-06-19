import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = (configService: ConfigService): WinstonModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.colorize({ all: !isProduction }),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize({ all: !isProduction }),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            return `${timestamp} [${context || 'Application'}] ${level}: ${message}${
              trace ? `\n${trace}` : ''
            }`;
          }),
        ),
      }),
      ...(isProduction
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
            }),
          ]
        : []),
    ],
  };
};