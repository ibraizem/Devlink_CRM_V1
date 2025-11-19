// ValidationService.ts - Service de validation et nettoyage des données
import { supabase } from '../supabase/client';

export const ValidationService = {
  // ====================================
  // VALIDATION DES DONNÉES
  // ====================================

  /**
   * Valide et nettoie les leads
   */
  validateAndCleanLeads: async (categorizedLeads: any[], headers: string[]): Promise<{
    validLeads: any[];
    invalidLeads: any[];
    duplicates: any[];
  }> => {
    const validLeads: any[] = [];
    const invalidLeads: any[] = [];
    const duplicates: any[] = [];
    const seenEmails = new Set();
    const seenPhones = new Set();
    
    categorizedLeads.forEach(lead => {
      const email = ValidationService.extractValue(lead.data, headers, 'email');
      const phone = ValidationService.extractValue(lead.data, headers, 'tel');
      
      // Vérification des doublons
      if (email && seenEmails.has(email.toLowerCase())) {
        duplicates.push(lead);
        return;
      }
      if (phone && seenPhones.has(phone.replace(/\s/g, ''))) {
        duplicates.push(lead);
        return;
      }
      
      // Validation minimale
      const hasValidContact = (email && ValidationService.isValidEmail(email)) || 
                             (phone && ValidationService.isValidPhone(phone));
      
      if (hasValidContact) {
        validLeads.push(lead);
        if (email) seenEmails.add(email.toLowerCase());
        if (phone) seenPhones.add(phone.replace(/\s/g, ''));
      } else {
        invalidLeads.push(lead);
      }
    });
    
    return { validLeads, invalidLeads, duplicates };
  },

  /**
   * Extrait une valeur selon le type de colonne
   */
  extractValue: (row: any[], headers: string[] = [], type: string): string => {
    // Vérifier les entrées
    if (!Array.isArray(headers) || !row || !type) {
      console.warn('Paramètres invalides pour extractValue', { 
        row: row ? 'défini' : 'non défini',
        headers: headers ? `array[${headers.length}]` : 'non défini',
        type: type || 'non défini'
      });
      return '';
    }

    // Définir les variantes pour chaque type de champ
    const variants: Record<string, string[]> = {
      email: [
        'email', 'e-mail', 'courriel', 'mail', 'contact', 
        'adresse email', 'adresse courriel', 'courrier', 'e-mail address',
        'email address', 'e-mailadres', 'e-mailadresse', 'emailadresse'
      ],
      tel: [
        'tel', 'telephone', 'phone', 'mobile', 'portable', 'gsm', 'numéro',
        'numéro de téléphone', 'tel1', 'tel2', 'téléphone', 'téléphone mobile',
        'mobile phone', 'phone number', 'phone1', 'phone2', 'contact number',
        'numéro mobile', 'numéro portable', 'gsm1', 'gsm2', 'phone work',
        'phone home', 'phone office', 'téléphone bureau', 'téléphone domicile',
        'numéro principal', 'numéro secondaire', 'contact tel', 'contact phone'
      ]
    };

    try {
      // Trouver l'index de la première colonne qui correspond à l'un des noms
      const columnIndex = headers.findIndex(header => {
        if (!header) return false;
        
        try {
          const headerLower = String(header).toLowerCase().trim();
          return variants[type]?.some(variant => 
            variant && headerLower.includes(variant.toLowerCase())
          ) || false;
        } catch (e) {
          console.warn('Erreur lors du traitement de l\'en-tête:', header, e);
          return false;
        }
      });

      // Journalisation pour le débogage
      if (columnIndex !== -1) {
        console.log(`Colonne ${type} détectée : ${headers[columnIndex]}`);
      } else {
        console.log(`Aucune colonne ${type} détectée. Noms testés :`, variants[type]);
        console.log('En-têtes disponibles :', headers);
      }

      // Retourner la valeur de la colonne trouvée, ou une chaîne vide
      if (columnIndex !== -1 && columnIndex < row.length) {
        const value = row[columnIndex];
        return value !== null && value !== undefined ? String(value).trim() : '';
      }
      return '';
    } catch (error) {
      console.error('Erreur dans extractValue:', error);
      return '';
    }
  },

  /**
   * Valide un email
   * Plus permissif pour les cas réels
   */
  isValidEmail: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    
    // Nettoyer l'email
    const cleanEmail = email.trim().toLowerCase();
    
    // Vérifier la longueur minimale
    if (cleanEmail.length < 5) return false;
    
    // Vérifier la présence d'un @ et d'un point
    const atIndex = cleanEmail.indexOf('@');
    const dotIndex = cleanEmail.lastIndexOf('.');
    
    if (atIndex < 1 || dotIndex <= atIndex + 1 || dotIndex === cleanEmail.length - 1) {
      return false;
    }
    
    // Vérifier les caractères autorisés
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return emailRegex.test(cleanEmail);
  },

  /**
   * Valide un numéro de téléphone
   * Accepte les formats internationaux et français
   */
  isValidPhone: (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') return false;
    
    // Nettoyer le numéro (ne garder que les chiffres)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Vérifier la longueur (entre 8 et 15 chiffres)
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return false;
    }
    
    // Vérifier que ce ne sont pas que des zéros
    if (/^0+$/.test(cleanPhone)) {
      return false;
    }
    
    // Vérifier le format selon le pays (exemple pour la France)
    // Format international : +33 ou 0033 suivi de 9 chiffres
    // Format national : 0 suivi de 9 chiffres
    const frPhoneRegex = /^(\+33|0033|0)[1-9]\d{8}$/;
    
    return frPhoneRegex.test(cleanPhone) || cleanPhone.length >= 8;
  },

  /**
   * Calcule le score de qualité global
   */
  calculateQualityScore: (validLeads: any[], invalidLeads: any[], duplicates: any[]): number => {
    const total = validLeads.length + invalidLeads.length + duplicates.length;
    if (total === 0) return 0;
    
    // Calcul du pourcentage de leads valides
    const validPercentage = (validLeads.length / total) * 100;
    
    // Arrondi à l'entier le plus proche
    return Math.round(validPercentage);
  },

  /**
   * Enrichit les leads depuis des sources externes (placeholder)
   */
  enrichLeadsFromExternal: async (leads: any[]): Promise<void> => {
    // TODO: Implémenter l'enrichissement depuis des APIs externes
    console.log('Enrichissement externe non implémenté');
  },

  /**
   * Valide les données d'un canal spécifique
   */
  validateChannelData: (channel: string, sampleData: string[]): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    
    let validCount = 0;
    const requiredValidCount = Math.max(1, Math.floor(sampleData.length * 0.1)); // Au moins 10% de données valides
    
    for (const data of sampleData) {
      if (!data || data.trim() === '') continue;
      
      let isValid = false;
      switch (channel) {
        case 'email':
          isValid = emailRegex.test(data);
          break;
        case 'phone':
        case 'sms':
        case 'whatsapp':
          isValid = phoneRegex.test(data) && data.replace(/\D/g, '').length >= 10;
          break;
        case 'linkedin':
          isValid = data.toLowerCase().includes('linkedin.com') || data.toLowerCase().includes('linkedin');
          break;
        case 'website':
          isValid = data.includes('.') && (data.startsWith('http') || data.includes('www'));
          break;
        default:
          isValid = data.trim().length > 0;
      }
      
      if (isValid) validCount++;
      if (validCount >= requiredValidCount) return true;
    }
    
    return false;
  },

  /**
   * Valide la structure d'un fichier
   */
  validateFileStructure: (headers: string[], data: any[]): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    // Vérifier qu'il y a des en-têtes
    if (!headers || headers.length === 0) {
      errors.push('Aucun en-tête trouvé');
    }
    
    // Vérifier qu'il y a des données
    if (!data || data.length === 0) {
      errors.push('Aucune donnée trouvée');
    }
    
    // Vérifier que chaque ligne a le bon nombre de colonnes
    if (headers && data) {
      data.forEach((row, index) => {
        if (row.length !== headers.length) {
          errors.push(`Ligne ${index + 1}: Nombre de colonnes incorrect (${row.length} au lieu de ${headers.length})`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Nettoie les données
   */
  cleanData: (data: any[]): any[] => {
    return data.map(row => 
      row.map((cell: any) => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'string') {
          return cell.trim().replace(/\s+/g, ' ');
        }
        return cell;
      })
    );
  },

  /**
   * Détecte les anomalies dans les données
   */
  detectAnomalies: (data: any[], headers: string[]): Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }> => {
    const anomalies: Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];
    
    // Détection des colonnes vides
    headers.forEach((header, index) => {
      const columnData = data.map(row => row[index]).filter(cell => cell && cell.trim() !== '');
      if (columnData.length === 0) {
        anomalies.push({
          type: 'empty_column',
          message: `La colonne "${header}" est complètement vide`,
          priority: 'medium'
        });
      }
    });
    
    // Détection des doublons évidents
    const seenRows = new Set();
    data.forEach((row, index) => {
      const rowKey = row.join('|');
      if (seenRows.has(rowKey)) {
        anomalies.push({
          type: 'duplicate_row',
          message: `Ligne ${index + 1} est un doublon exact`,
          priority: 'low'
        });
      }
      seenRows.add(rowKey);
    });
    
    return anomalies;
  }
};
