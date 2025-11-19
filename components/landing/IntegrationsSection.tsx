'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Plug, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IntegrationsSection() {
  const integrations = [
    { name: 'OnOff', color: 'from-blue-500 to-blue-600' },
    { name: 'Aircall', color: 'from-green-500 to-green-600' },
    { name: 'Ringover', color: 'from-purple-500 to-purple-600' },
    { name: 'WhatsApp', color: 'from-green-400 to-green-500' },
    { name: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
    { name: 'Zoom', color: 'from-blue-500 to-indigo-600' },
    { name: 'Gmail', color: 'from-red-500 to-red-600' },
    { name: 'Outlook', color: 'from-blue-500 to-blue-600' },
    { name: 'Zapier', color: 'from-orange-500 to-orange-600' },
    { name: 'Make', color: 'from-purple-500 to-pink-500' },
    { name: 'n8n', color: 'from-pink-500 to-rose-600' },
    { name: 'Odoo', color: 'from-purple-600 to-purple-700' },
  ];

  return (
    <FeatureSection
      id="integrations"
      title="Connectez tous vos outils de prospection"
      subtitle="VoIP, Email, CRM, Automatisation - Tout en un"
      description="Intégrez nativement vos outils de téléphonie VoIP, messagerie et automatisation. Centralisez votre prospection multicanal dans une seule plateforme."
      features={[
        'Intégrations VoIP natives : OnOff, Aircall, Ringover (appels sortants/entrants)',
        'Messagerie multicanal : WhatsApp, Gmail, Outlook',
        'Automatisation : Zapier, Make, n8n pour workflows personnalisés',
        'CRM & Outils : LinkedIn, Zoom, Odoo, et plus encore',
        'Extension Chrome AI (en développement) : Enrichissement automatique des leads',
      ]}
      icon={Plug}
      gradient="from-indigo-500 to-violet-600"
      iconColor="text-indigo-500"
      bgColor="bg-indigo-50"
      badge={{
        text: '12+ outils',
        stat: 'VoIP natif',
      }}
      reverse={true}
    >
      <SidePanel gradient="from-indigo-500 to-violet-600">
        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-violet-50 p-6 flex flex-col justify-center">
          {/* Integration Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="text-center">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${integration.color} mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs`}
                  >
                    {integration.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {integration.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* VoIP Badge */}
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg p-4 text-center"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="font-bold text-sm">Intégrations VoIP</span>
            </div>
            <div className="text-xs opacity-90">
              Appels sortants & entrants intégrés
            </div>
          </motion.div>

          {/* Chrome Extension Badge */}
          <motion.div
            className="mt-3 bg-white border-2 border-indigo-200 rounded-lg p-3 text-center"
            animate={{
              borderColor: ['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.6)', 'rgba(99, 102, 241, 0.2)'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-2 h-2 bg-indigo-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              <span className="text-xs font-semibold text-indigo-600">
                Extension Chrome AI - En développement
              </span>
            </div>
          </motion.div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}