'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { FileText, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsSection() {
  return (
    <FeatureSection
      id="reports"
      title="Analytics AI et reporting avancé"
      subtitle="Analysez vos performances avec l'intelligence artificielle"
      description="Générez des rapports détaillés et bénéficiez d'analyses prédictives grâce à notre intelligence artificielle. Identifiez les tendances et optimisez vos stratégies commerciales."
      features={[
        'Rapports personnalisables avec analyse prédictive AI',
        'Export PDF, Excel, CSV pour partage avec direction',
        'Analyse des tendances et recommandations automatiques',
        'Benchmarking d\'équipe et identification des best practices',
      ]}
      icon={FileText}
      gradient="from-orange-500 to-orange-600"
      iconColor="text-orange-500"
      bgColor="bg-orange-50"
      badge={{
        text: 'Prédictif',
        stat: 'Analytics AI',
      }}
      reverse={true}
    >
      <SidePanel gradient="from-orange-500 to-orange-600">
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 p-6 flex flex-col justify-center">
          <div className="space-y-3">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Rapport Mensuel - Janvier 2025
                </h3>
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Total leads</div>
                  <div className="text-xl font-bold text-gray-800">12,450</div>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>+23%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Conversions</div>
                  <div className="text-xl font-bold text-gray-800">2,267</div>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Insights AI
                </span>
              </div>
              <div className="space-y-2">
                <motion.div
                  className="bg-white rounded p-2 text-xs text-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  📈 Les appels entre 10h-11h ont un taux de conversion 34% supérieur
                </motion.div>
                <motion.div
                  className="bg-white rounded p-2 text-xs text-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  💡 Recommandation: Augmenter les campagnes email le mardi
                </motion.div>
                <motion.div
                  className="bg-white rounded p-2 text-xs text-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  🎯 Prédiction: +15% de leads qualifiés le mois prochain
                </motion.div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow-sm p-3 border border-orange-200">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Formats d'export
              </div>
              <div className="flex gap-2">
                {['PDF', 'Excel', 'CSV'].map((format) => (
                  <span
                    key={format}
                    className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-3 text-center text-sm font-medium">
              🤖 Analyse prédictive activée
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}