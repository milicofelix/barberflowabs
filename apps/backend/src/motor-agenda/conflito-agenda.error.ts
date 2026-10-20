export class ConflitoAgendaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflitoAgendaError';
  }
}
