export class CommandHandlerNotFoundException extends Error {
  constructor(commandName: string) {
    super(`Command handler for "${commandName}" not found.`);
    this.name = "CommandHandlerNotFoundException";
  }
}

export class InvalidCommandHandlerException extends Error {
  constructor(message?: string) {
    super(message || "Invalid command handler.");
    this.name = "InvalidCommandHandlerException";
  }
}
