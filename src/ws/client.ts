/**
 * WebSocket Client for event subscriptions
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import WebSocket from 'ws';
import { N42Config } from '../types';
import { NetworkError } from '../errors';

export class WSClient {
  private ws: WebSocket | null = null;
  private config: N42Config;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: N42Config) {
    this.config = config;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = typeof this.config.wsUrl === 'string' ? this.config.wsUrl : this.config.wsUrl.toString();
      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new NetworkError('WebSocket connection timeout'));
      }, this.config.timeoutMs || 12000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new NetworkError('WebSocket error', error as Error));
      });

      this.ws.on('message', (data: Buffer | string) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        this.scheduleReconnect();
      });
    });
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Ensure connection
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.connect().catch(console.error);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    if (message.type && this.listeners.has(message.type)) {
      const callbacks = this.listeners.get(message.type)!;
      callbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}

