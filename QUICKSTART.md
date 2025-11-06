# 快速开始指南

## 安装

```bash
npm install @n42/erc20-sdk
```

## 基本使用

### 1. 初始化 SDK

```typescript
import { N42SDK } from '@n42/erc20-sdk';

const sdk = await N42SDK.initialize({
  rpcUrl: 'https://rpc.n42.world',
  wsUrl: 'wss://ws.n42.world',
  chainId: 2042,
});
```

### 2. 创建钱包

```typescript
import { Wallet, MnemonicStrength } from '@n42/erc20-sdk';

// 创建新钱包（12词助记词）
const wallet = Wallet.create(MnemonicStrength.WORDS_12);

// 或导入现有钱包
const wallet = Wallet.import('your mnemonic phrase here');
```

### 3. 查询代币余额

```typescript
import { TokenAmountUtil } from '@n42/erc20-sdk';

const erc20 = sdk.erc20('0xYourTokenAddress');
const decimals = await erc20.decimals();
const balance = await erc20.balanceOf(wallet.address);

// 转换为可读格式
const readable = TokenAmountUtil.toDecimalString(
  TokenAmountUtil.fromMinUnits(balance, decimals)
);
console.log(`Balance: ${readable}`);
```

### 4. 转账

```typescript
import { ERC20Transfer, TokenAmountUtil, Gwei } from '@n42/erc20-sdk';

const amount = TokenAmountUtil.fromDecimal('10.5', decimals);
const transfer: ERC20Transfer = {
  to: '0xReceiverAddress',
  amount: amount.minUnits,
};

const txHash = await erc20.transfer(transfer, wallet, {
  maxFeePerGas: Gwei.toWei(2.0),
  maxPriorityFeePerGas: Gwei.toWei(1.0),
});

const receipt = await sdk.waitForReceipt(txHash);
console.log('Transaction confirmed!', receipt);
```

### 5. 授权

```typescript
const approve = {
  spender: '0xSpenderAddress',
  amount: TokenAmountUtil.fromDecimal('1000', decimals).minUnits,
};

const txHash = await erc20.approve(approve, wallet);
await sdk.waitForReceipt(txHash);
```

### 6. 订阅事件

```typescript
const subscription = erc20.events.transfer(
  null, // from (所有地址)
  wallet.address, // to (只监听发给我的)
  (event) => {
    console.log(`Received ${event.value} from ${event.from}`);
  }
);

// 取消订阅
// subscription.cancel();
```

## 错误处理

```typescript
import {
  InsufficientFundsError,
  NetworkError,
  TransactionRevertedError,
} from '@n42/erc20-sdk';

try {
  await erc20.transfer(transfer, wallet);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.error('余额不足');
  } else if (error instanceof NetworkError) {
    console.error('网络错误');
  } else if (error instanceof TransactionRevertedError) {
    console.error('交易失败:', error.reason);
  }
}
```

## 网络配置

### 主网
```typescript
{
  rpcUrl: 'https://rpc.n42.world',
  wsUrl: 'wss://ws.n42.world',
  chainId: 2042,
}
```

### 测试网
```typescript
{
  rpcUrl: 'https://rpc.testnet.n42.world',
  wsUrl: 'wss://ws.testnet.n42.world',
  chainId: 204201,
}
```

## 完整示例

查看 `examples/basic-usage.ts` 获取完整示例代码。

