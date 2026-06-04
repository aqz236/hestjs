import { Command } from "@hestjs/cqrs";

export class CreateUserCommand extends Command<string> {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {
    super();
  }
}
