import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { randomBytes } from 'crypto';
import { ConfigurationEnum } from '@config/config.enum';

// Función para generar una clave secreta aleatoria
export const generateSecret = () => randomBytes(32).toString('hex');

// Configuración de CSRF
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: (req: Request) => {
        if (!req.session.csrfSecret) {
            req.session.csrfSecret = generateSecret();
        }
        return req.session.csrfSecret;
    },
    cookieName: 'csrf-token', // Nombre de la cookie (recomendado usar prefijo Host)
    cookieOptions: {
        sameSite: process.env[ConfigurationEnum.NODE_ENV] === 'production' ? 'strict' : 'lax', // Recomendado "strict" para mayor seguridad
        path: "/",
        secure: process.env[ConfigurationEnum.NODE_ENV] === 'production', // Solo enviar cookies en conexiones HTTPS, en false para dev
        httpOnly: true, // La cookie no es accesible desde JavaScript
    },
    size: 64, // Tamaño del token en bits
    ignoredMethods: ["GET", "HEAD", "OPTIONS"], // Métodos HTTP que no requieren protección CSRF
    getSessionIdentifier: (req) => {
        return req.sessionID || `${req.ip}-${req.get('user-agent')}`.substring(0, 50);
    }
});

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        doubleCsrfProtection(req, res, (err: unknown) => {
            if (err) {
                return res.status(403).json({
                    message: 'Token CSRF inválido',
                    error: 'CSRF_TOKEN_INVALID'
                });
            }
            next();
        });
    }
}

export { generateCsrfToken, doubleCsrfProtection };