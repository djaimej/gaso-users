import { Controller, Get } from "@nestjs/common";
import { Public } from "@decorators/public.decorator";

@Public()
@Controller()
export class AppController {
    @Get()
    getHello(): string {
        return 'Bienvenido a la API de Usuarios GASO';
    }

    @Get('health')
    healthCheck() {
        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
}

