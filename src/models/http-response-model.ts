/** Contrato entre service e controller: o status HTTP, o corpo e cabeçalhos opcionais. */
export interface HttpResponse<T = unknown> {
  statusCode: number;
  body?: T;
  headers?: Record<string, string>;
}
