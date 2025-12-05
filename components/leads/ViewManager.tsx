'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Plus, 
  Save, 
  Edit, 
  Trash2, 
  Copy, 
  Share2, 
  LayoutTemplate,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Star,
  Users,
} from 'lucide-react';
import { LeadViewConfig, ViewTemplate } from '@/types/leads';
import { CreateViewDialog } from './CreateViewDialog';
import { EditViewDialog } from './EditViewDialog';
import { ShareViewDialog } from './ShareViewDialog';
import { cn } from '@/lib/utils';

interface ViewManagerProps {
  userViews: LeadViewConfig[];
  sharedViews: LeadViewConfig[];
  templateViews: ViewTemplate[];
  currentView: LeadViewConfig | null;
  onCreateView: (view: Omit<LeadViewConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<LeadViewConfig>;
  onUpdateView: (id: string, updates: Partial<LeadViewConfig>) => Promise<LeadViewConfig>;
  onDeleteView: (id: string) => Promise<void>;
  onDuplicateView: (id: string, newName?: string) => Promise<LeadViewConfig | undefined>;
  onShareView: (id: string, shared: boolean) => Promise<void>;
  onApplyView: (view: LeadViewConfig | null) => void;
  onCreateFromTemplate: (template: ViewTemplate, customName?: string) => Promise<LeadViewConfig | undefined>;
  className?: string;
}

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'status':
      return Clock;
    case 'agent':
      return Users;
    case 'channel':
      return Phone;
    default:
      return Star;
  }
};

const getSpecificIcon = (templateId: string) => {
  switch (templateId) {
    case 'template-new-leads':
      return Sparkles;
    case 'template-in-progress':
      return Clock;
    case 'template-completed':
      return CheckCircle;
    case 'template-abandoned':
      return XCircle;
    case 'template-phone-only':
      return Phone;
    case 'template-email-only':
      return Mail;
    case 'template-high-priority':
      return Star;
    default:
      return LayoutTemplate;
  }
};

export function ViewManager({
  userViews,
  sharedViews,
  currentView,
  templateViews,
  onCreateView,
  onUpdateView,
  onDeleteView,
  onDuplicateView,
  onShareView,
  onApplyView,
  onCreateFromTemplate,
  className,
}: ViewManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [viewToEdit, setViewToEdit] = useState<LeadViewConfig | null>(null);
  const [viewToShare, setViewToShare] = useState<LeadViewConfig | null>(null);

  const handleEditView = (view: LeadViewConfig) => {
    setViewToEdit(view);
    setEditDialogOpen(true);
  };

  const handleShareView = (view: LeadViewConfig) => {
    setViewToShare(view);
    setShareDialogOpen(true);
  };

  const handleDeleteView = async (view: LeadViewConfig) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la vue "${view.name}" ?`)) {
      await onDeleteView(view.id!);
    }
  };

  const handleDuplicateView = async (view: LeadViewConfig) => {
    await onDuplicateView(view.id!, `${view.name} (copie)`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Eye className="h-4 w-4" />
            {currentView ? currentView.name : 'Vues'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Gérer les vues</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onApplyView(null)}>
            <Eye className="mr-2 h-4 w-4" />
            Vue par défaut
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une nouvelle vue
          </DropdownMenuItem>

          {currentView && (
            <DropdownMenuItem onClick={() => handleEditView(currentView)}>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder les modifications
            </DropdownMenuItem>
          )}

          {userViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Mes vues</DropdownMenuLabel>
              {userViews.map((view) => (
                <DropdownMenuSub key={view.id}>
                  <DropdownMenuSubTrigger className={cn(
                    currentView?.id === view.id && 'bg-accent'
                  )}>
                    <Eye className="mr-2 h-4 w-4" />
                    {view.name}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onApplyView(view)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Appliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditView(view)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateView(view)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareView(view)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Partager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteView(view)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </>
          )}

          {sharedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Vues partagées</DropdownMenuLabel>
              {sharedViews.map((view) => (
                <DropdownMenuSub key={view.id}>
                  <DropdownMenuSubTrigger className={cn(
                    currentView?.id === view.id && 'bg-accent'
                  )}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {view.name}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onApplyView(view)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Appliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateView(view)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </>
          )}

          {templateViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Templates prédéfinis</DropdownMenuLabel>
              {templateViews.map((template) => {
                const Icon = getSpecificIcon(template.id);
                return (
                  <DropdownMenuItem 
                    key={template.id}
                    onClick={() => onCreateFromTemplate(template)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {template.name}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateViewDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={onCreateView}
      />

      {viewToEdit && (
        <EditViewDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          view={viewToEdit}
          onUpdate={onUpdateView}
        />
      )}

      {viewToShare && (
        <ShareViewDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          view={viewToShare}
          onShare={onShareView}
        />
      )}
    </>
  );
}
