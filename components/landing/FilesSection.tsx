'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { FileUp, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FilesSection() {
  return (
    <FeatureSection
      id="files"
      title="Gérez vos données en masse"
      subtitle="Import/Export de gros volumes sans limite"
      description="Importez et exportez des fichiers contenant des millions de lignes sans aucune limitation. Notre système optimisé gère les gros volumes avec une performance exceptionnelle."
      features={[
        'Import/Export CSV, Excel, JSON sans limitation de volume',
        'Validation et nettoyage automatique des données',
        'Dédoublonnage intelligent sur des millions de lignes',
        'Historique complet des imports et traçabilité',
      ]}
      icon={FileUp}
      gradient="from-amber-500 to-orange-500"
      iconColor="text-amber-500"
      bgColor="bg-amber-50"
      badge={{
        text: 'Sans limite',
        stat: 'Millions de lignes',
      }}
      reverse={false}
    >
      <SidePanel gradient="from-amber-500 to-orange-500">
        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 p-6 flex flex-col justify-center">
          <div className="space-y-3">
            {/* File Upload Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-amber-200">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Import en cours
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">mega_database.csv</span>
                  <span className="font-semibold text-amber-600">
                    2.5M lignes
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
                <div className="text-xs text-gray-500">75% - 1m 23s restant</div>
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-3 border border-amber-200">
                <div className="text-xs text-gray-600 mb-1">Lignes traitées</div>
                <div className="text-xl font-bold text-gray-800">1,875,000</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 border border-amber-200">
                <div className="text-xs text-gray-600 mb-1">Doublons supprimés</div>
                <div className="text-xl font-bold text-gray-800">45,230</div>
              </div>
            </div>

            {/* Format Support */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-amber-200">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Formats supportés
              </div>
              <div className="flex gap-2 flex-wrap">
                {['CSV', 'Excel', 'JSON', 'XML'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-3 text-center text-sm font-medium">
              ⚡ Performance optimisée pour gros volumes
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}