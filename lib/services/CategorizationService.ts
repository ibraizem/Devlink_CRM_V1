// CategorizationService.ts - Service de catégorisation automatique des leads
import { supabase } from '@/lib/supabase/client';

export const CategorizationService = {
  // ====================================
  // CATÉGORISATION AUTOMATIQUE
  // ====================================

  /**
   * Catégorise automatiquement les leads selon leur profil
   */
  categorizeLeads: async (data: any[], headers: string[], channels: string[]): Promise<any[]> => {
    return data.map(row => {
      const category = CategorizationService.determineLeadCategory?.(row, headers, channels) ?? 'general';
      const confidence = CategorizationService.calculateCategoryConfidence?.(row, headers, category) ?? 0.5;
      
      return {
        data: row,
        category,
        confidence,
        channels: CategorizationService.extractLeadChannels?.(row, headers, channels) ?? [],
        priority: CategorizationService.determineLeadPriority?.(row, headers, category) ?? 'low',
        metadata: {
          originalRow: row,
          categorization: {
            category,
            confidence,
            reasoning: CategorizationService.getCategoryReasoning?.(row, headers, category) ?? 'Catégorisation par défaut'
          }
        }
      };
    });
  },

  /**
   * Détermine la catégorie d'un lead
   */
  determineLeadCategory: (row: any, headers: string[], channels: string[]): string => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const normalizedRow = Object.values(row).map(cell => String(cell || '').toLowerCase().trim());
    
    // Catégories B2B
    const b2bIndicators = ['entreprise', 'company', 'société', 'sarl', 'sas', 'eurl', 'sa', 'business'];
    const hasB2BIndicators = normalizedRow.some(cell => 
      b2bIndicators.some(indicator => cell.includes(indicator))
    );
    
    if (hasB2BIndicators) {
      return 'b2b';
    }

    // Catégories par canal disponible
    if (channels.includes('linkedin') && CategorizationService.hasValidLinkedIn(row, headers)) {
      return 'professional';
    }
    
    if (channels.includes('phone') && channels.includes('email')) {
      return 'multicanal';
    }
    
    if (channels.includes('email')) {
      return 'digital';
    }

    // Catégories par fonction/poste
    const jobTitles = ['directeur', 'manager', 'chef', 'responsable', 'pdg', 'ceo', 'cto', 'directrice'];
    const hasJobTitle = normalizedRow.some(cell => 
      jobTitles.some(title => cell.includes(title))
    );
    
    if (hasJobTitle) {
      return 'decision_maker';
    }

    return 'general';
  },

  /**
   * Vérifie si un lead a un LinkedIn valide
   */
  hasValidLinkedIn: (row: any, headers: string[]): boolean => {
    const linkedinIndex = headers.findIndex(h => 
      h.toLowerCase().includes('linkedin')
    );
    
    if (linkedinIndex !== -1 && row[headers[linkedinIndex]]) {
      const linkedinValue = String(row[headers[linkedinIndex]] || '').toLowerCase();
      return linkedinValue.includes('linkedin.com') || linkedinValue.includes('linkedin');
    }
    
    return false;
  },

  /**
   * Calcule la confiance de la catégorisation
   */
  calculateCategoryConfidence: (row: any, headers: string[], category: string): number => {
    let confidence = 0.5; // Base
    
    // Plus de données disponibles = plus de confiance
    const nonEmptyCells = Object.values(row).filter(cell => cell && String(cell).trim() !== '').length;
    confidence += (nonEmptyCells / headers.length) * 0.3;
    
    // Certains canaux augmentent la confiance
    const hasEmail = headers.some((h, i) => 
      h.toLowerCase().includes('email') && row[h] && String(row[h]).includes('@')
    );
    const hasPhone = headers.some((h, i) => 
      h.toLowerCase().includes('tel') && row[h] && String(row[h]).length >= 10
    );
    
    if (hasEmail) confidence += 0.1;
    if (hasPhone) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  },

  /**
   * Extrait les canaux disponibles pour un lead
   */
  extractLeadChannels: (row: any, headers: string[], availableChannels: string[]): string[] => {
    const leadChannels: string[] = [];
    const rowValues = Object.values(row);
    
    availableChannels.forEach(channel => {
      const hasChannel = headers.some((header, index) => {
        const headerLower = header.toLowerCase();
        const cellValue = row[header];
        
        switch (channel) {
          case 'email':
            return headerLower.includes('email') && cellValue && String(cellValue).includes('@');
          case 'phone':
          case 'sms':
          case 'whatsapp':
            return headerLower.includes('tel') && cellValue && String(cellValue).length >= 10;
          case 'linkedin':
            return headerLower.includes('linkedin') && cellValue && String(cellValue).toLowerCase().includes('linkedin');
          case 'website':
            return headerLower.includes('website') && cellValue && String(cellValue).includes('http');
          default:
            return false;
        }
      });
      
      if (hasChannel) {
        leadChannels.push(channel);
      }
    });
    
    return leadChannels;
  },

  /**
   * Détermine la priorité d'un lead
   */
  determineLeadPriority: (row: any, headers: string[], category: string): 'high' | 'medium' | 'low' => {
    let score = 0;
    const rowValues = Object.values(row);
    
    // Score par catégorie
    type CategoryType = 'b2b' | 'decision_maker' | 'multicanal' | 'professional' | 'digital' | 'general';
    const categoryScores: Record<CategoryType, number> = {
      'b2b': 3,
      'decision_maker': 3,
      'multicanal': 3,
      'professional': 2,
      'digital': 1,
      'general': 0
    };
    
    score += categoryScores[category as CategoryType] || 0;
    
    // Vérification des données complètes
    const completeness = rowValues.filter(cell => cell && String(cell).trim() !== '').length / headers.length;
    score += Math.min(completeness * 3, 2);
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  },

  /**
   * Retourne la raison de la catégorisation
   */
  getCategoryReasoning: (row: any, headers: string[], category: string): string => {
    type CategoryType = 'b2b' | 'decision_maker' | 'multicanal' | 'professional' | 'digital' | 'general';
    const reasons: Record<CategoryType, string> = {
      'b2b': 'Présence d\'indicateurs d\'entreprise (SAS, SARL, etc.)',
      'decision_maker': 'Présence de titres de direction (PDG, Directeur, etc.)',
      'multicanal': 'Disponibilité de plusieurs canaux de contact',
      'professional': 'Profil LinkedIn détecté',
      'digital': 'Contact principalement par email',
      'general': 'Profil standard sans caractéristiques particulières'
    };
    
    return reasons[category as CategoryType] || 'Catégorisation par défaut';
  },

  /**
   * Retourne les statistiques des catégories
   */
  getCategoryStats: (categorizedLeads: any[]): Record<string, number> => {
    const stats: Record<string, number> = {};
    
    categorizedLeads.forEach(lead => {
      const category = lead.category || 'non_catégorisé';
      stats[category] = (stats[category] || 0) + 1;
    });
    
    return stats;
  },

  /**
   * Analyse les tendances de catégorisation
   */
  analyzeCategoryTrends: (categorizedLeads: any[]): {
    trends: Array<{
      category: string;
      count: number;
      percentage: number;
      averageConfidence: number;
    }>;
    insights: string[];
  } => {
    const stats = CategorizationService.getCategoryStats(categorizedLeads);
    const total = categorizedLeads.length;
    
    const trends = Object.entries(stats).map(([category, count]: [string, number]) => {
      const categoryLeads = categorizedLeads.filter(lead => lead.category === category);
      const averageConfidence = categoryLeads.reduce((sum, lead) => sum + (lead.confidence || 0), 0) / categoryLeads.length;
      
      return {
        category,
        count,
        percentage: (count / total) * 100,
        averageConfidence
      };
    }).sort((a, b) => b.count - a.count);

    const insights: string[] = [];
    
    // Générer des insights basés sur les tendances
    if (trends.length > 0) {
      const topCategory = trends[0];
      insights.push(`La catégorie la plus fréquente est "${topCategory.category}" avec ${topCategory.percentage.toFixed(1)}% des leads`);
      
      if (topCategory.averageConfidence < 0.7) {
        insights.push(`La confiance moyenne pour la catégorie "${topCategory.category}" est faible (${(topCategory.averageConfidence * 100).toFixed(1)}%)`);
      }
      
      const highConfidenceCategories = trends.filter(t => t.averageConfidence > 0.8);
      if (highConfidenceCategories.length > 0) {
        insights.push(`Catégories avec haute confiance: ${highConfidenceCategories.map(c => c.category).join(', ')}`);
      }
    }

    return { trends, insights };
  },

  /**
   * Suggère des améliorations pour la catégorisation
   */
  suggestImprovements: (categorizedLeads: any[]): {
    suggestions: Array<{
      type: 'missing_data' | 'low_confidence' | 'category_balance';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  } => {
    const suggestions: Array<{
      type: 'missing_data' | 'low_confidence' | 'category_balance';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];
    
    // Analyser les données manquantes
    const lowConfidenceLeads = categorizedLeads.filter(lead => (lead.confidence || 0) < 0.6);
    if (lowConfidenceLeads.length > categorizedLeads.length * 0.3) {
      suggestions.push({
        type: 'low_confidence',
        message: `${lowConfidenceLeads.length} leads ont une faible confiance (<60%). Enrichissez les données ou ajustez les règles.`,
        priority: 'high'
      });
    }
    
    // Analyser les catégories déséquilibrées
    const stats = CategorizationService.getCategoryStats(categorizedLeads);
    const total = categorizedLeads.length;
    const dominantCategory = Object.entries(stats).find(([_, count]: [string, number]) => count > total * 0.8);
    
    if (dominantCategory) {
      suggestions.push({
        type: 'category_balance',
        message: `La catégorie "${dominantCategory[0]}" domine avec plus de 80% des leads. Considérez une segmentation plus fine.`,
        priority: 'medium'
      });
    }
    
    // Analyser les données manquantes
    const emptyDataLeads = categorizedLeads.filter(lead => {
      const nonEmptyCells = lead.data.filter((cell: any) => cell && String(cell).trim() !== '');
      return nonEmptyCells.length < 3;
    });
    
    if (emptyDataLeads.length > total * 0.2) {
      suggestions.push({
        type: 'missing_data',
        message: `${emptyDataLeads.length} leads ont peu de données. Enrichissez les informations pour améliorer la catégorisation.`,
        priority: 'medium'
      });
    }
    
    return { suggestions };
  }
};