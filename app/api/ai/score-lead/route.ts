import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

interface ScoringCriteria {
  weight: number
  check: (data: any) => number
}

const SCORING_CRITERIA: Record<string, ScoringCriteria> = {
  hasEmail: {
    weight: 15,
    check: (data) => data.email ? 1 : 0
  },
  hasPhone: {
    weight: 15,
    check: (data) => data.phone || data.telephone ? 1 : 0
  },
  hasCompany: {
    weight: 10,
    check: (data) => data.company || data.entreprise || data.societe ? 1 : 0
  },
  hasName: {
    weight: 10,
    check: (data) => (data.firstName || data.prenom) && (data.lastName || data.nom) ? 1 : 0
  },
  hasTitle: {
    weight: 8,
    check: (data) => data.title || data.poste || data.fonction ? 1 : 0
  },
  hasAddress: {
    weight: 5,
    check: (data) => data.address || data.adresse || data.city || data.ville ? 1 : 0
  },
  emailQuality: {
    weight: 12,
    check: (data) => {
      const email = data.email
      if (!email) return 0
      if (email.includes('@gmail.com') || email.includes('@yahoo.com') || email.includes('@hotmail.com')) {
        return 0.5
      }
      return 1
    }
  },
  phoneQuality: {
    weight: 8,
    check: (data) => {
      const phone = data.phone || data.telephone
      if (!phone) return 0
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length >= 10) return 1
      if (cleaned.length >= 8) return 0.7
      return 0.3
    }
  },
  industryKnown: {
    weight: 7,
    check: (data) => data.industry || data.industrie || data.secteur ? 1 : 0
  },
  recentActivity: {
    weight: 10,
    check: (data) => {
      if (data.lastContact || data.dernierContact) {
        const lastContactDate = new Date(data.lastContact || data.dernierContact)
        const daysSince = (Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince <= 7) return 1
        if (daysSince <= 30) return 0.7
        if (daysSince <= 90) return 0.4
        return 0.2
      }
      return 0.5
    }
  }
}

function calculateLeadScore(leadData: Record<string, any>): number {
  let totalScore = 0
  let maxScore = 0

  for (const [criterion, config] of Object.entries(SCORING_CRITERIA)) {
    const criterionScore = config.check(leadData) * config.weight
    totalScore += criterionScore
    maxScore += config.weight
  }

  const normalizedScore = (totalScore / maxScore) * 100

  return Math.round(normalizedScore)
}

function getScoreDetails(leadData: Record<string, any>): Record<string, any> {
  const details: Record<string, any> = {}

  for (const [criterion, config] of Object.entries(SCORING_CRITERIA)) {
    details[criterion] = {
      score: config.check(leadData) * config.weight,
      maxScore: config.weight
    }
  }

  return details
}

function getRecommendations(leadData: Record<string, any>): string[] {
  const recommendations: string[] = []

  if (!leadData.email) {
    recommendations.push('Add email address to improve lead quality')
  }
  if (!leadData.phone && !leadData.telephone) {
    recommendations.push('Add phone number for better contact options')
  }
  if (!leadData.company && !leadData.entreprise && !leadData.societe) {
    recommendations.push('Add company information')
  }
  if (!leadData.title && !leadData.poste && !leadData.fonction) {
    recommendations.push('Add job title for better targeting')
  }
  if (leadData.email && (leadData.email.includes('@gmail.com') || leadData.email.includes('@yahoo.com'))) {
    recommendations.push('Consider finding professional email address')
  }

  return recommendations
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

    const score = calculateLeadScore(leadData)
    const details = getScoreDetails(leadData)
    const recommendations = getRecommendations(leadData)

    let quality = 'Low'
    if (score >= 80) quality = 'Excellent'
    else if (score >= 60) quality = 'Good'
    else if (score >= 40) quality = 'Fair'

    return NextResponse.json({
      score,
      quality,
      details,
      recommendations
    })
  } catch (error) {
    console.error('Lead scoring error:', error)
    return NextResponse.json(
      { error: 'Scoring failed' },
      { status: 500 }
    )
  }
}
