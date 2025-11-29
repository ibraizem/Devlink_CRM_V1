'use client';

import { useState } from 'react';
import { WebhookDelivery } from '@/types/webhooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WebhookDeliveriesListProps {
  deliveries: WebhookDelivery[];
  loading: boolean;
  onRefresh: () => void;
}

export function WebhookDeliveriesList({ deliveries, loading, onRefresh }: WebhookDeliveriesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Succès
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Échoué
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        );
      case 'retrying':
        return (
          <Badge className="bg-yellow-500">
            <RefreshCw className="mr-1 h-3 w-3" />
            Nouvelle tentative
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-slate-400" />;
      case 'retrying':
        return <RefreshCw className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Aucune livraison
          </h3>
          <p className="text-slate-600">
            Les livraisons de webhook apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historique des livraisons</CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(delivery.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-900">
                        {delivery.event_type}
                      </span>
                      {getStatusBadge(delivery.status)}
                      {delivery.response_status && (
                        <Badge variant="outline" className="text-xs">
                          HTTP {delivery.response_status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>
                        Créé{' '}
                        {formatDistanceToNow(new Date(delivery.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                      
                      {delivery.delivered_at && (
                        <p>
                          Livré{' '}
                          {formatDistanceToNow(new Date(delivery.delivered_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      )}
                      
                      {delivery.retry_count > 0 && (
                        <p className="text-yellow-600">
                          Tentative {delivery.retry_count}
                        </p>
                      )}
                      
                      {delivery.next_retry_at && (
                        <p className="text-yellow-600">
                          Prochaine tentative{' '}
                          {formatDistanceToNow(new Date(delivery.next_retry_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      )}
                      
                      {delivery.error_message && (
                        <p className="text-red-600">
                          Erreur : {delivery.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === delivery.id ? null : delivery.id)}
                >
                  {expandedId === delivery.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedId === delivery.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Payload</h4>
                    <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(delivery.payload, null, 2)}
                    </pre>
                  </div>

                  {delivery.transformed_payload && 
                   JSON.stringify(delivery.transformed_payload) !== JSON.stringify(delivery.payload) && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Payload transformé</h4>
                      <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(delivery.transformed_payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {delivery.response_body && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Réponse</h4>
                      <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                        {delivery.response_body}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
