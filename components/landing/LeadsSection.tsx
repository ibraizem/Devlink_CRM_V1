'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeadsSection() {
  return (
    <FeatureSection
      id="leads"
      title="Import massif et enrichissement AI"
      subtitle="De l'import à la qualification automatique"
      description="Importez des fichiers CSV/Excel contenant des milliers de lignes en quelques secondes. Notre intelligence artificielle enrichit automatiquement vos leads avec des données pertinentes."
      features={[
        'Import de fichiers CSV/Excel avec 10 000+ lignes en quelques secondes',
        'Enrichissement automatique via AI (extension Chrome en développement)',
        'Scoring intelligent et segmentation avancée',
        'Dédoublonnage et nettoyage automatique des données',
      ]}
      icon={Target}
      gradient="from-emerald-500 to-teal-600"
      iconColor="text-emerald-500"
      bgColor="bg-emerald-50"
      badge={{
        text: 'AI Powered',
        stat: 'Import en 30 secondes',
      }}
      reverse={true}
    >
      <SidePanel gradient="from-emerald-500 to-teal-600">
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 p-6 flex flex-col justify-center">
          {/* Mock Import Interface */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-3 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  leads_database.csv
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  12,450 lignes
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Import terminé en 28 secondes
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">
                  Enrichissement AI
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Entreprises enrichies</span>
                  <span className="font-semibold text-emerald-600">
                    11,234
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Emails validés</span>
                  <span className="font-semibold text-emerald-600">
                    10,892
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Téléphones trouvés</span>
                  <span className="font-semibold text-emerald-600">9,456</span>
                </div>
              </div>
            </div>

            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg p-3 text-center text-sm font-medium"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              ✨ Extension Chrome AI en développement
            </motion.div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}