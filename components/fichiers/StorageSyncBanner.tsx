'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FileSync, X } from 'lucide-react'
import Link from 'next/link'

export function StorageSyncBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('storage-sync-banner-dismissed')
    if (!dismissed) {
      setIsVisible(true)
    } else {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('storage-sync-banner-dismissed', 'true')
    setIsVisible(false)
    setIsDismissed(true)
  }

  if (isDismissed || !isVisible) return null

  return (
    <Alert className="border-blue-200 bg-blue-50 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4 text-blue-600" />
      </button>
      <FileSync className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-900">Nouvelle fonctionnalité: Synchronisation Storage</AlertTitle>
      <AlertDescription className="text-blue-800 mt-2">
        Importez automatiquement vos fichiers depuis Supabase Storage avec détection de doublons,
        mapping intelligent des colonnes et historique complet des imports.
        <div className="mt-3">
          <Link href="/fichiers/storage-sync">
            <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
              Découvrir maintenant
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
