import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/auth.dto';
import { compare } from 'bcrypt';

const EXPIRE_TIME = 20 * 1000;

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        const user = await this.validateUser(dto);
        const payload = {
            username: user.email,
            sub: {
                name: user.name,
            },
        };

        return {
            user,
            backendTokens: {
                accessToken: await this.jwtService.signAsync(payload, {
                    expiresIn: '20s',
                    secret: process.env.jwtSecretKey
                }),
                refreshToken: await this.jwtService.signAsync(payload, {
                    expiresIn: '7d',
                    secret: process.env.jwtRefreshTokenKey,
                }),
                expiresIn: new Date().setTime(new Date().getTime() + EXPIRE_TIME),
            },
        };
    }

    async validateUser(dto: LoginDto) {
        const user = await this.userService.findByEmail(dto.username);

        if (user && (await compare(dto.password, user.password))) {
            const { password, ...results } = user;
            return results;
        }
        throw new UnauthorizedException();
    }

    async refreshToken(user: any) {
        const payload = {
            username: user.username,
            sub: user.sub,
        };
        
        return {
            accessToken: await this.jwtService.signAsync(payload, {
              expiresIn: '20s',
              secret: process.env.jwtSecretKey,
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
              expiresIn: '7d',
              secret: process.env.jwtRefreshTokenKey,
            }),
            expiresIn: new Date().setTime(new Date().getTime() + EXPIRE_TIME),
          };
    }
}
