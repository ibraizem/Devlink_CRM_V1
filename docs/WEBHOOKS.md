# Webhook Management System

## Overview

The webhook management system allows you to integrate third-party services with DevLink CRM by sending real-time HTTP notifications when specific events occur.

## Features

- ✅ **Webhook Registration & Configuration UI**: Easy-to-use interface for managing webhooks
- ✅ **Event Subscription Management**: Subscribe to specific events (lead created, updated, etc.)
- ✅ **Payload Transformation**: Transform payloads using custom JavaScript before sending
- ✅ **Retry Mechanism**: Automatic retry with exponential backoff on failures
- ✅ **Activity Logging**: Complete delivery history with status tracking
- ✅ **Security**: Secret key signature verification for each webhook delivery

## Supported Events

- `lead.created` - Triggered when a new lead is created
- `lead.updated` - Triggered when a lead is updated
- `lead.deleted` - Triggered when a lead is deleted
- `lead.status_changed` - Triggered when a lead's status changes
- `appointment.created` - Triggered when an appointment is created
- `appointment.updated` - Triggered when an appointment is updated
- `appointment.cancelled` - Triggered when an appointment is cancelled
- `file.uploaded` - Triggered when a file is uploaded
- `file.deleted` - Triggered when a file is deleted

## Getting Started

### 1. Create a Webhook

1. Navigate to **Webhooks** in the sidebar
2. Click **"Nouveau Webhook"**
3. Fill in the required information:
   - **Name**: A descriptive name for your webhook
   - **URL**: The endpoint that will receive the webhook data
   - **Description**: Optional description
   - **Events**: Select which events should trigger this webhook

### 2. Configure Advanced Settings

**Transformation (Optional)**
- Enable payload transformation to modify data before sending
- Write custom JavaScript to transform the payload
- Example:
  ```javascript
  return {
    ...payload,
    custom_field: 'value',
    timestamp: new Date().toISOString()
  };
  ```

**Retry Settings**
- Enable automatic retries on failure
- Configure maximum retry attempts (default: 3)
- Set initial retry delay in seconds (default: 5)
- Uses exponential backoff: delay × 2^retry_count

**Custom Headers**
- Add custom HTTP headers in JSON format
- Example:
  ```json
  {
    "Authorization": "Bearer your-token",
    "X-Custom-Header": "value"
  }
  ```

### 3. Security

Each webhook delivery includes these headers for verification:

- `X-Webhook-Signature`: Base64-encoded signature (secret_key:payload)
- `X-Webhook-Event`: The event type
- `X-Webhook-Delivery-Id`: Unique delivery ID

**Verifying Webhook Signatures**

```javascript
// Node.js example
const crypto = require('crypto');

function verifyWebhook(payload, signature, secretKey) {
  const expectedSignature = Buffer.from(
    `${secretKey}:${JSON.stringify(payload)}`
  ).toString('base64');
  
  return signature === expectedSignature;
}
```

## Webhook Payload Structure

All webhooks send a JSON payload with this structure:

```json
{
  "event_type": "lead.created",
  "payload": {
    // Event-specific data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Example: Lead Created Event

```json
{
  "event_type": "lead.created",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "+33612345678",
    "statut": "nouveau",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Monitoring & Debugging

### View Delivery History

1. Go to **Webhooks** page
2. Click the menu (⋮) next to any webhook
3. Select **"Voir les livraisons"**

You'll see:
- Delivery status (success, failed, pending, retrying)
- HTTP response status code
- Request/response payloads
- Error messages
- Retry attempts and timing

### Testing Webhooks

Click **"Tester"** in the webhook menu to send a test delivery:

```json
{
  "test": true,
  "message": "This is a test webhook delivery",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Triggering Webhooks Programmatically

### From Frontend Code

```typescript
import { triggerWebhooks } from '@/lib/utils/webhookTrigger';

// Trigger webhooks for a specific event
await triggerWebhooks('lead.created', {
  id: lead.id,
  nom: lead.nom,
  email: lead.email,
  // ... other data
});
```

### From Backend API Routes

```typescript
import { webhookService } from '@/lib/services/webhookService';

// Trigger all webhooks subscribed to this event
await webhookService.triggerWebhooksForEvent('lead.updated', {
  id: leadId,
  changes: updatedFields,
});
```

## Best Practices

1. **Use HTTPS**: Always use HTTPS endpoints for security
2. **Verify Signatures**: Always verify webhook signatures in your endpoint
3. **Respond Quickly**: Return a 200 response as soon as possible (within 5 seconds)
4. **Handle Retries**: Be idempotent - handle duplicate deliveries gracefully
5. **Log Everything**: Keep logs of all webhook deliveries for debugging
6. **Test Thoroughly**: Use the test feature before going live
7. **Monitor Failures**: Regularly check delivery status and fix issues

## Troubleshooting

### Webhook Not Triggering

- Check webhook status is "active"
- Verify the correct events are selected
- Check that events are being triggered in the application
- Review delivery logs for error messages

### Delivery Failures

- Verify the URL is correct and accessible
- Check for SSL certificate issues
- Ensure endpoint returns 200 status within timeout
- Review error messages in delivery logs
- Test endpoint manually with curl or Postman

### Transformation Issues

- Test transformation script with sample data
- Check JavaScript console for errors
- Ensure script returns valid JSON
- Use try-catch in transformation script
