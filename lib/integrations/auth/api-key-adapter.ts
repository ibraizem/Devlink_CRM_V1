import { ApiKeyConfig, IntegrationCredentials, AuthType } from '../types';

export class ApiKeyAdapter {
  private config: ApiKeyConfig;

  constructor(config: ApiKeyConfig) {
    this.config = config;
  }

  createCredentials(): IntegrationCredentials {
    return {
      type: AuthType.API_KEY,
      apiKey: this.config.key,
      metadata: {
        headerName: this.config.headerName,
        queryParamName: this.config.queryParamName,
        prefix: this.config.prefix,
      },
    };
  }

  getAuthHeaders(): Record<string, string> {
    const headerName = this.config.headerName || 'X-API-Key';
    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    
    return {
      [headerName]: `${prefix}${this.config.key}`,
    };
  }

  getAuthQueryParams(): Record<string, string> {
    if (!this.config.queryParamName) {
      return {};
    }

    return {
      [this.config.queryParamName]: this.config.key,
    };
  }

  appendToUrl(url: string): string {
    if (!this.config.queryParamName) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.config.queryParamName}=${encodeURIComponent(this.config.key)}`;
  }

  validate(): boolean {
    return Boolean(this.config.key && this.config.key.length > 0);
  }

  static fromCredentials(credentials: IntegrationCredentials): ApiKeyAdapter {
    if (!credentials.apiKey) {
      throw new Error('API key not found in credentials');
    }

    return new ApiKeyAdapter({
      key: credentials.apiKey,
      headerName: credentials.metadata?.headerName,
      queryParamName: credentials.metadata?.queryParamName,
      prefix: credentials.metadata?.prefix,
    });
  }
}
