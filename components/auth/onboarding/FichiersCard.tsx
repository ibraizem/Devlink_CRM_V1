'use client';

import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileItem {
  id: number;
  name: string;
  status: 'uploading' | 'processing' | 'completed';
  progress: number;
}

export function FichiersCard() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: 'leads_janvier.csv', status: 'completed', progress: 100 },
    { id: 2, name: 'prospects_2024.xlsx', status: 'processing', progress: 65 },
    { id: 3, name: 'contacts_export.csv', status: 'uploading', progress: 30 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.status === 'uploading' && file.progress < 100) {
            const newProgress = Math.min(file.progress + Math.random() * 15, 100);
            return {
              ...file,
              progress: newProgress,
              status: newProgress === 100 ? 'processing' : 'uploading',
            };
          }
          if (file.status === 'processing' && file.progress < 100) {
            const newProgress = Math.min(file.progress + Math.random() * 10, 100);
            return {
              ...file,
              progress: newProgress,
              status: newProgress === 100 ? 'completed' : 'processing',
            };
          }
          return file;
        })
      );
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-3 w-3 text-blue-300 animate-bounce" />;
      case 'processing':
        return <Clock className="h-3 w-3 text-yellow-300 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-300" />;
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading':
        return 'Upload...';
      case 'processing':
        return 'Traitement...';
      case 'completed':
        return 'Terminé';
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 backdrop-blur-sm border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Fichiers</h3>
          </div>
          <p className="text-sm text-white/70">Importez et gérez vos données</p>
        </div>
        <motion.div
          className="rounded-full bg-blue-400/20 p-2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Upload className="h-4 w-4 text-blue-300" />
        </motion.div>
      </div>

      <div className="space-y-3">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            className="p-3 rounded-lg bg-white/5 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-blue-300 flex-shrink-0" />
                <span className="text-xs font-medium text-white truncate">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/70">
                {getStatusIcon(file.status)}
                <span>{getStatusText(file.status)}</span>
              </div>
            </div>
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  file.status === 'completed'
                    ? 'bg-green-400'
                    : file.status === 'processing'
                    ? 'bg-yellow-400'
                    : 'bg-blue-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>Glissez-déposez vos fichiers</span>
        <ArrowRight className="h-3 w-3" />
      </motion.div>

      <motion.div
        className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </motion.div>
  );
}
