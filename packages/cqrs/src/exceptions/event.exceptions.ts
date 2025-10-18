export class InvalidEventHandlerException extends Error {
  constructor(message?: string) {
    super(message || "Invalid event handler.");
    this.name = "InvalidEventHandlerException";
  }
}

export class InvalidSagaException extends Error {
  constructor(message?: string) {
    super(message || "Invalid saga.");
    this.name = "InvalidSagaException";
  }
}
