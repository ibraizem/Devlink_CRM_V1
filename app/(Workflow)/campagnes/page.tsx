'use client';

import { CampaignsList } from '@/components/campaigns/CampaignsList';
import Sidebar from '@/components/Sidebar';

export default function CampaignsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
        </div>
        
        <CampaignsList baseUrl="" />
      </div>
    </div>
  );
}
