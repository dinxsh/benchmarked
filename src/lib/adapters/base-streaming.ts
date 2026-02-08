import { 
  IStreamingAdapter, 
  StreamingBenchmarkParams, 
  StreamingBenchmarkResult, 
  StreamingMetrics, 
  StreamingDataType 
} from '../benchmark-types';

export abstract class BaseStreamingAdapter implements IStreamingAdapter {
  abstract id: string;
  abstract name: string;
  abstract protocol: 'WebSocket' | 'SSE' | 'GraphQL Subscription';
  
  protected wsEndpoint: string = '';
  protected apiKey?: string;
  protected defaultDuration: number = 30000; // 30 seconds

  abstract getMetadata(): {
    id: string;
    name: string;
    logo_url: string;
    website_url: string;
    supported_chains: string[];
    streaming_capabilities: StreamingDataType[];
    pricing: {
      cost_per_million_messages?: number;
      rate_limit: string;
    };
  };

  async benchmarkStream(params: StreamingBenchmarkParams): Promise<StreamingBenchmarkResult> {
    const testDuration = params.duration || this.defaultDuration;
    const startTime = Date.now();
    
    let connectionStart: number | null = null;
    let connectionEnd: number | null = null;
    let firstDataTime: number | null = null;
    let messageCount = 0;
    let errorCount = 0;
    let connectionDrops = 0;
    let reconnectionCount = 0;
    let totalMessageSize = 0;
    let sampleMessages: any[] = [];
    
    const metadata = this.getMetadata();

    try {
      const metrics: StreamingMetrics = await this.performStreamingTest({
        params,
        testDuration,
        startTime,
        onConnectionStart: () => { connectionStart = Date.now(); },
        onConnectionEnd: () => { connectionEnd = Date.now(); },
        onFirstData: () => { firstDataTime = Date.now(); },
        onMessage: (message: any, size: number) => {
          messageCount++;
          totalMessageSize += size;
          if (sampleMessages.length < 3) {
            sampleMessages.push(message);
          }
        },
        onError: () => { errorCount++; },
        onConnectionDrop: () => { connectionDrops++; },
        onReconnection: () => { reconnectionCount++; }
      });

      return {
        provider: {
          id: this.id,
          name: this.name,
          type: this.protocol,
          logo: metadata.logo_url,
          color: this.getProviderColor(),
          hasStreaming: true,
          endpoint: this.wsEndpoint,
          protocol: this.protocol,
          description: `${this.name} streaming API for ${params.streamType}`
        },
        status: 'success',
        metrics,
        testDuration: Date.now() - startTime,
        sampleMessages: sampleMessages.slice(0, 3)
      };

    } catch (error) {
      return {
        provider: {
          id: this.id,
          name: this.name,
          type: this.protocol,
          logo: metadata.logo_url,
          color: this.getProviderColor(),
          hasStreaming: true,
          endpoint: this.wsEndpoint,
          protocol: this.protocol,
          description: `${this.name} streaming API for ${params.streamType}`
        },
        status: 'error',
        metrics: {
          connection_latency: connectionEnd && connectionStart ? connectionEnd - connectionStart : 0,
          first_data_latency: firstDataTime && connectionEnd ? firstDataTime - connectionEnd : 0,
          throughput: 0,
          message_count: messageCount,
          connection_drops: connectionDrops,
          reconnection_count: reconnectionCount,
          data_completeness: 0,
          uptime_percent: 0,
          average_message_size: messageCount > 0 ? totalMessageSize / messageCount : 0,
          error_rate: messageCount > 0 ? (errorCount / messageCount) * 100 : 100
        },
        testDuration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  protected abstract performStreamingTest(options: {
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
  }): Promise<StreamingMetrics>;

  protected getWebSocketUrl(network: string, streamType: StreamingDataType): string {
    // Override in subclasses
    return this.wsEndpoint;
  }

  protected getSubscriptionMessage(streamType: StreamingDataType, network: string): any {
    // Override in subclasses to return provider-specific subscription message
    return {};
  }

  protected parseMessage(rawMessage: string): any {
    try {
      return JSON.parse(rawMessage);
    } catch {
      return rawMessage;
    }
  }

  protected calculateMessageSize(message: any): number {
    return new Blob([JSON.stringify(message)]).size;
  }

  protected getProviderColor(): string {
    // Default colors for different providers
    const colors: Record<string, string> = {
      'megaeth': '#FF6B35',
      'zerion': '#5B4AE2',
      'alchemy': '#4F46E5',
      'infura': '#FF6B35',
      'quicknode': '#1DA1F2',
      'ankr': '#00D4AA'
    };
    return colors[this.id] || '#6B7280';
  }

  protected isExpectedMessage(message: any, streamType: StreamingDataType): boolean {
    // Basic validation - override in subclasses for provider-specific logic
    if (!message) return false;
    
    switch (streamType) {
      case StreamingDataType.NEW_BLOCKS:
        return message.block || message.result?.hash || message.params?.result?.hash;
      case StreamingDataType.NEW_TRANSACTIONS:
        return message.transaction || message.result?.hash || message.params?.result?.hash;
      case StreamingDataType.PRICE_FEEDS:
        return message.price || message.result?.price || message.data?.price;
      case StreamingDataType.DEX_TRADES:
        return message.trade || message.swap || message.result?.trade;
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
    return Math.min(100, (messageCount / expectedMessages) * 100);
  }
}