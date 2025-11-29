import { OAuth2Config, OAuth2TokenResponse, IntegrationCredentials, AuthType } from '../types';

export class OAuth2Adapter {
  private config: OAuth2Config;

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state: state || this.config.state || this.generateState(),
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<IntegrationCredentials> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokenData: OAuth2TokenResponse = await response.json();
    return this.mapTokenToCredentials(tokenData);
  }

  async refreshAccessToken(refreshToken: string): Promise<IntegrationCredentials> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokenData: OAuth2TokenResponse = await response.json();
    return this.mapTokenToCredentials(tokenData);
  }

  async revokeToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    const revokeUrl = this.config.tokenUrl.replace('/token', '/revoke');
    
    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  }

  private mapTokenToCredentials(tokenData: OAuth2TokenResponse): IntegrationCredentials {
    return {
      type: AuthType.OAUTH2,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000) 
        : undefined,
      scope: tokenData.scope ? tokenData.scope.split(' ') : this.config.scope,
      metadata: {
        tokenType: tokenData.token_type || 'Bearer',
      },
    };
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  isTokenExpired(credentials: IntegrationCredentials): boolean {
    if (!credentials.expiresAt) return false;
    return new Date() >= new Date(credentials.expiresAt);
  }

  shouldRefreshToken(credentials: IntegrationCredentials, bufferMinutes: number = 5): boolean {
    if (!credentials.expiresAt) return false;
    const bufferMs = bufferMinutes * 60 * 1000;
    return new Date().getTime() + bufferMs >= new Date(credentials.expiresAt).getTime();
  }
}
