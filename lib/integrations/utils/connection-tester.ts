import { IntegrationConfig, ConnectionTestResult, IntegrationCredentials } from '../types';
import { OAuth2Adapter } from '../auth/oauth2-adapter';
import { ApiKeyAdapter } from '../auth/api-key-adapter';

export class ConnectionTester {
  async testConnection(
    config: IntegrationConfig,
    testEndpoint?: string
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const url = testEndpoint || config.baseUrl || '';
      if (!url) {
        throw new Error('No test endpoint provided');
      }

      const headers = this.buildHeaders(config.credentials);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          latency,
          metadata: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      return {
        success: false,
        message: `Connection failed: ${response.statusText}`,
        latency,
        metadata: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latency,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async testWithRetry(
    config: IntegrationConfig,
    testEndpoint?: string,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<ConnectionTestResult> {
    let lastResult: ConnectionTestResult | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      lastResult = await this.testConnection(config, testEndpoint);

      if (lastResult.success) {
        return lastResult;
      }

      if (attempt < maxRetries - 1) {
        await this.delay(delayMs * (attempt + 1));
      }
    }

    return lastResult || {
      success: false,
      message: 'All retry attempts failed',
    };
  }

  async testMultiple(
    configs: IntegrationConfig[],
    testEndpoints?: Map<string, string>
  ): Promise<Map<string, ConnectionTestResult>> {
    const results = new Map<string, ConnectionTestResult>();

    await Promise.all(
      configs.map(async (config) => {
        const endpoint = testEndpoints?.get(config.id);
        const result = await this.testConnection(config, endpoint);
        results.set(config.id, result);
      })
    );

    return results;
  }

  private buildHeaders(credentials?: IntegrationCredentials): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!credentials) {
      return headers;
    }

    switch (credentials.type) {
      case 'oauth2':
        if (credentials.accessToken) {
          headers['Authorization'] = `Bearer ${credentials.accessToken}`;
        }
        break;
      case 'api_key':
        if (credentials.apiKey) {
          const adapter = ApiKeyAdapter.fromCredentials(credentials);
          Object.assign(headers, adapter.getAuthHeaders());
        }
        break;
      case 'jwt':
      case 'bearer':
        if (credentials.accessToken) {
          headers['Authorization'] = `Bearer ${credentials.accessToken}`;
        }
        break;
      case 'basic':
        if (credentials.apiKey && credentials.apiSecret) {
          const encoded = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;
    }

    return headers;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
