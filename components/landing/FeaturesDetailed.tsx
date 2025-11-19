'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic imports for better performance
const DashboardSection = dynamic(() => import('./DashboardSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const LeadsSection = dynamic(() => import('./LeadsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const CampaignsSection = dynamic(() => import('./CampaignsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const IntegrationsSection = dynamic(() => import('./IntegrationsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const FilesSection = dynamic(() => import('./FilesSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const AppointmentsSection = dynamic(() => import('./AppointmentsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const TeamsSection = dynamic(() => import('./TeamsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

const ReportsSection = dynamic(() => import('./ReportsSection'), {
  ssr: true,
  loading: () => (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">Chargement...</div>
    </div>
  ),
});

export default function FeaturesDetailed() {
  return (
    <div className="w-full bg-gradient-to-b from-blue-50/50 via-white to-blue-50/50">
      <Suspense
        fallback={
          <div className="py-20 bg-white">
            <div className="container mx-auto px-4">Chargement des fonctionnalités...</div>
          </div>
        }
      >
        <DashboardSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <LeadsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-white">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <CampaignsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <IntegrationsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-white">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <FilesSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <AppointmentsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-white">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <TeamsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">Chargement...</div>
          </div>
        }
      >
        <ReportsSection />
      </Suspense>
    </div>
  );
}