'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppointmentsSection() {
  const appointments = [
    { time: '09:00', client: 'Entreprise A', type: 'Démo produit' },
    { time: '11:30', client: 'Entreprise B', type: 'Closing' },
    { time: '14:00', client: 'Entreprise C', type: 'Suivi' },
    { time: '16:30', client: 'Entreprise D', type: 'Découverte' },
  ];

  return (
    <FeatureSection
      id="appointments"
      title="Planifiez vos closing sans friction"
      subtitle="De la prospection au rendez-vous qualifié"
      description="Intégration native avec Calendly pour automatiser la prise de rendez-vous. Synchronisez vos calendriers et envoyez des rappels automatiques pour ne jamais manquer une opportunité."
      features={[
        'Intégration Calendly native pour booking automatique',
        'Synchronisation calendrier Google/Outlook',
        'Rappels automatiques SMS/Email avant chaque RDV',
        'Gestion des disponibilités d\'équipe en temps réel',
      ]}
      icon={Calendar}
      gradient="from-purple-500 to-indigo-600"
      iconColor="text-purple-500"
      bgColor="bg-purple-50"
      badge={{
        text: 'Auto-booking',
        stat: 'Calendly natif',
      }}
      reverse={true}
    >
      <SidePanel gradient="from-purple-500 to-indigo-600">
        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-6 flex flex-col justify-center">
          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Aujourd'hui</div>
                  <div className="text-xl font-bold">Mardi 15 Janvier</div>
                </div>
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Appointments List */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {appointments.map((apt, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {apt.time}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {apt.client}
                    </div>
                    <div className="text-xs text-gray-600">{apt.type}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="border-t border-purple-100 p-4 bg-purple-50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">4 RDV aujourd'hui</span>
                </div>
                <span className="font-semibold text-purple-600">
                  Taux de show: 92%
                </span>
              </div>
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}