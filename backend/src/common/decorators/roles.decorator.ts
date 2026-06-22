import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles('admin', 'cashier') — marca qué roles pueden acceder al endpoint.
 * Si no se usa @Roles, el RoleGuard solo verifica que haya JWT válido.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
