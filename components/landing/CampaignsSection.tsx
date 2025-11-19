'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Megaphone, Phone, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CampaignsSection() {
  const channels = [
    { icon: Phone, label: 'Appels', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Mail, label: 'Email', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: MessageSquare, label: 'SMS', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <FeatureSection
      id="campaigns"
      title="Prospection multicanal automatisée"
      subtitle="Appels + Email + SMS + WhatsApp en un seul endroit"
      description="Créez des campagnes de prospection multicanal puissantes. Gérez vos appels sortants et entrants avec intégration VoIP native, et automatisez vos relances par email, SMS et WhatsApp."
      features={[
        'Campagnes d\'appels sortants et entrants avec intégration VoIP native',
        'Automatisation Email + SMS + WhatsApp avec scénarios personnalisables',
        'A/B testing multicanal et optimisation continue',
        'Gestion de campagnes massives avec suivi en temps réel',
      ]}
      icon={Megaphone}
      gradient="from-rose-500 to-pink-600"
      iconColor="text-rose-500"
      bgColor="bg-rose-50"
      badge={{
        text: 'Multicanal',
        stat: '4 canaux intégrés',
      }}
      reverse={false}
    >
      <SidePanel gradient="from-rose-500 to-pink-600">
        <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 p-6 flex flex-col justify-center">
          {/* Mock Campaign Interface */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-rose-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Campagne Active : Prospection Q1
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {channels.map((channel, index) => (
                  <motion.div
                    key={channel.label}
                    className={`${channel.bg} rounded-lg p-3 border border-gray-200`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <channel.icon className={`w-4 h-4 ${channel.color}`} />
                      <span className="text-xs font-medium text-gray-700">
                        {channel.label}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {index === 0 ? '1,234' : index === 1 ? '3,456' : index === 2 ? '2,890' : '1,567'}
                    </div>
                    <div className="text-xs text-gray-500">envoyés</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Taux de conversion
                </span>
                <span className="text-sm font-bold text-rose-600">18.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full"
                  style={{ width: '18.5%' }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg p-3 text-center">
              <div className="text-xs font-medium mb-1">
                Leads contactés aujourd'hui
              </div>
              <div className="text-2xl font-bold">2,847</div>
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}