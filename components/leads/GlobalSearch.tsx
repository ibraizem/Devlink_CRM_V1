'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Search, FileText, User, Mail, Phone, Building } from 'lucide-react'
import { Lead } from '@/types/leads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface GlobalSearchProps {
  data: Lead[]
  onSelectLead?: (lead: Lead) => void
  trigger?: React.ReactNode
}

interface SearchResult {
  lead: Lead
  matchedFields: Array<{
    key: string
    value: string
    highlighted: string
  }>
  score: number
}

function highlightText(text: string, query: string): string {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900 text-foreground">$1</mark>')
}

function getFieldIcon(key: string) {
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('email') || lowerKey.includes('mail')) return Mail
  if (lowerKey.includes('phone') || lowerKey.includes('tel')) return Phone
  if (lowerKey.includes('company') || lowerKey.includes('entreprise')) return Building
  if (lowerKey.includes('name') || lowerKey.includes('nom') || lowerKey.includes('prenom')) return User
  return FileText
}

export function GlobalSearch({ data, onSelectLead, trigger }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!search) return []

    const query = search.toLowerCase()
    const results: SearchResult[] = []

    data.forEach((lead) => {
      const matchedFields: SearchResult['matchedFields'] = []
      let totalScore = 0

      Object.entries(lead).forEach(([key, value]) => {
        if (key === 'id' || key.startsWith('_')) return
        
        const strValue = String(value || '')
        if (strValue.toLowerCase().includes(query)) {
          const score = strValue.toLowerCase() === query ? 10 : 
                       strValue.toLowerCase().startsWith(query) ? 5 : 1
          totalScore += score

          matchedFields.push({
            key,
            value: strValue,
            highlighted: highlightText(strValue, query)
          })
        }
      })

      if (matchedFields.length > 0) {
        results.push({
          lead,
          matchedFields,
          score: totalScore
        })
      }
    })

    return results.sort((a, b) => b.score - a.score).slice(0, 50)
  }, [data, search])

  const handleSelect = useCallback((result: SearchResult) => {
    onSelectLead?.(result.lead)
    setOpen(false)
    setSearch('')
  }, [onSelectLead])

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Recherche globale...</span>
          <span className="inline-flex lg:hidden">Rechercher...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Rechercher dans tous les champs..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          {searchResults.length > 0 && (
            <CommandGroup heading={`${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} trouvé${searchResults.length > 1 ? 's' : ''}`}>
              {searchResults.map((result, idx) => {
                const Icon = getFieldIcon(result.matchedFields[0]?.key || '')
                const primaryField = result.matchedFields[0]
                const leadName = result.lead.nom || result.lead.name || result.lead.email || 'Lead'
                
                return (
                  <CommandItem
                    key={result.lead.id}
                    value={`${result.lead.id}-${idx}`}
                    onSelect={() => handleSelect(result)}
                    className="flex flex-col items-start gap-2 py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{leadName}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.matchedFields.length} match{result.matchedFields.length > 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="pl-6 w-full space-y-1">
                      {result.matchedFields.slice(0, 3).map((field, fieldIdx) => (
                        <div key={fieldIdx} className="text-xs text-muted-foreground">
                          <span className="font-medium">{field.key}:</span>{' '}
                          <span 
                            dangerouslySetInnerHTML={{ __html: field.highlighted }}
                            className="truncate max-w-full inline-block align-bottom"
                          />
                        </div>
                      ))}
                      {result.matchedFields.length > 3 && (
                        <div className="text-xs text-muted-foreground italic">
                          +{result.matchedFields.length - 3} autre{result.matchedFields.length - 3 > 1 ? 's' : ''} correspondance{result.matchedFields.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
