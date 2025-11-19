// ImportService.ts - Service d'import multicanal avec détection automatique
import { supabase } from '../supabase/client';
import { FileManagementService } from './FileManagementService';
import { ValidationService } from './ValidationService';
import { CategorizationService } from './CategorizationService';
import * as XLSX from 'xlsx';

const BUCKET_NAME = 'fichiers';

// Types locaux
interface SheetInfo {
  headers: string[];
  rowCount: number;
  name: string;
}

interface ImportOptions {
  detectChannel?: boolean;
  autoCategorize?: boolean;
  enrichFromExternal?: boolean;
  userId: string;
  onProgress?: (progress: number) => void;
}

interface ImportResult {
  channels: string[];
  categorizedLeads: any[];
  qualityScore: number;
  importSummary: {
    totalLeads: number;
    validLeads: number;
    invalidLeads: number;
    duplicates: number;
    categories: Record<string, number>;
  };
}

export const ImportService = {
  // ====================================
  // IMPORT MULTICANAL
  // ====================================

  /**
   * Import multicanal avec détection automatique
   */
  importMultiChannel: async (file: File, options: ImportOptions): Promise<ImportResult> => {
    try {
      console.log('🚀 Début de l\'import multicanal...');
      
      // 1. Lire et analyser le fichier
      const fileData = await ImportService.readFileHeaders(file);
      if (!fileData || fileData.length === 0) {
        throw new Error('Impossible de lire le fichier ou fichier vide');
      }

      const sheet = fileData[0];
      const headers = sheet.headers;
      
      // Lire les données complètes du fichier
      const data = await ImportService.readFileAsJson(file, 0);
      if (!data || data.length <= 1) { // La première ligne contient les en-têtes
        throw new Error('Fichier vide ou sans données valides');
      }
      
      // Extraire les données (exclure la ligne d'en-têtes)
      const rowData = data.slice(1);

      // 2. Détection automatique des canaux
      const detectedChannels = options.detectChannel 
        ? await ImportService.detectChannels(headers, rowData)
        : ['email']; // Par défaut

      console.log('📡 Canaux détectés:', detectedChannels);

      // 3. Catégorisation automatique des leads
      const categorizedLeads = options.autoCategorize
        ? await CategorizationService.categorizeLeads(rowData, headers, detectedChannels)
        : rowData.map((row: any, index: number) => ({ id: index, data: row, category: 'non_catégorisé', channels: detectedChannels }));

      // 4. Validation et nettoyage des données
      const { validLeads, invalidLeads, duplicates } = await ValidationService.validateAndCleanLeads(
        categorizedLeads,
        headers
      );

      // 5. Calcul du score de qualité
      const qualityScore = ValidationService.calculateQualityScore(validLeads ?? [], invalidLeads ?? [], duplicates ?? []);

      // 6. Enrichissement externe si demandé
      if (options.enrichFromExternal && validLeads) {
        await ValidationService.enrichLeadsFromExternal(validLeads);
      }

      // 7. Créer le fichier avec les métadonnées multicanal
      const fileRecord = await FileManagementService.uploadFile(file, {
        user_id: options.userId,
        onProgress: options.onProgress
      });

      // 8. Mettre à jour les métadonnées avec les informations multicanal
      if (fileRecord?.id) {
        const categoryStats = CategorizationService.getCategoryStats(categorizedLeads);
        await FileManagementService.updateFileMetadata(fileRecord.id, {
          channels: detectedChannels,
          categories: categoryStats,
          qualityScore,
          importType: 'multichannel'
        });

        // Mettre à jour nb_lignes et nb_lignes_importees
        await supabase
          .from('fichiers_import')
          .update({
            nb_lignes: data.length,
            nb_lignes_importees: validLeads?.length ?? 0,
            donnees: {
              headers: Object.keys(data[0] || {}),
              rawData: data.slice(0, 100), // Stocker les 100 premières lignes pour aperçu
              totalRows: data.length,
              processingDate: new Date().toISOString(),
              detectedChannels,
              categoryStats
            }
          })
          .eq('id', fileRecord.id);
      }

      // 9. Insérer les leads valides avec les informations de canal
      if (validLeads && fileRecord?.id) {
        await ImportService.insertLeadsWithChannelInfo(validLeads, fileRecord.id, detectedChannels, options.userId);
      }

      const importSummary = {
        totalLeads: data.length,
        validLeads: validLeads?.length ?? 0,
        invalidLeads: invalidLeads?.length ?? 0,
        duplicates: duplicates?.length ?? 0,
        categories: CategorizationService.getCategoryStats(categorizedLeads)
      };

      console.log('✅ Import multicanal terminé:', importSummary);

      return {
        channels: detectedChannels,
        categorizedLeads: validLeads ?? [],
        qualityScore,
        importSummary
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'import multicanal:', error);
      throw error;
    }
  },

  // ====================================
  // DÉTECTION DE CANAUX
  // ====================================

  /**
   * Détecte automatiquement les canaux de communication disponibles
   */
  detectChannels: async (headers: string[] = [], data: any[] = []): Promise<string[]> => {
    const channels = new Set<string>();
    
    // Vérifier si les en-têtes sont valides
    if (!Array.isArray(headers) || headers.length === 0) {
      console.warn('Aucun en-tête valide fourni pour la détection des canaux');
      return [];
    }

    // Détection basée sur les en-têtes avec plus de variantes
    const channelPatterns: Record<string, string[]> = {
      email: [
        'email', 'mail', 'e-mail', 'courriel', 'contact', 
        'adresse email', 'adresse courriel', 'e-mail address', 'email address',
        'e-mailadres', 'e-mailadresse', 'emailadresse'
      ],
      phone: [
        'tel', 'telephone', 'phone', 'mobile', 'portable', 'gsm', 'numéro',
        'numéro de téléphone', 'tel1', 'tel2', 'téléphone', 'téléphone mobile',
        'mobile phone', 'phone number', 'phone1', 'phone2', 'contact number',
        'numéro mobile', 'numéro portable', 'gsm1', 'gsm2', 'phone work',
        'phone home', 'phone office', 'téléphone bureau', 'téléphone domicile',
        'numéro principal', 'numéro secondaire', 'contact tel', 'contact phone'
      ],
      linkedin: ['linkedin', 'linked in', 'profile', 'profil', 'linkedin profile', 'linkedin url'],
      website: ['website', 'site', 'url', 'web', 'site web', 'lien', 'lien web', 'web site'],
      sms: ['sms', 'text', 'portable', 'mobile', 'text message'],
      whatsapp: ['whatsapp', 'whatsapp number', 'whatsapp contact', 'whatsapp tel'],
      facebook: ['facebook', 'fb', 'social', 'facebook profile', 'fb url'],
      instagram: ['instagram', 'ig', 'insta', 'instagram profile', 'instagram handle'],
      twitter: ['twitter', 'x', 'tweet', 'twitter handle', 'x handle', 'x profile']
    };

    try {
      // Normaliser les en-têtes pour la détection
      const normalizedHeaders = headers
        .filter(Boolean) // Enlever les valeurs nulles ou undefined
        .map(h => String(h).toLowerCase().trim());
      
      // Détection basée sur les en-têtes
      normalizedHeaders.forEach((header) => {
        if (!header) return;
        
        Object.entries(channelPatterns).forEach(([channel, patterns]) => {
          if (patterns.some(pattern => 
            pattern && header.includes(pattern.toLowerCase())
          )) {
            channels.add(channel);
          }
        });
      });

      // Détection basée sur les données (vérifier s'il y a des valeurs valides)
      if (Array.isArray(data) && data.length > 0) {
        Object.entries(channelPatterns).forEach(([channel, patterns]) => {
          const headerIndex = normalizedHeaders.findIndex(h => 
            h && patterns.some(pattern => 
              pattern && h.includes(pattern.toLowerCase())
            )
          );
          
          if (headerIndex !== -1) {
            try {
              // Vérifier si les données dans cette colonne semblent valides
              const sampleData = data
                .slice(0, 10)
                .map(row => row && row[headerIndex])
                .filter(Boolean);
              
              if (sampleData.length > 0) {
                // Validation basique selon le type de canal
                const isValid = ValidationService.validateChannelData(channel, sampleData);
                if (isValid) {
                  channels.add(channel);
                }
              }
            } catch (error) {
              console.error(`Erreur lors de la validation des données pour le canal ${channel}:`, error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la détection des canaux:', error);
    }

    return Array.from(channels);
  },

  // ====================================
  // LECTURE DE FICHIERS
  // ====================================

  /**
   * Lit les en-têtes d'un fichier Excel/CSV
   */
  readFileHeaders: async (file: File): Promise<SheetInfo[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: SheetInfo[] = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            return {
              name,
              headers: jsonData[0] || [],
              rowCount: jsonData.length - 1 // Exclure la ligne d'en-têtes
            };
          });
          
          resolve(sheets);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Lit un fichier Excel/CSV et le convertit en JSON
   */
  readFileAsJson: async (file: File, sheetIndex: number = 0): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (sheetIndex >= workbook.SheetNames.length) {
            reject(new Error(`Index de feuille ${sheetIndex} hors limites`));
            return;
          }
          
          const worksheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Convertir en format avec en-têtes
          if (jsonData.length > 0) {
            const headers = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            resolve(rows);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  },

  // ====================================
  // MAPPAGE DE DONNÉES
  // ====================================

  /**
   * Mappe les données selon une configuration de colonnes
   */
  mapData: (data: any[], mapping: Record<string, string>): any[] => {
    return data.map(row => {
      const mappedRow: any = {};
      
      Object.entries(mapping).forEach(([targetField, sourceField]) => {
        mappedRow[targetField] = row[sourceField] || '';
      });
      
      return mappedRow;
    });
  },

  // ====================================
  // IMPORT DE DONNÉES
  // ====================================

  /**
   * Importe des données dans la base
   */
  importData: async (data: any[], fileId: string, options: {
    userId: string;
    onProgress?: (progress: number) => void;
  }): Promise<{
    success: number;
    errors: any[];
  }> => {
    const errors: any[] = [];
    let success = 0;
    
    for (let i = 0; i < data.length; i++) {
      try {
        const lead = data[i];
        
        // Validation basique
        if (!lead.email && !lead.phone) {
          errors.push({ index: i, error: 'Email ou téléphone requis' });
          continue;
        }
        
        // Insérer dans la base
        const { error } = await supabase
          .from('leads')
          .insert({
            ...lead,
            fichier_id: fileId,
            campaign_id: lead.campaign_id || null,
            source_import: 'import_fichier',
            statut: lead.statut || 'nouveau',
            agent_id: options.userId,
            user_id: options.userId,
            created_at: new Date().toISOString()
          });
          
        if (error) {
          errors.push({ index: i, error: error.message });
        } else {
          success++;
        }
        
        // Progress callback
        if (options.onProgress) {
          options.onProgress((i + 1) / data.length * 100);
        }
        
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message });
      }
    }
    
    return { success, errors };
  },

  // ====================================
  // UTILITAIRES
  // ====================================

  /**
   * Insère les leads avec les informations de canal
   */
  insertLeadsWithChannelInfo: async (leads: any[], fileId: string, channels: string[], userId?: string): Promise<void> => {
    for (const lead of leads) {
      const leadData = {
        ...lead.data,
        channels: channels,
        category: lead.category,
        confidence: lead.confidence,
        fichier_id: fileId,
        campaign_id: lead.campaign_id || null,
        source_import: 'import_fichier',
        statut: lead.statut || 'nouveau',
        agent_id: userId || lead.data.user_id,
        user_id: userId || lead.data.user_id,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('leads')
        .insert(leadData);
    }
  }
};
