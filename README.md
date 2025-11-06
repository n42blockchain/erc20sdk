# N42 ERC-20 SDK

用于在移动端（iOS/Android）和 Web 环境中操作 N42 链上 ERC-20 代币的 TypeScript SDK。

## 特性

- ✅ 完整的 ERC-20 操作（查询、转账、授权）
- ✅ EIP-1559 手续费支持
- ✅ WebSocket 事件订阅
- ✅ 指数退避重试策略
- ✅ 异步安全（async/await）
- ✅ TypeScript 类型支持
- ✅ 错误处理与重试机制

## 安装

```bash
npm install @n42/erc20-sdk
```

或使用 yarn:

```bash
yarn add @n42/erc20-sdk
```

## 快速开始

### 1. 初始化 SDK

```typescript
import { N42SDK, N42Config } from '@n42/erc20-sdk';

const config: N42Config = {
  rpcUrl: 'https://rpc.n42.world',
  wsUrl: 'wss://ws.n42.world',
  chainId: 2042,
  timeoutMs: 12000,
  retry: {
    type: 'exponential',
    baseMs: 300,
    maxMs: 3000,
  },
};

const sdk = await N42SDK.initialize(config);
```

### 2. 创建或导入钱包

```typescript
import { Wallet, MnemonicStrength } from '@n42/erc20-sdk';

// 创建新钱包
const wallet = Wallet.create(MnemonicStrength.WORDS_12);

// 或导入现有钱包
const wallet = Wallet.import('your mnemonic phrase here');

// 获取地址
console.log(wallet.address);
```

### 3. 查询代币信息

```typescript
import { TokenAmountUtil } from '@n42/erc20-sdk';

const erc20 = sdk.erc20('0xYourTokenAddress');

// 查询基础信息
const symbol = await erc20.symbol();
const decimals = await erc20.decimals();
const name = await erc20.name();
const totalSupply = await erc20.totalSupply();

// 查询余额
const balance = await erc20.balanceOf(wallet.address);

// 转换为可读格式
const readable = TokenAmountUtil.toDecimalString(
  TokenAmountUtil.fromMinUnits(balance, decimals)
);
console.log(`${readable} ${symbol}`);
```

### 4. 转账代币

```typescript
import { ERC20Transfer, TxOptions, Gwei } from '@n42/erc20-sdk';

// 准备转账
const amount = TokenAmountUtil.fromDecimal('12.5', decimals);
const transfer: ERC20Transfer = {
  to: '0xReceiverAddress',
  amount: amount.minUnits,
};

// 可选：配置手续费
const options: TxOptions = {
  maxFeePerGas: Gwei.toWei(2.0),
  maxPriorityFeePerGas: Gwei.toWei(1.0),
  nonce: 'auto', // 或手动指定数字
  gasLimit: 'auto', // 或手动指定 bigint
};

// 发送转账
const txHash = await erc20.transfer(transfer, wallet, options);

// 等待确认
const receipt = await sdk.waitForReceipt(txHash, 120);
console.log('Transaction confirmed:', receipt);
```

### 5. 授权代币

```typescript
import { ERC20Approve } from '@n42/erc20-sdk';

const approve: ERC20Approve = {
  spender: '0xSpenderAddress',
  amount: TokenAmountUtil.fromDecimal('1000', decimals).minUnits,
};

const txHash = await erc20.approve(approve, wallet);
const receipt = await sdk.waitForReceipt(txHash);

// 查询授权额度
const allowance = await erc20.allowance(wallet.address, '0xSpenderAddress');
```

### 6. 订阅事件

```typescript
// 订阅 Transfer 事件
const subscription = erc20.events.transfer(
  null, // from (null = 所有地址)
  wallet.address, // to (只监听发送到此地址的转账)
  (event) => {
    console.log(`Received ${event.value} from ${event.from}`);
  }
);

// 取消订阅
subscription.cancel();

// 订阅 Approval 事件
const approvalSub = erc20.events.approval(
  wallet.address,
  null,
  (event) => {
    console.log(`Approval: ${event.value} to ${event.spender}`);
  }
);
```

## API 参考

### N42SDK

#### `initialize(config: N42Config): Promise<N42SDK>`

初始化 SDK 实例。

#### `erc20(address: string): ERC20`

获取 ERC-20 代币实例。

#### `waitForReceipt(txHash: string, timeoutSec?: number): Promise<TransactionReceipt>`

等待交易确认。

### ERC20

#### 查询方法

- `name(): Promise<string>`
- `symbol(): Promise<string>`
- `decimals(): Promise<number>`
- `totalSupply(): Promise<bigint>`
- `balanceOf(address: string): Promise<bigint>`
- `allowance(owner: string, spender: string): Promise<bigint>`

#### 交易方法

- `transfer(transfer: ERC20Transfer, from: Wallet, options?: TxOptions): Promise<string>`
- `approve(approve: ERC20Approve, from: Wallet, options?: TxOptions): Promise<string>`
- `transferFrom(from: string, to: string, amount: bigint, wallet: Wallet, options?: TxOptions): Promise<string>`

#### 事件订阅

- `events.transfer(from: string | null, to: string | null, callback: EventCallback<TransferEvent>): EventSubscription`
- `events.approval(owner: string | null, spender: string | null, callback: EventCallback<ApprovalEvent>): EventSubscription`

### Wallet

#### `create(strength?: MnemonicStrength): Wallet`

创建新钱包。

#### `import(mnemonic: string, passphrase?: string): Wallet`

从助记词导入钱包。

#### `fromPrivateKey(privateKey: string): Wallet`

从私钥导入钱包。

### TokenAmountUtil

#### `fromMinUnits(minUnits: bigint | string, decimals: number): TokenAmount`

从最小单位创建 TokenAmount。

#### `fromDecimal(decimal: string, decimals: number): TokenAmount`

从十进制字符串创建 TokenAmount。

#### `toDecimalString(amount: TokenAmount): string`

转换为可读的十进制字符串。

## 错误处理

SDK 提供了详细的错误类型：

```typescript
import {
  NetworkError,
  InsufficientFundsError,
  NonceError,
  TransactionRevertedError,
} from '@n42/erc20-sdk';

try {
  await erc20.transfer(transfer, wallet);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.error('余额不足');
  } else if (error instanceof NetworkError) {
    console.error('网络错误:', error.message);
  } else if (error instanceof TransactionRevertedError) {
    console.error('交易失败:', error.reason);
  }
}
```

## 网络配置

### 主网

```typescript
const mainnetConfig: N42Config = {
  rpcUrl: 'https://rpc.n42.world',
  wsUrl: 'wss://ws.n42.world',
  chainId: 2042,
};
```

### 测试网

```typescript
const testnetConfig: N42Config = {
  rpcUrl: 'https://rpc.testnet.n42.world',
  wsUrl: 'wss://ws.testnet.n42.world',
  chainId: 204201,
};
```

## 安全建议

1. **私钥管理**：在生产环境中，私钥应存储在安全容器中（iOS Keychain / Android Keystore）
2. **环境变量**：使用环境变量管理 RPC URL 和链 ID
3. **错误处理**：始终处理可能的错误，特别是网络错误和交易失败
4. **手续费控制**：设置合理的 maxFeePerGas 上限以防止异常高额手续费

## 类型定义

SDK 提供完整的 TypeScript 类型定义，支持智能提示和类型检查。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request。

