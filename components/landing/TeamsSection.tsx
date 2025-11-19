'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Users2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamsSection() {
  const teamMembers = [
    { name: 'Sophie M.', role: 'Team Lead', calls: 145, conversion: '22%', color: 'from-blue-500 to-blue-600' },
    { name: 'Thomas L.', role: 'Senior', calls: 132, conversion: '19%', color: 'from-purple-500 to-purple-600' },
    { name: 'Marie D.', role: 'Agent', calls: 118, conversion: '17%', color: 'from-pink-500 to-pink-600' },
    { name: 'Lucas B.', role: 'Agent', calls: 98, conversion: '15%', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <FeatureSection
      id="teams"
      title="Collaborez à grande échelle"
      subtitle="Gérez des équipes de téléprospection performantes"
      description="Organisez vos équipes commerciales, attribuez automatiquement les leads et suivez les performances en temps réel. Créez une culture de la performance avec des outils de collaboration intégrés."
      features={[
        'Gestion des rôles et permissions granulaires',
        'Attribution automatique des leads par volume et compétence',
        'Suivi des performances individuelles et benchmarking',
        'Messagerie interne et collaboration en temps réel',
      ]}
      icon={Users2}
      gradient="from-cyan-500 to-blue-600"
      iconColor="text-cyan-500"
      bgColor="bg-cyan-50"
      badge={{
        text: 'Collaboration',
        stat: 'Gestion d\'équipe',
      }}
      reverse={false}
    >
      <SidePanel gradient="from-cyan-500 to-blue-600">
        <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-50 p-6 flex flex-col justify-center">
          <div className="space-y-3">
            {/* Team Performance Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Performance de l'équipe
                </h3>
                <div className="flex items-center gap-1 text-green-500">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold">+12%</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">493 appels</div>
              <div className="text-xs text-gray-500">aujourd'hui</div>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  className="bg-white rounded-lg shadow-sm p-3 border border-cyan-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">
                        {member.calls}
                      </div>
                      <div className="text-xs text-cyan-600 font-medium">
                        {member.conversion}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team Stats */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs opacity-90 mb-1">Taux moyen</div>
                  <div className="text-xl font-bold">18.2%</div>
                </div>
                <div>
                  <div className="text-xs opacity-90 mb-1">Objectif</div>
                  <div className="text-xl font-bold">500/j</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}