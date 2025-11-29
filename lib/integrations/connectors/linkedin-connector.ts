import { BaseIntegrationConnector, IntegrationConfig, ConnectionTestResult, IntegrationCredentials } from '../types';
import { OAuth2Adapter } from '../auth/oauth2-adapter';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  headline?: string;
}

export interface LinkedInPost {
  text: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  media?: {
    url: string;
    title?: string;
  };
}

export class LinkedInConnector extends BaseIntegrationConnector {
  private oauth2Adapter?: OAuth2Adapter;
  private readonly baseUrl = 'https://api.linkedin.com/v2';

  constructor(config: IntegrationConfig) {
    super(config);
    
    if (config.credentials?.clientId && config.credentials?.clientSecret) {
      this.oauth2Adapter = new OAuth2Adapter({
        clientId: config.credentials.clientId,
        clientSecret: config.credentials.clientSecret,
        authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        redirectUri: config.metadata?.redirectUri || '',
        scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      });
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: this.getHeaders(),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'LinkedIn connection successful',
          latency,
          metadata: { id: data.id },
        };
      }

      return {
        success: false,
        message: `Connection failed: ${response.statusText}`,
        latency,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error : undefined,
      };
    }
  }

  async getProfile(): Promise<LinkedInProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      const emailResponse = await fetch(`${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: this.getHeaders(),
      });

      let email: string | undefined;
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        email = emailData.elements?.[0]?.['handle~']?.emailAddress;
      }

      return {
        id: data.id,
        firstName: data.localizedFirstName,
        lastName: data.localizedLastName,
        email,
        profilePicture: data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
        headline: data.headline?.localized?.en_US,
      };
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      return null;
    }
  }

  async createPost(post: LinkedInPost): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const profile = await this.getProfile();
      if (!profile) {
        return { success: false, error: 'Failed to get user profile' };
      }

      const shareData: any = {
        author: `urn:li:person:${profile.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.text,
            },
            shareMediaCategory: post.media ? 'ARTICLE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': post.visibility,
        },
      };

      if (post.media) {
        shareData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          originalUrl: post.media.url,
          title: {
            text: post.media.title || '',
          },
        }];
      }

      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(shareData),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, postId: data.id };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async refreshCredentials(): Promise<IntegrationCredentials> {
    if (!this.oauth2Adapter || !this.credentials.refreshToken) {
      throw new Error('OAuth2 adapter not configured or refresh token missing');
    }

    return await this.oauth2Adapter.refreshAccessToken(this.credentials.refreshToken);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}
