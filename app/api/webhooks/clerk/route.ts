import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with ID: ${id} and type: ${eventType}`)

  switch (eventType) {
    case 'user.created':
      console.log('User created:', evt.data)
      break

    case 'user.updated':
      console.log('User updated:', evt.data)
      break

    case 'user.deleted':
      console.log('User deleted:', evt.data)
      break

    case 'session.created':
      console.log('Session created:', evt.data)
      break

    case 'session.ended':
      console.log('Session ended:', evt.data)
      break

    default:
      console.log(`Unhandled event type: ${eventType}`)
  }

  return new Response('', { status: 200 })
}
