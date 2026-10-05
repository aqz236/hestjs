import { Module } from "@hestjs/core";
import { UserController } from "../controllers/user.controller";

@Module({
  controllers: [UserController],
})
export class AppModule {}
