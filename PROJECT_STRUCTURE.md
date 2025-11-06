# 项目结构

```
erc20sdk/
├── src/                    # 源代码
│   ├── index.ts           # 主入口，导出所有公共 API
│   ├── sdk.ts             # N42SDK 主类
│   ├── types.ts           # TypeScript 类型定义
│   ├── errors.ts          # 错误类型定义
│   ├── rpc/               # RPC 客户端
│   │   └── client.ts      # RPC 调用封装
│   ├── ws/                # WebSocket 客户端
│   │   └── client.ts      # WebSocket 连接和事件订阅
│   ├── wallet/            # 钱包管理
│   │   └── wallet.ts      # 钱包创建、导入、签名
│   ├── erc20/             # ERC-20 代币操作
│   │   └── erc20.ts       # 代币查询、转账、授权
│   └── utils/             # 工具函数
│       ├── token-amount.ts  # 代币数量转换
│       ├── gas.ts         # Gas 费用工具
│       └── retry.ts       # 重试策略
├── dist/                  # 编译输出（TypeScript → JavaScript）
├── examples/              # 使用示例
│   ├── basic-usage.ts    # 基础使用示例
│   └── error-handling.ts # 错误处理示例
├── package.json          # 项目配置和依赖
├── tsconfig.json         # TypeScript 配置
├── .eslintrc.json        # ESLint 配置
├── README.md             # 主文档
├── QUICKSTART.md         # 快速开始指南
└── CHANGELOG.md          # 版本变更记录
```

## 核心模块说明

### 1. SDK 核心 (`src/sdk.ts`)
- `N42SDK.initialize()`: 初始化 SDK
- `erc20()`: 获取 ERC-20 实例
- `waitForReceipt()`: 等待交易确认
- `simulate()`: 模拟交易执行

### 2. RPC 客户端 (`src/rpc/client.ts`)
- 封装 ethers.js 的 JsonRpcProvider
- 支持重试机制
- 超时控制
- 网络错误处理

### 3. WebSocket 客户端 (`src/ws/client.ts`)
- WebSocket 连接管理
- 自动重连机制
- 事件订阅系统

### 4. 钱包管理 (`src/wallet/wallet.ts`)
- 创建新钱包（助记词）
- 导入钱包（助记词/私钥）
- 交易签名
- 消息签名

### 5. ERC-20 操作 (`src/erc20/erc20.ts`)
- 查询方法：`name()`, `symbol()`, `decimals()`, `balanceOf()`, `allowance()`
- 交易方法：`transfer()`, `approve()`, `transferFrom()`
- 事件订阅：`events.transfer()`, `events.approval()`

### 6. 工具函数
- **TokenAmountUtil**: 代币数量转换（最小单位 ↔ 可读格式）
- **Gwei**: Gas 费用单位转换
- **Retry**: 指数退避重试策略

## 技术栈

- **语言**: TypeScript 5.3+
- **运行时**: Node.js 18+
- **区块链库**: ethers.js v6
- **WebSocket**: ws
- **构建工具**: TypeScript Compiler

## 依赖关系

```
N42SDK
  ├── RPCClient (ethers.JsonRpcProvider)
  ├── WSClient (WebSocket)
  └── ERC20
      ├── RPCClient
      └── WSClient
```

## 扩展建议

### iOS/Android 集成
1. 使用 React Native 桥接，或
2. 使用 Kotlin Multiplatform 或 Swift Package 封装
3. 实现平台特定的密钥存储（Keychain/Keystore）

### 功能增强
- [ ] EIP-2612 Permit 支持
- [ ] 批量交易支持
- [ ] 交易加速/取消的完整实现
- [ ] 更多事件过滤选项
- [ ] 交易历史查询
- [ ] 多链支持

