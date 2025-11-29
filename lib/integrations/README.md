# API Integration Framework

A comprehensive framework for managing third-party API integrations with built-in authentication, rate limiting, quota management, and connection testing.

## Features

- **Multiple Authentication Methods**: OAuth2, API Keys, JWT tokens
- **Rate Limiting**: Fixed window, sliding window, and token bucket strategies
- **Quota Management**: Daily, monthly, and per-user quotas
- **Connection Testing**: Test integrations with retry logic
- **Pre-built Connectors**: Gmail, Outlook, LinkedIn, Zapier, Make, WhatsApp
- **Event System**: Monitor integration events and errors

## Architecture

```
lib/integrations/
├── types.ts                 # Core types and interfaces
├── auth/                    # Authentication adapters
│   ├── oauth2-adapter.ts   # OAuth2 implementation
│   ├── api-key-adapter.ts  # API Key implementation
│   ├── jwt-adapter.ts      # JWT implementation
│   └── index.ts
├── utils/                   # Utility classes
│   ├── rate-limiter.ts     # Rate limiting logic
│   ├── quota-manager.ts    # Quota management
│   ├── connection-tester.ts # Connection testing
│   └── index.ts
├── connectors/              # Pre-built connectors
│   ├── gmail-connector.ts
│   ├── outlook-connector.ts
│   ├── linkedin-connector.ts
│   ├── zapier-connector.ts
│   ├── make-connector.ts
│   ├── whatsapp-connector.ts
│   └── index.ts
├── examples/                # Usage examples
│   ├── setup-examples.ts
│   └── usage-examples.ts
├── integration-manager.ts   # Central management
└── index.ts
```

## Quick Start

### 1. Setup Integrations

```typescript
import { setupGmailIntegration, setupOutlookIntegration } from '@/lib/integrations/examples/setup-examples';

// Setup Gmail
setupGmailIntegration(
  'your-client-id',
  'your-client-secret',
  'http://localhost:3000/api/auth/callback/gmail'
);

// Setup Outlook
setupOutlookIntegration(
  'your-client-id',
  'your-client-secret',
  'http://localhost:3000/api/auth/callback/outlook'
);
```

### 2. Use Connectors

```typescript
import { integrationManager } from '@/lib/integrations/integration-manager';
import { GmailConnector } from '@/lib/integrations/connectors';

// Get connector
const gmail = integrationManager.getConnector<GmailConnector>('gmail-integration');

// Check rate limit
if (!await integrationManager.checkRateLimit('gmail-integration')) {
  console.error('Rate limit exceeded');
  return;
}

// Send email
const result = await gmail.sendEmail(
  ['recipient@example.com'],
  'Hello!',
  '<h1>Test Email</h1>',
  true
);

// Increment usage
if (result.success) {
  await integrationManager.incrementUsage('gmail-integration');
}
```

### 3. Test Connections

```typescript
// Test single integration
const result = await integrationManager.testConnection('gmail-integration');
console.log(result.success ? '✓' : '✗', result.message);

// Test all integrations
const results = await integrationManager.testAllConnections();
results.forEach((result, id) => {
  console.log(`${id}:`, result.success ? '✓' : '✗');
});
```

## Authentication

### OAuth2

```typescript
import { OAuth2Adapter } from '@/lib/integrations/auth';

const oauth2 = new OAuth2Adapter({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUri: 'http://localhost:3000/callback',
  scope: ['email', 'profile'],
});

// Get authorization URL
const authUrl = oauth2.getAuthorizationUrl();

// Exchange code for token
const credentials = await oauth2.exchangeCodeForToken(code);

// Refresh token
const newCredentials = await oauth2.refreshAccessToken(refreshToken);
```

### API Key

```typescript
import { ApiKeyAdapter } from '@/lib/integrations/auth';

const apiKey = new ApiKeyAdapter({
  key: 'your-api-key',
  headerName: 'X-API-Key',
  prefix: 'Bearer',
});

const headers = apiKey.getAuthHeaders();
// { 'X-API-Key': 'Bearer your-api-key' }
```

### JWT

```typescript
import { JWTAdapter } from '@/lib/integrations/auth';

const jwt = new JWTAdapter({
  secret: 'your-secret',
  algorithm: 'HS256',
  expiresIn: '1h',
});

// Generate token
const token = await jwt.generateToken({ userId: '123' });

// Verify token
const payload = await jwt.verifyToken(token);
```

## Rate Limiting

```typescript
import { RateLimiter } from '@/lib/integrations/utils';

const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  strategy: 'sliding', // 'fixed' | 'sliding' | 'token-bucket'
});

const allowed = await limiter.checkLimit('user-123');
if (!allowed) {
  console.log('Rate limit exceeded');
}
```

## Quota Management

```typescript
import { QuotaManager } from '@/lib/integrations/utils';

const quotaManager = new QuotaManager({
  daily: 1000,
  monthly: 30000,
  perUser: 500,
});

const allowed = await quotaManager.checkQuota('integration-id', 'user-123');
if (allowed) {
  await quotaManager.incrementUsage('integration-id', 'user-123');
}

const remaining = quotaManager.getRemainingQuota('integration-id', 'user-123');
console.log(`Remaining: ${remaining}`);
```

## Pre-built Connectors

### Gmail

```typescript
const gmail = new GmailConnector(config);

// Send email
await gmail.sendEmail(['to@example.com'], 'Subject', 'Body', true);

// Get messages
const messages = await gmail.getMessages(10, 'is:unread');

// Test connection
const result = await gmail.testConnection();
```

### Outlook

```typescript
const outlook = new OutlookConnector(config);

// Send email
await outlook.sendEmail(['to@example.com'], 'Subject', 'Body', true);

// Create event
await outlook.createEvent(
  'Meeting',
  new Date(),
  new Date(Date.now() + 3600000),
  ['attendee@example.com']
);
```

### LinkedIn

```typescript
const linkedin = new LinkedInConnector(config);

// Get profile
const profile = await linkedin.getProfile();

// Create post
await linkedin.createPost({
  text: 'Hello LinkedIn!',
  visibility: 'PUBLIC',
});
```

### Zapier

```typescript
const zapier = new ZapierConnector(config);

// Send lead data
await zapier.sendLeadData({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
});

// Trigger webhook
await zapier.triggerWebhook({ event: 'custom', data: {} });
```

### Make (formerly Integromat)

```typescript
const make = new MakeConnector(config);

// Send lead data
await make.sendLeadData({
  name: 'Jane Smith',
  email: 'jane@example.com',
  status: 'qualified',
});

// Trigger scenario
await make.triggerScenario({ type: 'event', data: {} });
```

### WhatsApp

```typescript
const whatsapp = new WhatsAppConnector(config);

// Send message
await whatsapp.sendMessage({
  to: '1234567890',
  body: 'Hello!',
});

// Send template
await whatsapp.sendTemplate('1234567890', {
  name: 'appointment_reminder',
  language: 'en',
  parameters: ['John', 'Tomorrow at 3 PM'],
});
```

## Event Monitoring

```typescript
import { integrationManager } from '@/lib/integrations/integration-manager';

// Listen to specific integration
integrationManager.addEventListener('gmail-integration', (event) => {
  if (event.type === 'rate_limit') {
    console.warn('Rate limit hit!');
  }
  if (event.type === 'quota_exceeded') {
    console.warn('Quota exceeded!');
  }
});

// Listen to all integrations
integrationManager.addEventListener('*', (event) => {
  console.log(`Event from ${event.integrationId}:`, event.type);
});
```

## Best Practices

1. **Always check rate limits** before making requests
2. **Monitor quota usage** to avoid hitting limits
3. **Use connection testing** to verify integrations
4. **Handle errors gracefully** with try-catch blocks
5. **Refresh tokens proactively** before they expire
6. **Store credentials securely** (never in code)
7. **Use environment variables** for sensitive data
8. **Implement retry logic** for transient failures
9. **Log integration events** for debugging
10. **Test integrations regularly** in production

## Environment Variables

```env
# Gmail
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret

# Outlook
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret

# Zapier
ZAPIER_WEBHOOK_URL=your-webhook-url

# Make
MAKE_WEBHOOK_URL=your-webhook-url

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

## License

MIT
