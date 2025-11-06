/**
 * Wallet management (non-custodial)
 * Note: In production, private keys should be stored in secure storage (Keychain/Keystore)
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { ethers } from 'ethers';
import { WalletInfo } from '../types';

export enum MnemonicStrength {
  WORDS_12 = 128,
  WORDS_15 = 160,
  WORDS_18 = 192,
  WORDS_21 = 224,
  WORDS_24 = 256,
}

export class Wallet {
  private wallet: ethers.Wallet;
  private mnemonic?: string;

  private constructor(wallet: ethers.Wallet, mnemonic?: string) {
    this.wallet = wallet;
    this.mnemonic = mnemonic;
  }

  /**
   * Create a new wallet
   */
  static create(strength: MnemonicStrength = MnemonicStrength.WORDS_12): Wallet {
    const mnemonic = ethers.Mnemonic.entropyToPhrase(
      ethers.randomBytes(strength / 8)
    );
    return Wallet.import(mnemonic);
  }

  /**
   * Import wallet from mnemonic
   */
  static import(mnemonic: string, passphrase?: string): Wallet {
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase);
    const wallet = new ethers.Wallet(hdNode.privateKey);
    return new Wallet(wallet, mnemonic);
  }

  /**
   * Import wallet from private key
   */
  static fromPrivateKey(privateKey: string): Wallet {
    const wallet = new ethers.Wallet(privateKey);
    return new Wallet(wallet);
  }

  /**
   * Get wallet address
   */
  get address(): string {
    return this.wallet.address;
  }

  /**
   * Get mnemonic (if available)
   */
  getMnemonic(): string | undefined {
    return this.mnemonic;
  }

  /**
   * Get private key (WARNING: In production, this should be handled securely)
   */
  getPrivateKey(): string {
    return this.wallet.privateKey;
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    return await this.wallet.signTransaction(transaction);
  }

  /**
   * Sign message
   */
  signMessage(message: string): string {
    return this.wallet.signMessageSync(message);
  }

  /**
   * Connect to provider
   */
  connect(provider: ethers.Provider): ethers.Wallet {
    return this.wallet.connect(provider);
  }

  /**
   * Get wallet info (for display purposes)
   */
  getInfo(): WalletInfo {
    return {
      address: this.address,
      mnemonic: this.mnemonic,
    };
  }

  /**
   * Persist securely (mock implementation - in production use Keychain/Keystore)
   * This is a placeholder - actual implementation depends on platform
   */
  async persistSecurely(label: string): Promise<void> {
    // In production:
    // iOS: Use Keychain Services
    // Android: Use Android Keystore / EncryptedSharedPreferences
    // This is just a placeholder
    console.warn('persistSecurely is a placeholder - implement platform-specific secure storage');
  }
}

