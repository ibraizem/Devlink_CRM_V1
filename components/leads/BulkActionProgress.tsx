'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BulkActionProgressProps {
  show: boolean;
  action: string;
  current: number;
  total: number;
  status: 'processing' | 'success' | 'error';
  message?: string;
}

export function BulkActionProgress({
  show,
  action,
  current,
  total,
  status,
  message,
}: BulkActionProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-card border shadow-lg rounded-lg p-4 min-w-[400px]">
            <div className="flex items-center gap-3 mb-2">
              {status === 'processing' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{action}</h4>
                {message && (
                  <p className="text-xs text-muted-foreground">{message}</p>
                )}
              </div>

              <span className="text-sm font-medium">
                {current} / {total}
              </span>
            </div>

            <Progress value={progress} className="h-2" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
