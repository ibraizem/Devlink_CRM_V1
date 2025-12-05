import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Technology': ['software', 'tech', 'digital', 'IT', 'cloud', 'SaaS', 'app', 'platform', 'web', 'mobile', 'AI', 'data'],
  'Finance': ['bank', 'finance', 'insurance', 'investment', 'trading', 'credit', 'payment', 'fintech', 'capital'],
  'Healthcare': ['health', 'medical', 'hospital', 'pharma', 'clinic', 'care', 'wellness', 'biotech', 'medicine'],
  'Retail': ['retail', 'shop', 'store', 'ecommerce', 'marketplace', 'boutique', 'commerce', 'sales'],
  'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'assembly', 'fabrication'],
  'Services': ['consulting', 'service', 'agency', 'professional', 'advisory', 'solutions'],
  'Real Estate': ['real estate', 'property', 'immobilier', 'construction', 'building', 'architecture'],
  'Education': ['education', 'school', 'training', 'university', 'learning', 'academy', 'formation'],
  'Media': ['media', 'publishing', 'news', 'content', 'entertainment', 'production', 'creative'],
  'Transportation': ['transport', 'logistics', 'shipping', 'delivery', 'freight', 'supply chain'],
  'Energy': ['energy', 'power', 'renewable', 'electric', 'solar', 'oil', 'gas'],
  'Food & Beverage': ['food', 'restaurant', 'beverage', 'catering', 'cuisine', 'dining'],
  'Automotive': ['auto', 'car', 'vehicle', 'automotive', 'motor', 'garage'],
  'Telecommunications': ['telecom', 'network', 'communication', 'mobile', 'internet', 'broadband']
}

const COMPANY_SIZE_INDICATORS: Record<string, string[]> = {
  'Enterprise': ['corporation', 'international', 'global', 'group', 'holdings', 'SA', 'Inc', 'plc'],
  'Mid-Market': ['company', 'ltd', 'limited', 'société', 'SARL'],
  'Small Business': ['studio', 'boutique', 'local', 'petit', 'micro']
}

function detectIndustry(companyName: string): { industry: string; confidence: number } {
  const lowerName = companyName.toLowerCase()
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return { industry, confidence: 0.8 }
      }
    }
  }
  
  return { industry: 'Other', confidence: 0.3 }
}

function detectCompanySize(companyName: string): { size: string; confidence: number } {
  const lowerName = companyName.toLowerCase()
  
  for (const [size, indicators] of Object.entries(COMPANY_SIZE_INDICATORS)) {
    for (const indicator of indicators) {
      if (lowerName.includes(indicator)) {
        return { size, confidence: 0.7 }
      }
    }
  }
  
  const nameLength = companyName.length
  if (nameLength > 30) {
    return { size: 'Enterprise', confidence: 0.5 }
  } else if (nameLength > 15) {
    return { size: 'Mid-Market', confidence: 0.4 }
  } else {
    return { size: 'Small Business', confidence: 0.4 }
  }
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
    const { companyName } = body

    if (!companyName) {
      return NextResponse.json(
        { error: 'companyName is required' },
        { status: 400 }
      )
    }

    const industryResult = detectIndustry(companyName)
    const sizeResult = detectCompanySize(companyName)

    return NextResponse.json({
      industry: industryResult.industry,
      size: sizeResult.size,
      confidence: Math.round((industryResult.confidence + sizeResult.confidence) / 2 * 100),
      metadata: {
        industryConfidence: industryResult.confidence,
        sizeConfidence: sizeResult.confidence
      }
    })
  } catch (error) {
    console.error('Company detection error:', error)
    return NextResponse.json(
      { error: 'Detection failed' },
      { status: 500 }
    )
  }
}
