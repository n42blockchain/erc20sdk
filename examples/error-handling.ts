/**
 * Error Handling Example
 */

import {
  N42SDK,
  Wallet,
  ERC20Transfer,
  TokenAmountUtil,
  NetworkError,
  InsufficientFundsError,
  NonceError,
  TransactionRevertedError,
} from '../src/index';

async function errorHandlingExample() {
  const sdk = await N42SDK.initialize({
    rpcUrl: 'https://rpc.n42.world',
    wsUrl: 'wss://ws.n42.world',
    chainId: 2042,
  });

  const wallet = Wallet.create();
  const erc20 = sdk.erc20('0xYourTokenAddress');

  // 示例：处理转账错误
  try {
    const decimals = await erc20.decimals();
    const transfer: ERC20Transfer = {
      to: '0xReceiver',
      amount: TokenAmountUtil.fromDecimal('1000000', decimals).minUnits, // 假设余额不足
    };

    await erc20.transfer(transfer, wallet);
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      console.error('余额不足，无法完成转账');
      // 可以提示用户充值或减少转账金额
    } else if (error instanceof NetworkError) {
      console.error('网络错误，请检查网络连接');
      // 可以提示用户重试
    } else if (error instanceof NonceError) {
      console.error('Nonce 错误，可能需要等待或手动指定 nonce');
    } else if (error instanceof TransactionRevertedError) {
      console.error('交易失败:', error.reason);
      // 显示具体的失败原因给用户
    } else {
      console.error('未知错误:', error);
    }
  }

  // 示例：查询余额时的错误处理
  try {
    const balance = await erc20.balanceOf(wallet.address);
    console.log('Balance:', balance);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('查询余额时网络错误');
      // 可以重试或显示缓存的值
    }
  }

  sdk.disconnect();
}

errorHandlingExample().catch(console.error);

