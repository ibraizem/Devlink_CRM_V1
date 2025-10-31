export async function createCalendlyEvent(
  leadName: string,
  leadEmail: string,
  eventTypeUri: string,
  calendlyApiKey?: string
) {
  if (!calendlyApiKey) {
    throw new Error('Calendly API key not configured');
  }

  try {
    const response = await fetch('https://api.calendly.com/scheduling_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${calendlyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_event_count: 1,
        owner: eventTypeUri,
        owner_type: 'EventType',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Calendly event');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getCalendlyEvents(calendlyApiKey?: string, userUri?: string) {
  if (!calendlyApiKey) {
    throw new Error('Calendly API key not configured');
  }

  try {
    const response = await fetch(`https://api.calendly.com/scheduled_events?user=${userUri}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${calendlyApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Calendly events');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function cancelCalendlyEvent(eventUri: string, calendlyApiKey?: string) {
  if (!calendlyApiKey) {
    throw new Error('Calendly API key not configured');
  }

  try {
    const response = await fetch(`https://api.calendly.com/scheduled_events/${eventUri}/cancellation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${calendlyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Annulé depuis le CRM',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel Calendly event');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
