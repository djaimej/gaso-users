import { Controller, Get } from '@nestjs/common';
import { Public } from '@decorators/public.decorator';

@Controller()
export class AppController {
    @Get()
    getHello(): string {
        return 'Bienvenido a la API de Usuarios GASO';
    }

    @Get('health')
    @Public()
    healthCheck() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
}

