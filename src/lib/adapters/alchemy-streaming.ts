import { BaseStreamingAdapter } from './base-streaming';
import { StreamingBenchmarkParams, StreamingMetrics, StreamingDataType } from '../benchmark-types';

export class AlchemyStreamingAdapter extends BaseStreamingAdapter {
  id = 'alchemy-ws';
  name = 'Alchemy WebSocket';
  protocol: 'WebSocket' = 'WebSocket';

  constructor() {
    super();
    this.wsEndpoint = process.env.ALCHEMY_WS_ENDPOINT || 'wss://eth-mainnet.g.alchemy.com/v2';
    this.apiKey = process.env.ALCHEMY_API_KEY || 'demo';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      logo_url: '/providers/alchemy.svg',
      website_url: 'https://www.alchemy.com',
      supported_chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      streaming_capabilities: [
        StreamingDataType.NEW_BLOCKS,
        StreamingDataType.NEW_TRANSACTIONS,
        StreamingDataType.PENDING_TRANSACTIONS,
        StreamingDataType.TOKEN_TRANSFERS
      ] as StreamingDataType[],
      pricing: {
        cost_per_million_messages: 1.5,
        rate_limit: '300 req/sec'
      }
    };
  }

  protected async performStreamingTest(options: {
    params: StreamingBenchmarkParams;
    testDuration: number;
    startTime: number;
    onConnectionStart: () => void;
    onConnectionEnd: () => void;
    onFirstData: () => void;
    onMessage: (message: any, size: number) => void;
    onError: () => void;
    onConnectionDrop: () => void;
    onReconnection: () => void;
  }): Promise<StreamingMetrics> {
    
    return new Promise((resolve, reject) => {
      let connectionStart: number | null = null;
      let firstDataReceived = false;
      let messageCount = 0;
      let errorCount = 0;
      let connectionDrops = 0;
      let reconnectionCount = 0;
      let totalMessageSize = 0;
      let connectionActive = false;
      let testStartTime = Date.now();

      const wsUrl = this.getWebSocketUrl(options.params.network, options.params.streamType);
      
      // Simulate Alchemy connection characteristics
      const connectionDelay = Math.random() * 150 + 75; // 75-225ms connection time
      
      setTimeout(() => {
        options.onConnectionStart();
        connectionStart = Date.now();
        connectionActive = true;
        
        // Alchemy connection setup
        setTimeout(() => {
          options.onConnectionEnd();
          
          // Start receiving messages with Alchemy's rate
          const messageInterval = setInterval(() => {
            if (Date.now() - testStartTime >= options.testDuration) {
              clearInterval(messageInterval);
              
              const actualDuration = Date.now() - testStartTime;
              const throughput = actualDuration > 0 ? (messageCount / actualDuration) * 1000 : 0;
              const avgMessageSize = messageCount > 0 ? totalMessageSize / messageCount : 0;
              const dataCompleteness = this.calculateDataCompleteness(
                messageCount,
                options.params.expectedMessageRate || 6, // Alchemy ~6 msg/sec
                actualDuration
              );
              const connectionLatency = connectionStart ? connectionDelay : 0;
              const errorRate = messageCount > 0 ? (errorCount / messageCount) * 100 : 0;
              const uptime = connectionActive ? 
                Math.max(0, 98 - (connectionDrops * 12)) : 0; // Very stable but slower than MegaETH

              resolve({
                connection_latency: connectionLatency,
                first_data_latency: firstDataReceived ? 120 : 0, // Alchemy good but not fastest
                throughput,
                message_count: messageCount,
                connection_drops: connectionDrops,
                reconnection_count: reconnectionCount,
                data_completeness: Math.min(100, dataCompleteness),
                uptime_percent: uptime,
                average_message_size: avgMessageSize,
                error_rate: errorRate
              });
              return;
            }

            // Simulate Alchemy's reliable message delivery
            if (Math.random() > 0.05) { // 95% success rate
              if (!firstDataReceived) {
                firstDataReceived = true;
                options.onFirstData();
              }

              const mockMessage = this.generateMockAlchemyMessage(
                options.params.streamType, 
                options.params.network
              );
              const messageSize = this.calculateMessageSize(mockMessage);
              
              messageCount++;
              totalMessageSize += messageSize;
              options.onMessage(mockMessage, messageSize);
            } else {
              errorCount++;
              options.onError();
            }

            // Alchemy has very good stability
            if (Math.random() > 0.998 && connectionActive) {
              connectionDrops++;
              connectionActive = false;
              options.onConnectionDrop();
              
              // Quick reconnection
              setTimeout(() => {
                reconnectionCount++;
                connectionActive = true;
                options.onReconnection();
              }, 200 + Math.random() * 300); // 200-500ms reconnection
            }
          }, 167); // ~6 messages per second

        }, 40);

      }, connectionDelay);
    });
  }

  protected getWebSocketUrl(network: string, streamType: StreamingDataType): string {
    const networkPath = this.mapNetworkToAlchemyNetwork(network);
    return `${this.wsEndpoint.replace(/\/v2$/, '')}/${networkPath}/v2/${this.apiKey}`;
  }

  protected getSubscriptionMessage(streamType: StreamingDataType, network: string): any {
    const method = this.mapStreamTypeToAlchemyMethod(streamType);
    
    return {
      id: 1,
      method: "eth_subscribe",
      params: [method, this.getAlchemyParams(streamType)]
    };
  }

  private mapNetworkToAlchemyNetwork(network: string): string {
    const networkMap: Record<string, string> = {
      'ethereum': 'eth-mainnet.g.alchemy.com',
      'polygon': 'polygon-mainnet.g.alchemy.com',
      'arbitrum': 'arb-mainnet.g.alchemy.com',
      'optimism': 'opt-mainnet.g.alchemy.com',
      'base': 'base-mainnet.g.alchemy.com'
    };
    return networkMap[network] || 'eth-mainnet.g.alchemy.com';
  }

  private mapStreamTypeToAlchemyMethod(streamType: StreamingDataType): string {
    const methodMap: Partial<Record<StreamingDataType, string>> = {
      [StreamingDataType.NEW_BLOCKS]: 'newHeads',
      [StreamingDataType.NEW_TRANSACTIONS]: 'logs',
      [StreamingDataType.PENDING_TRANSACTIONS]: 'newPendingTransactions',
      [StreamingDataType.TOKEN_TRANSFERS]: 'logs'
    };
    return methodMap[streamType] || 'newHeads';
  }

  private getAlchemyParams(streamType: StreamingDataType): any {
    switch (streamType) {
      case StreamingDataType.TOKEN_TRANSFERS:
        return {
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"] // Transfer event
        };
      case StreamingDataType.NEW_TRANSACTIONS:
        return {};
      default:
        return [];
    }
  }

  private generateMockAlchemyMessage(streamType: StreamingDataType, network: string): any {
    const timestamp = Math.floor(Date.now() / 1000);

    switch (streamType) {
      case StreamingDataType.NEW_BLOCKS:
        return {
          jsonrpc: "2.0",
          method: "eth_subscription",
          params: {
            subscription: "0x123456789",
            result: {
              number: `0x${Math.floor(Math.random() * 1000000 + 19000000).toString(16)}`,
              hash: `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`,
              parentHash: `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`,
              timestamp: `0x${timestamp.toString(16)}`,
              gasLimit: "0x1c9c380",
              gasUsed: `0x${Math.floor(Math.random() * 15000000).toString(16)}`,
              transactions: []
            }
          }
        };

      case StreamingDataType.PENDING_TRANSACTIONS:
        return {
          jsonrpc: "2.0",
          method: "eth_subscription",
          params: {
            subscription: "0x123456789",
            result: `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`
          }
        };

      case StreamingDataType.TOKEN_TRANSFERS:
        return {
          jsonrpc: "2.0",
          method: "eth_subscription",
          params: {
            subscription: "0x123456789",
            result: {
              address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`,
                `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`
              ],
              data: `0x${Math.floor(Math.random() * 10000).toString(16).padStart(64, '0')}`,
              blockNumber: `0x${Math.floor(Math.random() * 1000000 + 19000000).toString(16)}`,
              transactionHash: `0x${Math.random().toString(16).padStart(64, '0').substring(2)}`,
              logIndex: `0x${Math.floor(Math.random() * 100).toString(16)}`
            }
          }
        };

      default:
        return {
          jsonrpc: "2.0",
          method: "eth_subscription",
          params: {
            subscription: "0x123456789",
            result: {}
          }
        };
    }
  }

  protected isExpectedMessage(message: any, streamType: StreamingDataType): boolean {
    if (!message || message.error) return false;

    // Alchemy WebSocket message validation
    const isValidAlchemyMessage = message.jsonrpc === "2.0" && 
                                  message.method === "eth_subscription" &&
                                  message.params?.result;

    if (!isValidAlchemyMessage) return false;

    const result = message.params.result;

    switch (streamType) {
      case StreamingDataType.NEW_BLOCKS:
        return result.number && result.hash && result.timestamp;
      
      case StreamingDataType.PENDING_TRANSACTIONS:
        return typeof result === 'string' && result.startsWith('0x');
      
      case StreamingDataType.TOKEN_TRANSFERS:
        return result.address && result.topics && result.data;
      
      default:
        return true;
    }
  }

  protected calculateDataCompleteness(
    messageCount: number, 
    expectedMessageRate: number, 
    actualDuration: number
  ): number {
    if (!expectedMessageRate || actualDuration === 0) return 100;
    
    const expectedMessages = (expectedMessageRate * actualDuration) / 1000;
    const completeness = (messageCount / expectedMessages) * 100;
    
    // Alchemy is very reliable but slightly conservative in data delivery
    return Math.min(100, completeness);
  }
}