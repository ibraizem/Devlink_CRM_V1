'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FullscreenTableProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  shortcuts?: boolean
}

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

export function FullscreenTable({ 
  children, 
  trigger,
  shortcuts = true 
}: FullscreenTableProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: 'f',
      ctrl: true,
      description: 'Activer/désactiver plein écran',
      action: () => setIsFullscreen(prev => !prev)
    },
    {
      key: 'Escape',
      description: 'Quitter le plein écran',
      action: () => setIsFullscreen(false)
    },
    {
      key: '?',
      shift: true,
      description: 'Afficher les raccourcis',
      action: () => setShowShortcuts(prev => !prev)
    }
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!shortcuts) return

    keyboardShortcuts.forEach(shortcut => {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.alt ? e.altKey : !e.altKey

      if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        shortcut.action()
      }
    })
  }, [shortcuts, keyboardShortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      toast.info('Mode plein écran activé. Appuyez sur Échap pour quitter.', {
        duration: 2000
      })
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
  }

  return (
    <>
      {trigger ? (
        <div onClick={handleToggleFullscreen}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFullscreen}
          className="gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Plein écran
        </Button>
      )}

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">Mode plein écran</h2>
                  {shortcuts && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowShortcuts(prev => !prev)}
                      className="gap-2 text-xs"
                    >
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                        ?
                      </kbd>
                      Raccourcis
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <kbd className="text-xs">Échap</kbd>
                    pour quitter
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFullscreen}
                    className="gap-2"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Quitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFullscreen}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                {children}
              </div>

              <AnimatePresence>
                {showShortcuts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-2xl"
                  >
                    <div className="bg-popover border rounded-lg shadow-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">Raccourcis clavier</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowShortcuts(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {keyboardShortcuts.map((shortcut, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.ctrl && (
                                <>
                                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                    Ctrl
                                  </kbd>
                                  <span className="text-xs">+</span>
                                </>
                              )}
                              {shortcut.shift && (
                                <>
                                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                    Shift
                                  </kbd>
                                  <span className="text-xs">+</span>
                                </>
                              )}
                              {shortcut.alt && (
                                <>
                                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                    Alt
                                  </kbd>
                                  <span className="text-xs">+</span>
                                </>
                              )}
                              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                {shortcut.key}
                              </kbd>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
