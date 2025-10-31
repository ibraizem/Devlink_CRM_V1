export async function makeCall(phoneNumber: string, onoffApiKey?: string) {
  if (!onoffApiKey) {
    throw new Error('Onoff API key not configured');
  }

  try {
    const response = await fetch('https://api.onoffbusiness.com/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${onoffApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to make call');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function sendSMS(phoneNumber: string, message: string, onoffApiKey?: string) {
  if (!onoffApiKey) {
    throw new Error('Onoff API key not configured');
  }

  try {
    const response = await fetch('https://api.onoffbusiness.com/v1/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${onoffApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getCallLogs(onoffApiKey?: string) {
  if (!onoffApiKey) {
    throw new Error('Onoff API key not configured');
  }

  try {
    const response = await fetch('https://api.onoffbusiness.com/v1/calls', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${onoffApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get call logs');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
