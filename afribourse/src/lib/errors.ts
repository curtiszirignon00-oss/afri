export class RateLimitError extends Error {
  readonly silent: boolean;
  constructor(silent: boolean) {
    super(silent ? 'rate-limited' : 'Trop de requêtes. Veuillez patienter quelques instants.');
    this.name = 'RateLimitError';
    this.silent = silent;
  }
}
