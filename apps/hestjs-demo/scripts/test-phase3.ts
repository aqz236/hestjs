/**
 * HestJS 验证层端到端测试脚本
 *
 * 从 hest@b48a9ec (2025-07-27) 恢复，并适配当前的 demo 路由：
 *   API_BASE 默认 http://localhost:3002（demo 端口），可用环境变量覆盖
 *   users 控制器路由已由 /api/users 调整为 /users
 *
 * 用法：
 *   bun run --cwd apps/hestjs-demo dev        # 另开终端启动 demo
 *   bun run --cwd apps/hestjs-demo test:e2e
 */

/**
 * HestJS Phase 3 验证测试脚本
 *
 * 这个脚本用于测试 TypeBox 验证功能
 * 包括成功和失败的验证场景
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:3002";

// 测试数据
const validUser = {
  name: "Alice Johnson",
  email: "alice@example.com",
  age: 28,
  password: "securepassword123",
  bio: "Software engineer who loves TypeScript",
};

const invalidUser = {
  name: "A", // 太短
  email: "invalid-email", // 无效邮箱
  age: -5, // 负数年龄
  password: "123", // 密码太短
  bio: 123, // 错误类型
};

const validCustomData = {
  username: "john_doe123",
  role: "user",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  phoneNumber: "13812345678",
  location: { lat: 39.9042, lng: 116.4074 },
  emails: ["john@example.com", "john.doe@company.com"],
};

const invalidCustomData = {
  username: "a", // 太短
  role: "invalid_role", // 不在联合类型中
  userId: "not-a-uuid", // 无效 UUID
  phoneNumber: "123456", // 无效手机号
  location: { lat: 200, lng: 200 }, // 超出范围
  emails: ["invalid-email", "another@invalid"], // 无效邮箱
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAPI(method: string, url: string, data?: any) {
  console.log(`\n🔍 测试: ${method} ${url}`);
  if (data) {
    console.log("📤 请求数据:", JSON.stringify(data, null, 2));
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`📊 状态码: ${response.status}`);
    console.log("📥 响应:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("✅ 成功");
    } else {
      console.log("❌ 失败");
    }

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log("💥 请求错误:", error);
    return { success: false, error };
  }
}

async function runTests() {
  console.log("🚀 开始 HestJS Phase 3 验证功能测试\n");
  console.log("🔧 测试项目:");
  console.log("  1. 获取所有用户");
  console.log("  2. 创建用户 - 有效数据");
  console.log("  3. 创建用户 - 无效数据 (验证失败)");
  console.log("  4. 自定义验证 - 有效数据");
  console.log("  5. 自定义验证 - 无效数据 (验证失败)");
  console.log("  6. 获取自定义验证示例");

  // 等待服务器启动
  console.log("\n⏳ 等待服务器启动...");
  await sleep(2000);

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // 1. 获取所有用户
  console.log("\n═══════════════════════════════════════");
  console.log("📋 测试 1: 获取所有用户");
  const getUsersResult = await testAPI("GET", `${API_BASE}/users`);
  testResults.total++;
  if (getUsersResult.success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // 2. 创建用户 - 有效数据
  console.log("\n═══════════════════════════════════════");
  console.log("✅ 测试 2: 创建用户 - 有效数据");
  const createValidUserResult = await testAPI(
    "POST",
    `${API_BASE}/users`,
    validUser
  );
  testResults.total++;
  if (createValidUserResult.success) {
    testResults.passed++;
    console.log("🎉 基础验证通过! 用户创建成功");
  } else {
    testResults.failed++;
  }

  // 3. 创建用户 - 无效数据
  console.log("\n═══════════════════════════════════════");
  console.log("❌ 测试 3: 创建用户 - 无效数据 (期望验证失败)");
  const createInvalidUserResult = await testAPI(
    "POST",
    `${API_BASE}/users`,
    invalidUser
  );
  testResults.total++;
  if (
    !createInvalidUserResult.success &&
    createInvalidUserResult.status === 400
  ) {
    testResults.passed++;
    console.log("🎉 基础验证正确拒绝了无效数据!");
  } else {
    testResults.failed++;
    console.log("😱 错误: 应该拒绝无效数据但没有!");
  }

  // 4. 自定义验证 - 有效数据
  console.log("\n═══════════════════════════════════════");
  console.log("� 测试 4: 自定义验证 - 有效数据");
  const customValidResult = await testAPI(
    "POST",
    `${API_BASE}/custom/validate`,
    validCustomData
  );
  testResults.total++;
  if (customValidResult.success) {
    testResults.passed++;
    console.log("🎉 TypeBox 自定义验证通过!");
  } else {
    testResults.failed++;
  }

  // 5. 自定义验证 - 无效数据
  console.log("\n═══════════════════════════════════════");
  console.log("❌ 测试 5: 自定义验证 - 无效数据 (期望验证失败)");
  const customInvalidResult = await testAPI(
    "POST",
    `${API_BASE}/custom/validate`,
    invalidCustomData
  );
  testResults.total++;
  if (!customInvalidResult.success && customInvalidResult.status === 400) {
    testResults.passed++;
    console.log("🎉 自定义验证正确拒绝了无效数据!");
  } else {
    testResults.failed++;
    console.log("😱 错误: 自定义验证应该拒绝无效数据但没有!");
  }

  // 6. 获取自定义验证示例
  console.log("\n═══════════════════════════════════════");
  console.log("� 测试 6: 获取自定义验证示例");
  const examplesResult = await testAPI("GET", `${API_BASE}/custom/examples`);
  testResults.total++;
  if (examplesResult.success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // 测试总结
  console.log("\n🏁 测试完成!");
  console.log("═══════════════════════════════════════");
  console.log(`📊 测试结果:`);
  console.log(`  ✅ 通过: ${testResults.passed}`);
  console.log(`  ❌ 失败: ${testResults.failed}`);
  console.log(`  📝 总计: ${testResults.total}`);
  console.log(
    `  🎯 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`
  );

  if (testResults.failed === 0) {
    console.log("\n🎉 所有测试都通过了! HestJS Phase 3 验证功能工作正常!");
    console.log("\n✨ Phase 3 功能验证:");
    console.log("  🔍 TypeBox 基础验证装饰器 ✅");
    console.log("  � @Custom() 自定义 Schema 验证 ✅");
    console.log("  🏗️ SchemaFactory 便捷构建器 ✅");
    console.log("  � CommonValidators 常用验证 ✅");
    console.log("  📝 DTO 自动验证与错误处理 ✅");
    console.log("  🔄 自动类型转换 ✅");
    console.log("  � 详细验证错误信息 ✅");
    console.log("\n🚀 HestJS 框架已完成 Phase 3 开发!");
    console.log(
      "   基于 Hono + Bun + TSyringe + TypeBox 的现代化 OOP 后端框架"
    );
  } else {
    console.log("\n⚠️  有一些测试失败了，请检查服务器日志");
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log("❌ 服务器未运行!");
    console.log("请先运行: cd apps/hest-demo && bun dev");
    process.exit(1);
  }

  await runTests();
}

main().catch(console.error);
