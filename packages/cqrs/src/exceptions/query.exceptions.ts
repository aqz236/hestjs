export class QueryHandlerNotFoundException extends Error {
  constructor(queryName: string) {
    super(`Query handler for "${queryName}" not found.`);
    this.name = "QueryHandlerNotFoundException";
  }
}

export class InvalidQueryHandlerException extends Error {
  constructor(message?: string) {
    super(message || "Invalid query handler.");
    this.name = "InvalidQueryHandlerException";
  }
}
