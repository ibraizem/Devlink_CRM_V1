'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lead, getLeadById } from '@/lib/types/leads';
import { LeadDetailView } from '@/components/leads/LeadDetailView';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [params.id]);

  const loadLead = async () => {
    setLoading(true);
    const { data, error } = await getLeadById(params.id as string);
    if (data) setLead(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Lead introuvable
          </h2>
          <Button onClick={() => router.push('/dashboard/leads')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <LeadDetailView lead={lead} onUpdate={loadLead} />
    </div>
  );
}
