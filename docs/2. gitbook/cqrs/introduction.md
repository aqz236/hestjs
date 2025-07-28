# 🏛️ CQRS 概念介绍

HestJS 原生支持 CQRS 架构，分离命令与查询，提升系统可扩展性与可维护性。

## 什么是 CQRS？

CQRS（Command Query Responsibility Segregation）是一种架构模式，将数据修改（命令）与数据读取（查询）分离。

- **命令（Command）**：负责变更系统状态
- **查询（Query）**：负责读取数据，不改变状态

## HestJS CQRS 优势

- 业务逻辑清晰分离
- 易于扩展和测试
- 支持事件驱动与 Saga 模式

## 应用场景

- 复杂业务系统
- 高并发读写分离
- 事件溯源与微服务

> 🏛️ CQRS 让你的架构更清晰、更可扩展。

---

下一步：命令处理。
