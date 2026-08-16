import type { ApiErrorDetail } from '@/types/api';

/**
 * Forma fijada en TASK-front.md §6.2. Es una clase simple (estructura, no lógica de
 * negocio) por lo que esta sesión la deja completa: no hay nada que "implementar" mal.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ApiErrorDetail[];

  constructor(code: string, statusCode: number, details?: ApiErrorDetail[]) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
