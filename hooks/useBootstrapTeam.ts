import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// Stockage clés
const TEAM_NAME_KEY = 'onboarding_team_name'
const TEAM_BOOTSTRAPPED_KEY = 'onboarding_team_bootstrapped'

export function useBootstrapTeam() {
  const bootstrapPendingTeam = useCallback(async (userId: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    const already = window.localStorage.getItem(TEAM_BOOTSTRAPPED_KEY)
    const teamName = (window.localStorage.getItem(TEAM_NAME_KEY) || '').trim()

    if (!teamName) return false
    if (already === 'true') return false

    // Vérifier si l'équipe existe déjà pour ce leader
    const { data: existingTeams, error: checkErr } = await supabase
      .from('teams')
      .select('id')
      .eq('leader_id', userId)
      .eq('name', teamName)
      .limit(1)

    if (!checkErr && existingTeams && existingTeams.length > 0) {
      window.localStorage.setItem(TEAM_BOOTSTRAPPED_KEY, 'true')
      return false
    }

    // Créer l'équipe
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        leader_id: userId,
      })
      .select()
      .single()

    if (teamErr || !team) {
      return false
    }

    // Ajouter le créateur comme membre leader
    await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'leader',
      })

    // Marquer comme effectué et nettoyer
    window.localStorage.setItem(TEAM_BOOTSTRAPPED_KEY, 'true')
    window.localStorage.removeItem(TEAM_NAME_KEY)
    return true
  }, [])

  return { bootstrapPendingTeam }
}

// Helper pour enregistrer le teamName depuis l'onboarding
export function saveOnboardingTeamName(teamName: string) {
  if (typeof window === 'undefined') return
  const trimmed = (teamName || '').trim()
  if (!trimmed) return
  window.localStorage.setItem(TEAM_NAME_KEY, trimmed)
  window.localStorage.removeItem(TEAM_BOOTSTRAPPED_KEY)
}
