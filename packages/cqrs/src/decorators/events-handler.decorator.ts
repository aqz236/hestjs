import { Injectable } from "@hestjs/core";
import "reflect-metadata";
import { EVENT_HANDLER_METADATA } from "../constants";
import { IEvent } from "../interfaces";

/**
 * Decorator that marks a class as an event handler.
 * An event handler handles events published by your application code.
 *
 * The decorated class must implement the `IEventHandler` interface.
 *
 * @param events event *types* to be handled by this handler.
 */
export const EventsHandler = (
  ...events: (IEvent | (new (...args: any[]) => IEvent))[]
): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, events, target);

    // 自动添加 Injectable 装饰器
    Injectable()(target);
  };
};
