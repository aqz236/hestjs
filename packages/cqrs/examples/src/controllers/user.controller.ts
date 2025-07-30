import { Controller, Get, Post } from "@hestjs/core";
import { CommandBus, EventBus, QueryBus } from "@hestjs/cqrs";
import { CreateUserCommand } from "../commands/create-user.command";
import { UserCreatedEvent } from "../events/user-created.event";
import { GetUserQuery } from "../queries/get-user.query";

@Controller("/users")
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus
  ) {}

  @Post()
  async createUser(c: any) {
    const data = await c.req.json();

    const command = new CreateUserCommand(data.name, data.email);
    const userId = await this.commandBus.execute(command);

    // 发布事件
    const event = new UserCreatedEvent(userId, data.name, data.email);
    await this.eventBus.publish(event);

    return c.json({ userId, message: "User created successfully" });
  }

  @Get("/:id")
  async getUser(c: any) {
    const id = c.req.param("id");

    const query = new GetUserQuery(id);
    const result = await this.queryBus.execute(query);

    return c.json(result);
  }
}
