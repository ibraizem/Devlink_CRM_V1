import { JWTConfig, IntegrationCredentials, AuthType } from '../types';

export class JWTAdapter {
  private config: JWTConfig;

  constructor(config: JWTConfig) {
    this.config = config;
  }

  async generateToken(payload: Record<string, any>): Promise<string> {
    const header = {
      alg: this.config.algorithm || 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: now,
      ...(this.config.expiresIn && { exp: now + this.parseExpiresIn(this.config.expiresIn) }),
      ...(this.config.issuer && { iss: this.config.issuer }),
      ...(this.config.audience && { aud: this.config.audience }),
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async verifyToken(token: string): Promise<Record<string, any>> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = await this.sign(`${encodedHeader}.${encodedPayload}`);

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    if (this.config.issuer && payload.iss !== this.config.issuer) {
      throw new Error('Invalid issuer');
    }

    if (this.config.audience && payload.aud !== this.config.audience) {
      throw new Error('Invalid audience');
    }

    return payload;
  }

  createCredentials(token: string): IntegrationCredentials {
    return {
      type: AuthType.JWT,
      accessToken: token,
      metadata: {
        algorithm: this.config.algorithm,
        issuer: this.config.issuer,
        audience: this.config.audience,
      },
    };
  }

  getAuthHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  private async sign(data: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.config.secret);
      const messageData = encoder.encode(data);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      return this.base64UrlEncode(new Uint8Array(signature));
    }

    return this.simpleHmacSha256(data, this.config.secret);
  }

  private simpleHmacSha256(data: string, secret: string): string {
    const crypto = require('crypto');
    return this.base64UrlEncode(
      crypto.createHmac('sha256', secret).update(data).digest()
    );
  }

  private base64UrlEncode(data: string | Uint8Array | Buffer): string {
    let base64: string;
    
    if (typeof data === 'string') {
      base64 = Buffer.from(data).toString('base64');
    } else if (data instanceof Uint8Array) {
      base64 = Buffer.from(data).toString('base64');
    } else {
      base64 = data.toString('base64');
    }

    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const matches = expiresIn.match(/(\d+)([smhd])/);
    if (!matches) {
      throw new Error('Invalid expiresIn format');
    }

    const value = parseInt(matches[1], 10);
    const unit = matches[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      if (!payload.exp) return false;

      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
}
