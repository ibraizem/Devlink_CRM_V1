import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export interface OnboardingData {
  firstName: string
  lastName: string
  organization: string
  industry: string
  teamName: string
  email: string
  password: string
}

export interface OnboardingResult {
  success: boolean
  user?: User
  profile?: any
  team?: any
  teamMember?: any
  error?: string
  message?: string
  data?: any
}

export async function completeOnboarding(data: OnboardingData): Promise<OnboardingResult> {
  try {
    // 1. Tenter de créer l'utilisateur avec rôle admin
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nom: data.lastName,
          prenom: data.firstName,
          role: 'admin'
        }
      }
    })

    // 2. Gérer les erreurs d'inscription
    if (authError) {
      // Si l'utilisateur existe déjà
      if (authError.message.includes('User already registered') || 
          authError.message.includes('already registered') ||
          authError.message.includes('duplicate')) {
        return {
          success: false,
          error: 'USER_ALREADY_EXISTS',
          message: 'Un compte existe déjà avec cet email. Veuillez vous connecter.',
          data: null
        }
      }
      
      // Autres erreurs d'authentification
      console.error('Erreur auth:', authError)
      return {
        success: false,
        error: 'AUTH_ERROR',
        message: 'Erreur lors de la création du compte utilisateur',
        data: null
      }
    }

    if (!authData.user) {
      throw new Error('Échec de la création du compte')
    }

    const user = authData.user

    // 2.b Ne pas forcer de connexion automatique.
    //    Si la confirmation email est activée, l'utilisateur confirmera via le lien reçu.

    // 3. NE PAS appeler la DB (RLS retournera 401 sans session si email non confirmé).
    //    Le profil est provisionné par le trigger en base.
    //    La création d'équipe sera réalisée après connexion (post‑confirmation email).

    return {
      success: true,
      user,
      message: 'Compte créé. Vérifiez votre email pour confirmer avant de vous connecter.'
    }

  } catch (error) {
    console.error('Erreur complète onboarding:', error)
    throw error
  }
}

// Fonction pour sauvegarder progressivement les données (optionnel)
export async function saveOnboardingProgress(userId: string, step: number, data: Partial<OnboardingData>) {
  try {
    const { error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        current_step: step,
        data: data,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erreur sauvegarde progression:', error)
    }
  } catch (error) {
    console.error('Erreur sauvegarde progression:', error)
  }
}

// Fonction pour récupérer la progression (optionnel)
export async function getOnboardingProgress(userId: string) {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur récupération progression:', error)
    return null
  }
}
