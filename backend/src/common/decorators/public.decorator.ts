import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — marca el endpoint como público (no requiere JWT).
 * Usado por el AuthMiddleware para omitir la verificación.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
