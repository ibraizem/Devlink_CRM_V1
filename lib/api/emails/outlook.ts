export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  accessToken?: string
) {
  if (!accessToken) {
    throw new Error('Outlook access token not configured');
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: 'true',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEmails(accessToken?: string) {
  if (!accessToken) {
    throw new Error('Outlook access token not configured');
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get emails');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createOutlookEvent(
  subject: string,
  start: string,
  end: string,
  attendeeEmail: string,
  accessToken?: string
) {
  if (!accessToken) {
    throw new Error('Outlook access token not configured');
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        start: {
          dateTime: start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end,
          timeZone: 'UTC',
        },
        attendees: [
          {
            emailAddress: {
              address: attendeeEmail,
            },
            type: 'required',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Outlook event');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
