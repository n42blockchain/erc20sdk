/**
 * Basic Usage Example
 */

import {
  N42SDK,
  Wallet,
  MnemonicStrength,
  TokenAmountUtil,
  ERC20Transfer,
  TxOptions,
  Gwei,
} from '../src/index';

async function main() {
  // 1. 初始化 SDK
  const sdk = await N42SDK.initialize({
    rpcUrl: 'https://rpc.n42.world',
    wsUrl: 'wss://ws.n42.world',
    chainId: 2042,
    timeoutMs: 12000,
    retry: {
      type: 'exponential',
      baseMs: 300,
      maxMs: 3000,
    },
  });

  // 2. 创建或导入钱包
  const wallet = Wallet.create(MnemonicStrength.WORDS_12);
  console.log('Wallet address:', wallet.address);
  console.log('Mnemonic:', wallet.getMnemonic());

  // 3. 获取 ERC-20 实例
  const tokenAddress = '0xYourTokenAddress';
  const erc20 = sdk.erc20(tokenAddress);

  // 4. 查询代币信息
  console.log('\n=== Token Info ===');
  const symbol = await erc20.symbol();
  const decimals = await erc20.decimals();
  const name = await erc20.name();
  const totalSupply = await erc20.totalSupply();

  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${totalSupply}`);

  // 5. 查询余额
  const balance = await erc20.balanceOf(wallet.address);
  const readableBalance = TokenAmountUtil.toDecimalString(
    TokenAmountUtil.fromMinUnits(balance, decimals)
  );
  console.log(`\nBalance: ${readableBalance} ${symbol}`);

  // 6. 转账示例
  if (balance > 0n) {
    console.log('\n=== Transfer ===');
    const transferAmount = TokenAmountUtil.fromDecimal('1.0', decimals);
    const transfer: ERC20Transfer = {
      to: '0xReceiverAddress',
      amount: transferAmount.minUnits,
    };

    const options: TxOptions = {
      maxFeePerGas: Gwei.toWei(2.0),
      maxPriorityFeePerGas: Gwei.toWei(1.0),
      nonce: 'auto',
      gasLimit: 'auto',
    };

    try {
      const txHash = await erc20.transfer(transfer, wallet, options);
      console.log(`Transaction hash: ${txHash}`);

      const receipt = await sdk.waitForReceipt(txHash, 120);
      console.log('Transaction confirmed:', receipt);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  }

  // 7. 授权示例
  console.log('\n=== Approve ===');
  const approveAmount = TokenAmountUtil.fromDecimal('1000', decimals);
  try {
    const approveTxHash = await erc20.approve({
      spender: '0xSpenderAddress',
      amount: approveAmount.minUnits,
    }, wallet);

    const approveReceipt = await sdk.waitForReceipt(approveTxHash);
    console.log('Approval confirmed:', approveReceipt);

    // 查询授权额度
    const allowance = await erc20.allowance(
      wallet.address,
      '0xSpenderAddress'
    );
    console.log('Allowance:', allowance);
  } catch (error) {
    console.error('Approve failed:', error);
  }

  // 8. 事件订阅
  console.log('\n=== Event Subscription ===');
  const subscription = erc20.events.transfer(
    null,
    wallet.address,
    (event) => {
      const value = TokenAmountUtil.toDecimalString(
        TokenAmountUtil.fromMinUnits(event.value, decimals)
      );
      console.log(`Received ${value} ${symbol} from ${event.from}`);
    }
  );

  // 保持运行一段时间以接收事件
  setTimeout(() => {
    subscription.cancel();
    sdk.disconnect();
    console.log('\nDisconnected');
  }, 60000);
}

main().catch(console.error);

