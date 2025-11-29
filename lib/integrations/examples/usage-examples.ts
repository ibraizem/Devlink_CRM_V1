import { integrationManager } from '../integration-manager';
import { GmailConnector, OutlookConnector, LinkedInConnector, ZapierConnector, MakeConnector, WhatsAppConnector } from '../connectors';

export async function sendGmailExample() {
  const gmailConnector = integrationManager.getConnector<GmailConnector>('gmail-integration');
  
  if (!gmailConnector) {
    console.error('Gmail integration not found');
    return;
  }

  if (!await integrationManager.checkRateLimit('gmail-integration')) {
    console.error('Rate limit exceeded');
    return;
  }

  if (!await integrationManager.checkQuota('gmail-integration')) {
    console.error('Quota exceeded');
    return;
  }

  const result = await gmailConnector.sendEmail(
    ['recipient@example.com'],
    'Test Email',
    '<h1>Hello from Gmail API!</h1>',
    true
  );

  if (result.success) {
    await integrationManager.incrementUsage('gmail-integration');
    console.log('Email sent:', result.messageId);
  } else {
    console.error('Failed to send email:', result.error);
  }
}

export async function sendOutlookEmailExample() {
  const outlookConnector = integrationManager.getConnector<OutlookConnector>('outlook-integration');
  
  if (!outlookConnector) {
    console.error('Outlook integration not found');
    return;
  }

  const result = await outlookConnector.sendEmail(
    ['recipient@example.com'],
    'Test from Outlook',
    '<p>Hello from Microsoft Graph API!</p>',
    true
  );

  if (result.success) {
    await integrationManager.incrementUsage('outlook-integration');
    console.log('Email sent successfully');
  }
}

export async function createOutlookEventExample() {
  const outlookConnector = integrationManager.getConnector<OutlookConnector>('outlook-integration');
  
  if (!outlookConnector) {
    console.error('Outlook integration not found');
    return;
  }

  const start = new Date();
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const result = await outlookConnector.createEvent(
    'Team Meeting',
    start,
    end,
    ['attendee@example.com'],
    '<p>Let\'s discuss the project updates</p>',
    'Conference Room A'
  );

  if (result.success) {
    console.log('Event created:', result.eventId);
  }
}

export async function postToLinkedInExample() {
  const linkedInConnector = integrationManager.getConnector<LinkedInConnector>('linkedin-integration');
  
  if (!linkedInConnector) {
    console.error('LinkedIn integration not found');
    return;
  }

  const result = await linkedInConnector.createPost({
    text: 'Excited to share our new product launch! 🚀',
    visibility: 'PUBLIC',
    media: {
      url: 'https://example.com/product-image.jpg',
      title: 'Our New Product',
    },
  });

  if (result.success) {
    await integrationManager.incrementUsage('linkedin-integration');
    console.log('Post created:', result.postId);
  }
}

export async function sendToZapierExample() {
  const zapierConnector = integrationManager.getConnector<ZapierConnector>('zapier-integration');
  
  if (!zapierConnector) {
    console.error('Zapier integration not found');
    return;
  }

  const result = await zapierConnector.sendLeadData({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    notes: 'Interested in our premium plan',
  });

  if (result.success) {
    console.log('Lead data sent to Zapier');
  }
}

export async function sendToMakeExample() {
  const makeConnector = integrationManager.getConnector<MakeConnector>('make-integration');
  
  if (!makeConnector) {
    console.error('Make integration not found');
    return;
  }

  const result = await makeConnector.sendLeadData({
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    company: 'Tech Solutions',
    status: 'qualified',
  });

  if (result.success) {
    console.log('Lead data sent to Make.com');
  }
}

export async function sendWhatsAppMessageExample() {
  const whatsappConnector = integrationManager.getConnector<WhatsAppConnector>('whatsapp-integration');
  
  if (!whatsappConnector) {
    console.error('WhatsApp integration not found');
    return;
  }

  if (!await integrationManager.checkRateLimit('whatsapp-integration')) {
    console.error('Rate limit exceeded');
    return;
  }

  const result = await whatsappConnector.sendMessage({
    to: '1234567890',
    body: 'Hello! This is a test message from our CRM.',
  });

  if (result.success) {
    await integrationManager.incrementUsage('whatsapp-integration');
    console.log('WhatsApp message sent:', result.messageId);
  }
}

export async function sendWhatsAppTemplateExample() {
  const whatsappConnector = integrationManager.getConnector<WhatsAppConnector>('whatsapp-integration');
  
  if (!whatsappConnector) {
    console.error('WhatsApp integration not found');
    return;
  }

  const result = await whatsappConnector.sendTemplate(
    '1234567890',
    {
      name: 'appointment_reminder',
      language: 'en',
      parameters: ['John Doe', 'Tomorrow at 3 PM'],
    }
  );

  if (result.success) {
    console.log('WhatsApp template sent:', result.messageId);
  }
}

export async function testAllConnectionsExample() {
  console.log('Testing all integrations...');
  
  const results = await integrationManager.testAllConnections();
  
  results.forEach((result, integrationId) => {
    console.log(`${integrationId}:`, result.success ? '✓' : '✗', result.message);
    if (result.latency) {
      console.log(`  Latency: ${result.latency}ms`);
    }
  });
}

export async function monitorQuotaUsageExample() {
  const integrationIds = ['gmail-integration', 'outlook-integration', 'whatsapp-integration'];
  
  integrationIds.forEach(id => {
    const remaining = integrationManager.getRemainingQuota(id);
    const requests = integrationManager.getRemainingRequests(id);
    
    console.log(`${id}:`);
    console.log(`  Remaining quota: ${remaining}`);
    console.log(`  Remaining requests: ${requests}`);
  });
}

export function setupEventListenersExample() {
  integrationManager.addEventListener('gmail-integration', (event) => {
    console.log('Gmail event:', event.type, event.timestamp);
    
    if (event.type === 'rate_limit') {
      console.warn('Gmail rate limit hit!');
    }
    
    if (event.type === 'quota_exceeded') {
      console.warn('Gmail quota exceeded!');
    }
  });

  integrationManager.addEventListener('*', (event) => {
    console.log('Global event:', event.integrationId, event.type);
  });
}
