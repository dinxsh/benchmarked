const API_BASE_URL = ''; // Relative path for internal API

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Leaderboard
  async getLeaderboard(params?: { chain?: string; sort?: string }) {
    const query = new URLSearchParams(params as any).toString();
    // Map to new single-route structure
    return this.get<any>(`/api/benchmarks?type=leaderboard&${query}`);
  }

  // Provider detail
  async getProvider(slug: string) {
    return this.get<any>(`/api/benchmarks?type=provider&slug=${slug}`);
  }

  // Metrics history
  async getMetrics(
    provider: string,
    params?: {
      metric?: string;
      timeframe?: string;
      chain?: string;
    }
  ) {
    const query = new URLSearchParams(params as any).toString();
    return this.get<any>(
      `/api/benchmarks?type=metrics&provider=${provider}&${query}`
    );
  }

  // Compare
  async compare(providerA: string, providerB: string) {
    return this.get<any>(
      `/api/benchmarks?type=compare&a=${providerA}&b=${providerB}`
    );
  }
}

export const api = new ApiClient();
