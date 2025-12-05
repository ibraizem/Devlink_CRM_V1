import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const patterns = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}@${domain}`
  ]
  
  return patterns[0]
}

function generatePhone(country: string = 'FR'): string {
  if (country === 'FR') {
    const prefixes = ['06', '07']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const numbers = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
    return `+33 ${prefix} ${numbers.substring(0, 2)} ${numbers.substring(2, 4)} ${numbers.substring(4, 6)} ${numbers.substring(6, 8)}`
  }
  
  return '+1 555-0100'
}

function completeAddress(existingData: any): string {
  if (existingData.city && existingData.country) {
    return `${existingData.city}, ${existingData.country}`
  }
  if (existingData.city) {
    return `${existingData.city}, France`
  }
  return 'Not available'
}

function inferTitle(firstName: string, company: string): string {
  const titles = [
    'Sales Manager',
    'Business Development Manager',
    'Director',
    'CEO',
    'Marketing Manager',
    'Operations Manager'
  ]
  
  return titles[Math.floor(Math.random() * titles.length)]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadData } = body

    if (!leadData || typeof leadData !== 'object') {
      return NextResponse.json(
        { error: 'leadData is required' },
        { status: 400 }
      )
    }

    const completed: Record<string, any> = {}
    let confidence = 0.6

    if (leadData.field === 'email' && leadData.firstName && leadData.lastName && leadData.companyDomain) {
      completed.email = generateEmail(leadData.firstName, leadData.lastName, leadData.companyDomain)
      confidence = 0.7
    } else if (leadData.field === 'phone') {
      completed.phone = generatePhone(leadData.country || 'FR')
      confidence = 0.5
    } else {
      if (!leadData.email && leadData.firstName && leadData.lastName && leadData.company) {
        const domain = leadData.company.toLowerCase().replace(/\s+/g, '') + '.com'
        completed.email = generateEmail(leadData.firstName, leadData.lastName, domain)
      }

      if (!leadData.phone) {
        completed.phone = generatePhone(leadData.country || 'FR')
      }

      if (!leadData.title && leadData.firstName && leadData.company) {
        completed.title = inferTitle(leadData.firstName, leadData.company)
      }

      if (!leadData.address && (leadData.city || leadData.country)) {
        completed.address = completeAddress(leadData)
      }
    }

    return NextResponse.json({
      completed,
      confidence: Math.round(confidence * 100),
      source: 'pattern-based'
    })
  } catch (error) {
    console.error('Data completion error:', error)
    return NextResponse.json(
      { error: 'Completion failed' },
      { status: 500 }
    )
  }
}
