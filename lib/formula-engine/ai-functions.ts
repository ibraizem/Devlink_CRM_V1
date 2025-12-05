import { createClient } from '@/lib/utils/supabase/client'

export interface AIEnrichmentResult {
  success: boolean
  data?: any
  error?: string
  cached?: boolean
}

function generateCacheKey(type: string, input: any): string {
  const str = JSON.stringify({ type, input })
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

async function getCachedEnrichment(
  enrichmentType: string,
  inputData: any
): Promise<any | null> {
  const supabase = createClient()
  const cacheKey = generateCacheKey(enrichmentType, inputData)

  const { data, error } = await supabase
    .from('ai_enrichment_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!error && data) {
    return data.result_data
  }

  return null
}

async function setCachedEnrichment(
  enrichmentType: string,
  inputData: any,
  resultData: any,
  cacheDurationSeconds: number = 86400
): Promise<void> {
  const supabase = createClient()
  const cacheKey = generateCacheKey(enrichmentType, inputData)

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + cacheDurationSeconds)

  await supabase.from('ai_enrichment_cache').upsert({
    cache_key: cacheKey,
    enrichment_type: enrichmentType,
    input_data: inputData,
    result_data: resultData,
    expires_at: expiresAt.toISOString()
  })
}

async function detectCompanyInfo(companyName: string): Promise<any> {
  const cached = await getCachedEnrichment('company_detect', { companyName })
  if (cached) {
    return { ...cached, cached: true }
  }

  try {
    const response = await fetch('/api/ai/detect-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName })
    })

    if (!response.ok) {
      throw new Error('Company detection failed')
    }

    const data = await response.json()
    await setCachedEnrichment('company_detect', { companyName }, data)
    return data
  } catch (error) {
    console.error('Company detection error:', error)
    return {
      industry: 'Unknown',
      size: 'Unknown',
      confidence: 0
    }
  }
}

async function completeLeadData(leadData: Record<string, any>): Promise<any> {
  const cached = await getCachedEnrichment('data_complete', leadData)
  if (cached) {
    return { ...cached, cached: true }
  }

  try {
    const response = await fetch('/api/ai/complete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadData })
    })

    if (!response.ok) {
      throw new Error('Data completion failed')
    }

    const data = await response.json()
    await setCachedEnrichment('data_complete', leadData, data)
    return data
  } catch (error) {
    console.error('Data completion error:', error)
    return { completed: {}, confidence: 0 }
  }
}

async function scoreLeadQuality(leadData: Record<string, any>): Promise<number> {
  const cached = await getCachedEnrichment('lead_score', leadData)
  if (cached) {
    return cached.score
  }

  try {
    const response = await fetch('/api/ai/score-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadData })
    })

    if (!response.ok) {
      throw new Error('Lead scoring failed')
    }

    const data = await response.json()
    await setCachedEnrichment('lead_score', leadData, data)
    return data.score
  } catch (error) {
    console.error('Lead scoring error:', error)
    return 0
  }
}

export const AI_FUNCTIONS = {
  AI_DETECT_COMPANY: async (args: any[], context: Record<string, any>) => {
    const companyName = String(args[0] ?? '')
    if (!companyName) return null

    const result = await detectCompanyInfo(companyName)
    return result.industry || 'Unknown'
  },

  AI_COMPANY_SIZE: async (args: any[], context: Record<string, any>) => {
    const companyName = String(args[0] ?? '')
    if (!companyName) return null

    const result = await detectCompanyInfo(companyName)
    return result.size || 'Unknown'
  },

  AI_COMPLETE_EMAIL: async (args: any[], context: Record<string, any>) => {
    const firstName = String(args[0] ?? '')
    const lastName = String(args[1] ?? '')
    const companyDomain = String(args[2] ?? '')

    if (!firstName || !lastName || !companyDomain) return null

    const leadData = {
      firstName,
      lastName,
      companyDomain,
      field: 'email'
    }

    const result = await completeLeadData(leadData)
    return result.completed?.email || null
  },

  AI_COMPLETE_PHONE: async (args: any[], context: Record<string, any>) => {
    const firstName = String(args[0] ?? '')
    const lastName = String(args[1] ?? '')
    const company = String(args[2] ?? '')

    if (!firstName || !lastName) return null

    const leadData = {
      firstName,
      lastName,
      company,
      field: 'phone'
    }

    const result = await completeLeadData(leadData)
    return result.completed?.phone || null
  },

  AI_LEAD_SCORE: async (args: any[], context: Record<string, any>) => {
    const leadData = args[0] as Record<string, any>
    if (!leadData || typeof leadData !== 'object') {
      return 0
    }

    const score = await scoreLeadQuality(leadData)
    return Math.round(score)
  },

  AI_EXTRACT_DOMAIN: async (args: any[], context: Record<string, any>) => {
    const email = String(args[0] ?? '')
    const match = email.match(/@(.+)$/)
    return match ? match[1] : null
  },

  AI_CLEAN_PHONE: async (args: any[], context: Record<string, any>) => {
    const phone = String(args[0] ?? '')
    return phone.replace(/[^\d+]/g, '')
  },

  AI_FORMAT_NAME: async (args: any[], context: Record<string, any>) => {
    const name = String(args[0] ?? '')
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  },

  AI_PREDICT_INDUSTRY: async (args: any[], context: Record<string, any>) => {
    const description = String(args[0] ?? '')
    if (!description) return 'Unknown'

    const industries: Record<string, string[]> = {
      'Technology': ['software', 'tech', 'digital', 'IT', 'cloud', 'SaaS'],
      'Finance': ['bank', 'finance', 'insurance', 'investment', 'trading'],
      'Healthcare': ['health', 'medical', 'hospital', 'pharma', 'clinic'],
      'Retail': ['retail', 'shop', 'store', 'ecommerce', 'marketplace'],
      'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial'],
      'Services': ['consulting', 'service', 'agency', 'professional']
    }

    const lowerDesc = description.toLowerCase()
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        return industry
      }
    }

    return 'Other'
  },

  AI_SENTIMENT: async (args: any[], context: Record<string, any>) => {
    const text = String(args[0] ?? '').toLowerCase()
    
    const positive = ['excellent', 'great', 'good', 'interested', 'yes', 'perfect']
    const negative = ['bad', 'no', 'not interested', 'terrible', 'poor']
    
    const positiveCount = positive.filter(word => text.includes(word)).length
    const negativeCount = negative.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
}
