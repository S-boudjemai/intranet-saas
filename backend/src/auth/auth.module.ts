import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { InvitesModule } from 'src/invites/invites.module'; // <-- IMPORT IMPORTANT

@Module({
  imports: [
    UsersModule,
    // Enregistre ici la stratégie "jwt" par défaut pour Passport
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    ConfigModule,
    InvitesModule, // <-- AJOUTÉ ICI : On rend InvitesService disponible
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
