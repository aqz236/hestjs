import { Injectable } from "@hestjs/core";
import "reflect-metadata";
import { SAGA_METADATA } from "../constants";

/**
 * Decorator that marks a class as a saga.
 * Sagas are long-running processes that listen to events and may execute commands.
 *
 * The decorated class must implement methods that correspond to event handlers.
 */
export const Saga = (): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(SAGA_METADATA, true, target);

    // 自动添加 Injectable 装饰器
    Injectable()(target);
  };
};
