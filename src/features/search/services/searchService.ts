/**
 * Search Service
 * Ürün arama işlemleri için Supabase servisi
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {getProductImageUrl} from '@core/utils';
import {sanitizeSearchQuery} from '@core/utils/sanitize';

type Stock = Database['public']['Tables']['stocks']['Row'];

export const searchService = {
  /**
   * Arama terimine göre eşleşen kategori bul
   * @param query - Arama terimi
   * @returns Eşleşen kategori ID ve adı veya null
   */
  async findMatchingCategory(query: string): Promise<{id: string; name: string} | null> {
    if (!query || !query.trim()) return null;
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    // Kategori adında tam eşleşme ara
    const {data: exactMatch} = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', sanitizedQuery)
      .limit(1);
    
    if (exactMatch && exactMatch.length > 0) {
      return {id: exactMatch[0].id, name: exactMatch[0].name};
    }
    
    // Tam eşleşme yoksa kısmi eşleşme ara
    const {data: partialMatch} = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', `%${sanitizedQuery}%`)
      .limit(1);
    
    if (partialMatch && partialMatch.length > 0) {
      return {id: partialMatch[0].id, name: partialMatch[0].name};
    }
    
    return null;
  },

  /**
   * Arama terimine göre eşleşen alt kategori bul
   * @param query - Arama terimi
   * @returns Eşleşen alt kategori ID, adı ve kategori ID'si veya null
   */
  async findMatchingSubcategory(query: string): Promise<{id: string; name: string; categoryId: string} | null> {
    if (!query || !query.trim()) return null;
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    // Alt kategori adında tam eşleşme ara
    const {data: exactMatch} = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .ilike('name', sanitizedQuery)
      .eq('is_active', true)
      .limit(1);
    
    if (exactMatch && exactMatch.length > 0) {
      return {
        id: exactMatch[0].id, 
        name: exactMatch[0].name,
        categoryId: exactMatch[0].category_id
      };
    }
    
    // Tam eşleşme yoksa kısmi eşleşme ara
    const {data: partialMatch} = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .ilike('name', `%${sanitizedQuery}%`)
      .eq('is_active', true)
      .limit(1);
    
    if (partialMatch && partialMatch.length > 0) {
      return {
        id: partialMatch[0].id, 
        name: partialMatch[0].name,
        categoryId: partialMatch[0].category_id
      };
    }
    
    return null;
  },

  /**
   * Ürün arama fonksiyonu - stocks tablosundan
   * @param query - Arama terimi (opsiyonel - kategori filtrelemesi için boş olabilir)
   * @param language - Dil kodu (tr, en, ru)
   * @param page - Sayfa numarası
   * @param pageSize - Sayfa başına ürün sayısı
   * @param categoryId - Kategori ID (opsiyonel filtreleme)
   * @param subcategoryId - Alt kategori ID (opsiyonel filtreleme)
   */
  async searchProducts(
    query: string = '',
    language: string = 'tr',
    page: number = 0,
    pageSize: number = 20,
    categoryId?: string | null,
    subcategoryId?: string | null,
  ) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Eğer arama terimi varsa ve kategori/alt kategori filtresi yoksa
    // kategori ve alt kategori adlarında da ara
    if (query && query.trim() && !categoryId && !subcategoryId) {
      const sanitizedQuery = sanitizeSearchQuery(query);
      
      // 1. Önce kategori adlarında ara
      const {data: matchingCategories} = await supabase
        .from('categories')
        .select('id')
        .ilike('name', `%${sanitizedQuery}%`);
      
      const categoryIds = matchingCategories?.map(cat => cat.id) || [];
      
      // 2. Alt kategori adlarında ara
      const {data: matchingSubcategories} = await supabase
        .from('subcategories')
        .select('id, category_id')
        .ilike('name', `%${sanitizedQuery}%`)
        .eq('is_active', true);
      
      const subcategoryIds = matchingSubcategories?.map(sub => sub.id) || [];
      const categoriesFromSubcategories = matchingSubcategories?.map(sub => sub.category_id) || [];
      
      // Tüm eşleşen kategori ID'lerini birleştir
      const allCategoryIds = [...new Set([...categoryIds, ...categoriesFromSubcategories])];
      
      // 3. Ürünleri ara - ürün adı, kategori veya alt kategori ile eşleşenler
      let queryBuilder = supabase
        .from('stocks')
        .select(`
          stock_id,
          name,
          barcode,
          sell_price,
          image_url,
          balance,
          category_id,
          subcategory_id,
          created_at
        `, {count: 'exact'})
        .eq('is_active', true)
        .gt('balance', 1);
      
      // Ürün adı, kategori veya alt kategori ile eşleşenleri getir
      if (allCategoryIds.length > 0 || subcategoryIds.length > 0) {
        // OR koşulu: ürün adı VEYA kategori VEYA alt kategori eşleşmesi
        const orConditions = [
          `name.ilike.%${sanitizedQuery}%`,
          ...(allCategoryIds.length > 0 ? [`category_id.in.(${allCategoryIds.join(',')})`] : []),
          ...(subcategoryIds.length > 0 ? [`subcategory_id.in.(${subcategoryIds.join(',')})`] : [])
        ];
        queryBuilder = queryBuilder.or(orConditions.join(','));
      } else {
        // Sadece ürün adında ara
        queryBuilder = queryBuilder.ilike('name', `%${sanitizedQuery}%`);
      }
      
      const {data, error, count} = await queryBuilder
        .range(from, to)
        .order('name');

      if (error) throw error;

      // stocks verisini products formatına dönüştür
      const productsWithImages = data?.map(stock => ({
        id: stock.stock_id.toString(),
        name: stock.name || '',
        price: stock.sell_price || 0,
        image_url: getProductImageUrl(stock.image_url),
        barcode: stock.barcode,
        stock: stock.balance || 0,
        category_id: stock.category_id,
        subcategory_id: stock.subcategory_id,
        discount: 0,
        is_active: true,
        created_at: stock.created_at,
      })) || [];

      return {
        data: productsWithImages,
        count: count || 0,
        hasMore: count ? to < count - 1 : false,
      };
    }
    
    // Normal arama (kategori filtresi varsa veya arama terimi yoksa)
    let queryBuilder = supabase
      .from('stocks')
      .select(`
        stock_id,
        name,
        barcode,
        sell_price,
        image_url,
        balance,
        category_id,
        subcategory_id,
        created_at
      `, {count: 'exact'})
      .eq('is_active', true)
      .gt('balance', 1);

    // Arama terimi varsa ekle (sanitize edilmiş)
    if (query && query.trim()) {
      const sanitizedQuery = sanitizeSearchQuery(query);
      queryBuilder = queryBuilder.ilike('name', `%${sanitizedQuery}%`);
    }

    // Kategori filtresi
    if (categoryId) {
      queryBuilder = queryBuilder.eq('category_id', categoryId);
    }

    // Alt kategori filtresi
    if (subcategoryId) {
      queryBuilder = queryBuilder.eq('subcategory_id', subcategoryId);
    }

    const {data, error, count} = await queryBuilder
      .range(from, to)
      .order('name');

    if (error) throw error;

    // stocks verisini products formatına dönüştür
    const productsWithImages = data?.map(stock => ({
      id: stock.stock_id.toString(),
      name: stock.name || '',
      price: stock.sell_price || 0,
      image_url: getProductImageUrl(stock.image_url),
      barcode: stock.barcode,
      stock: stock.balance || 0,
      category_id: stock.category_id,
      subcategory_id: stock.subcategory_id,
      discount: 0,
      is_active: true,
      created_at: stock.created_at,
    })) || [];

    return {
      data: productsWithImages,
      count: count || 0,
      hasMore: count ? to < count - 1 : false,
    };
  },

  /**
   * Popüler arama terimlerini getir
   * @param language - Dil kodu
   * @param limit - Maksimum sonuç sayısı
   */
  async getPopularSearchTerms(language: string = 'tr', limit: number = 10) {
    try {
      const {data, error} = await supabase.rpc('get_popular_search_terms', {
        lang: language,
        term_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular search terms:', error);
      return [];
    }
  },

  /**
   * Arama analitik kaydı oluştur
   * @param searchTerm - Arama terimi
   * @param resultsCount - Sonuç sayısı
   * @param language - Dil kodu
   */
  async logSearch(
    searchTerm: string,
    resultsCount: number,
    language: string = 'tr',
  ) {
    try {
      const {error} = await supabase.from('search_analytics').insert({
        search_term: searchTerm,
        results_count: resultsCount,
        language: language,
        search_timestamp: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging search:', error);
    }
  },
};

