import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import * as XLSX from 'xlsx';

export interface FichierImporte {
  id: string;
  nom: string;
  chemin: string;
  statut: 'en_attente' | 'traitement' | 'termine' | 'erreur';
  user_id: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  rawData?: any[];
}

export class FichierRepository extends BaseRepository<FichierImporte> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'fichiers_import');
  }

  async getFichiersByUser(userId: string): Promise<FichierImporte[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FichierImporte[];
  }

  async getFichierAvecContenu(id: string): Promise<FichierImporte | null> {
    // Récupérer les métadonnées du fichier
    const fichier = await this.getById(id);
    if (!fichier) return null;

    // Télécharger le contenu du fichier depuis le stockage
    const { data, error } = await this.supabase.storage
      .from('fichiers')
      .download(fichier.chemin);

    if (error) throw error;

    // Lire et parser le contenu du fichier
    const contenu = await this.parserFichier(data, fichier.nom);
    
    return {
      ...fichier,
      rawData: contenu
    };
  }

  async uploadFichier(
    file: File, 
    userId: string, 
    metadata: Record<string, any> = {}
  ): Promise<FichierImporte> {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Téléverser le fichier
    const { error: uploadError } = await this.supabase.storage
      .from('fichiers')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Créer l'entrée en base de données
    return this.create({
      nom: file.name,
      chemin: fileName,
      statut: 'en_attente',
      user_id: userId,
      metadata: {
        ...metadata,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    } as Omit<FichierImporte, 'id' | 'created_at'>);
  }

  private async parserFichier(file: Blob, fileName: string): Promise<any[]> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      return this.parserJSON(await file.text());
    } else if (['csv', 'xls', 'xlsx'].includes(extension || '')) {
      return this.parserExcel(await file.arrayBuffer());
    }
    
    throw new Error(`Format de fichier non supporté: ${extension}`);
  }

  private parserJSON(content: string): any[] {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error('Erreur lors du parsing du fichier JSON');
    }
  }

  private async parserExcel(buffer: ArrayBuffer): Promise<any[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(firstSheet);
    } catch (error) {
      throw new Error('Erreur lors du parsing du fichier Excel');
    }
  }
}
