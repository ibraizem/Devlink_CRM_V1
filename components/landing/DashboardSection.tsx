'use client';

import FeatureSection from './FeatureSection';
import SidePanel from './SidePanel';
import { Home, TrendingUp } from 'lucide-react';

export default function DashboardSection() {
  return (
    <FeatureSection
      id="dashboard"
      title="Pilotez des milliers de leads en temps réel"
      subtitle="Tableaux de bord conçus pour gérer des gros volumes"
      description="Gérez et suivez des milliers de leads simultanément avec des performances optimales. Visualisez vos KPIs en temps réel et prenez des décisions éclairées basées sur des données actualisées."
      features={[
        'Suivi de milliers de leads simultanément avec performance optimale',
        'KPIs en temps réel : taux de contact, conversion, volume d\'appels',
        'Visualisation des performances par agent, équipe et campagne',
        'Alertes intelligentes sur les objectifs et anomalies de volume',
      ]}
      icon={Home}
      gradient="from-blue-500 to-blue-950"
      iconColor="text-blue-500"
      bgColor="bg-blue-50"
      badge={{
        text: 'Temps réel',
        stat: '10 000+ leads gérés',
      }}
      reverse={false}
    >
      <SidePanel gradient="from-blue-500 to-blue-600">
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex flex-col justify-center">
          {/* Mock Dashboard Interface */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">
                  Dashboard Analytics
                </span>
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-xs text-gray-600 mb-1">Total Leads</div>
                  <div className="text-2xl font-bold text-gray-800">10,234</div>
                  <div className="text-xs text-green-500 font-medium">+23%</div>
                </div>
                <div className="bg-purple-50 rounded p-3">
                  <div className="text-xs text-gray-600 mb-1">Conversions</div>
                  <div className="text-2xl font-bold text-gray-800">1,847</div>
                  <div className="text-xs text-green-500 font-medium">+18%</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-2">
                Nouveaux leads
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-800">740</span>
                <span className="text-xs text-green-500 font-medium">+17%</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
              <div className="text-xs font-medium mb-1">Performance en temps réel</div>
              <div className="text-2xl font-bold">
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Excellent
              </div>
            </div>
          </div>
        </div>
      </SidePanel>
    </FeatureSection>
  );
}