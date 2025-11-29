import { integrationManager } from '../integration-manager';
import { IntegrationType, AuthType } from '../types';

export function setupGmailIntegration(clientId: string, clientSecret: string, redirectUri: string) {
  integrationManager.registerIntegration({
    id: 'gmail-integration',
    name: 'Gmail',
    type: IntegrationType.EMAIL,
    authType: AuthType.OAUTH2,
    enabled: true,
    credentials: {
      type: AuthType.OAUTH2,
      clientId,
      clientSecret,
    },
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      strategy: 'sliding',
    },
    quota: {
      daily: 1000,
      perUser: 500,
    },
    baseUrl: 'https://gmail.googleapis.com/gmail/v1',
    metadata: {
      redirectUri,
    },
  });
}

export function setupOutlookIntegration(clientId: string, clientSecret: string, redirectUri: string) {
  integrationManager.registerIntegration({
    id: 'outlook-integration',
    name: 'Outlook',
    type: IntegrationType.EMAIL,
    authType: AuthType.OAUTH2,
    enabled: true,
    credentials: {
      type: AuthType.OAUTH2,
      clientId,
      clientSecret,
    },
    rateLimit: {
      maxRequests: 120,
      windowMs: 60000,
      strategy: 'token-bucket',
    },
    quota: {
      daily: 2000,
      perUser: 1000,
    },
    baseUrl: 'https://graph.microsoft.com/v1.0',
    metadata: {
      redirectUri,
    },
  });
}

export function setupLinkedInIntegration(clientId: string, clientSecret: string, redirectUri: string) {
  integrationManager.registerIntegration({
    id: 'linkedin-integration',
    name: 'LinkedIn',
    type: IntegrationType.SOCIAL,
    authType: AuthType.OAUTH2,
    enabled: true,
    credentials: {
      type: AuthType.OAUTH2,
      clientId,
      clientSecret,
    },
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000,
      strategy: 'fixed',
    },
    quota: {
      daily: 500,
      perUser: 250,
    },
    baseUrl: 'https://api.linkedin.com/v2',
    metadata: {
      redirectUri,
    },
  });
}

export function setupZapierIntegration(webhookUrl: string, apiKey?: string) {
  integrationManager.registerIntegration({
    id: 'zapier-integration',
    name: 'Zapier',
    type: IntegrationType.AUTOMATION,
    authType: AuthType.API_KEY,
    enabled: true,
    credentials: apiKey ? {
      type: AuthType.API_KEY,
      apiKey,
    } : undefined,
    rateLimit: {
      maxRequests: 200,
      windowMs: 60000,
      strategy: 'sliding',
    },
    webhookUrl,
  });
}

export function setupMakeIntegration(webhookUrl: string, apiKey?: string) {
  integrationManager.registerIntegration({
    id: 'make-integration',
    name: 'Make',
    type: IntegrationType.AUTOMATION,
    authType: AuthType.API_KEY,
    enabled: true,
    credentials: apiKey ? {
      type: AuthType.API_KEY,
      apiKey,
    } : undefined,
    rateLimit: {
      maxRequests: 200,
      windowMs: 60000,
      strategy: 'sliding',
    },
    webhookUrl,
  });
}

export function setupWhatsAppIntegration(accessToken: string, phoneNumberId: string) {
  integrationManager.registerIntegration({
    id: 'whatsapp-integration',
    name: 'WhatsApp',
    type: IntegrationType.MESSAGING,
    authType: AuthType.API_KEY,
    enabled: true,
    credentials: {
      type: AuthType.API_KEY,
      apiKey: accessToken,
    },
    rateLimit: {
      maxRequests: 80,
      windowMs: 60000,
      strategy: 'token-bucket',
    },
    quota: {
      daily: 1000,
      perUser: 100,
    },
    baseUrl: 'https://graph.facebook.com/v18.0',
    metadata: {
      phoneNumberId,
      useQueryParam: true,
    },
  });
}
