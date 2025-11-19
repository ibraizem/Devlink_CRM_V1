import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Playbook {
  id: string
  name: string
  description: string
  industry_id: string
  templates: PlaybookTemplate[]
  created_at: string
  updated_at: string
}

export interface PlaybookTemplate {
  id: string
  playbook_id: string
  type: 'email' | 'script' | 'sequence'
  name: string
  subject?: string
  content: string
  variables?: string[]
  order: number
}

export interface Industry {
  id: string
  name: string
  description: string
  icon: string
}

// Industries prédéfinies
export const INDUSTRIES: Industry[] = [
  {
    id: 'assurance',
    name: 'Assurance décennale',
    description: 'Prospection pour assurances et garanties décennales',
    icon: '🛡️'
  },
  {
    id: 'energie',
    name: 'Énergie / Solar',
    description: 'Démarchage pour solutions énergétiques et solaires',
    icon: '⚡'
  },
  {
    id: 'telecom',
    name: 'Télécom B2B',
    description: 'Services télécoms pour entreprises',
    icon: '📞'
  },
  {
    id: 'marketing',
    name: 'Agence marketing',
    description: 'Acquisition clients pour agences digitales',
    icon: '📈'
  },
  {
    id: 'batiment',
    name: 'Bâtiment / BTP',
    description: 'Prospection dans le secteur du bâtiment',
    icon: '🏗️'
  },
  {
    id: 'recrutement',
    name: 'Recrutement',
    description: 'Services de recrutement B2B',
    icon: '👥'
  }
]

// Templates de playbooks prédéfinis pour chaque industrie
export const DEFAULT_PLAYBOOK_TEMPLATES = {
  assurance: [
    {
      type: 'email' as const,
      name: 'Email initial - Contact décennale',
      subject: 'Garantie décennale pour vos projets {project_type}',
      content: `Bonjour {contact_name},

Je suis {agent_name} de {company_name} et je vous contacte concernant vos projets {project_type}.

La garantie décennale est obligatoire et protège votre activité contre les vices cachés. Nous proposons des solutions adaptées à votre secteur.

Seriez-vous disponible pour un bref échange la semaine prochaine ?

Cordialement,
{agent_name}
{company_name}
{phone}`,
      variables: ['contact_name', 'project_type', 'agent_name', 'company_name', 'phone'],
      order: 1
    },
    {
      type: 'script' as const,
      name: 'Script téléphonique - Décennale',
      content: `Bonjour {contact_name},

[Présentation] Je suis {agent_name} de {company_name}, spécialiste en assurance décennale.

[Problème] Je vois que vous travaillez sur des projets {project_type}. La garantie décennale est essentielle pour protéger votre activité.

[Solution] Nous avons des solutions sur mesure avec des tarifs compétitifs et une couverture complète.

[Call to action] Pouvons-nous prévoir 15 minutes la semaine prochaine pour discuter de vos besoins spécifiques ?`,
      variables: ['contact_name', 'agent_name', 'company_name', 'project_type'],
      order: 2
    }
  ],
  
  energie: [
    {
      type: 'email' as const,
      name: 'Email initial - Solutions solaires',
      subject: 'Réduisez vos factures énergétiques avec le solaire',
      content: `Bonjour {contact_name},

J'ai remarqué que votre entreprise {company_name} pourrait bénéficier d'une installation solaire pour réduire significativement vos coûts énergétiques.

Avec nos solutions, vous pouvez économiser jusqu'à 60% sur vos factures d'électricité.

Seriez-vous intéressé par une étude de faisabilité gratuite ?

Bien cordialement,
{agent_name}`,
      variables: ['contact_name', 'company_name', 'agent_name'],
      order: 1
    }
  ],
  
  telecom: [
    {
      type: 'email' as const,
      name: 'Email initial - Solutions B2B',
      subject: 'Optimisez vos communications professionnelles',
      content: `Bonjour {contact_name},

En tant que {job_title} chez {company_name}, vous cherchez probablement à optimiser vos coûts de communication.

Nos solutions B2B permettent de réduire jusqu'à 40% vos factures télécoms tout en améliorant la qualité de service.

Pouvons-nous faire un point rapide la semaine prochaine ?

Cordialement,
{agent_name}`,
      variables: ['contact_name', 'job_title', 'company_name', 'agent_name'],
      order: 1
    }
  ],
  
  marketing: [
    {
      type: 'email' as const,
      name: 'Email initial - Acquisition clients',
      subject: 'Générez plus de prospects qualifiés',
      content: `Bonjour {contact_name},

Votre entreprise {company_name} mérite plus de visibilité et de prospects qualifiés.

Notre agence aide les entreprises comme la vôtre à augmenter leur acquisition clients de 150% en moyenne grâce à nos stratégies digitales.

Seriez-vous ouvert à discuter de vos objectifs de croissance ?

{agent_name}`,
      variables: ['contact_name', 'company_name', 'agent_name'],
      order: 1
    }
  ],
  
  batiment: [
    {
      type: 'email' as const,
      name: 'Email initial - BTP',
      subject: 'Partenariat pour vos projets BTP',
      content: `Bonjour {contact_name},

Je suis {agent_name} de {company_name} et je suis intéressé par vos projets dans le secteur du BTP.

Nous sommes spécialisés dans {specialty} et serions ravis de collaborer avec vous.

Avez-vous des projets prévus prochainement ?

Cordialement,
{agent_name}`,
      variables: ['contact_name', 'agent_name', 'company_name', 'specialty'],
      order: 1
    }
  ],
  
  recrutement: [
    {
      type: 'email' as const,
      name: 'Email initial - Recrutement B2B',
      subject: 'Trouvez les talents qu\'il vous faut',
      content: `Bonjour {contact_name},

En tant que {job_title} chez {company_name}, je sais que recruter les bons talents est un défi majeur.

Notre cabinet spécialisé dans {industry} vous aide à trouver les candidats parfaits en un temps record.

Seriez-vous disposé à échanger sur vos besoins en recrutement ?

{agent_name}`,
      variables: ['contact_name', 'job_title', 'company_name', 'industry', 'agent_name'],
      order: 1
    }
  ]
}

// Fonctions pour gérer les playbooks
export async function createPlaybookForUser(userId: string, industryId: string): Promise<Playbook | null> {
  try {
    // Créer le playbook
    const { data: playbook, error: playbookError } = await supabase
      .from('playbooks')
      .insert({
        name: `Playbook ${INDUSTRIES.find(i => i.id === industryId)?.name}`,
        description: `Playbook prédéfini pour ${INDUSTRIES.find(i => i.id === industryId)?.name}`,
        industry_id: industryId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (playbookError) {
      console.error('Erreur création playbook:', playbookError)
      return null
    }

    // Ajouter les templates prédéfinis
    const templates = DEFAULT_PLAYBOOK_TEMPLATES[industryId as keyof typeof DEFAULT_PLAYBOOK_TEMPLATES] || []
    
    for (const template of templates) {
      const { error: templateError } = await supabase
        .from('playbook_templates')
        .insert({
          playbook_id: playbook.id,
          type: template.type,
          name: template.name,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          order: template.order,
          created_at: new Date().toISOString()
        })

      if (templateError) {
        console.error('Erreur création template:', templateError)
      }
    }

    return playbook

  } catch (error) {
    console.error('Erreur création playbook utilisateur:', error)
    return null
  }
}

export async function getUserPlaybooks(userId: string): Promise<Playbook[]> {
  try {
    const { data, error } = await supabase
      .from('playbooks')
      .select(`
        *,
        playbook_templates (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération playbooks:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('Erreur récupération playbooks utilisateur:', error)
    return []
  }
}

export async function getIndustryById(industryId: string): Promise<Industry | null> {
  return INDUSTRIES.find(industry => industry.id === industryId) || null
}

export async function getAllIndustries(): Promise<Industry[]> {
  return INDUSTRIES
}
