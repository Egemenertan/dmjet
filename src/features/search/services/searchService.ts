/**
 * Search Service
 * Ürün arama işlemleri için Supabase servisi
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {getProductImageUrl} from '@core/utils';

type Product = Database['public']['Tables']['products']['Row'];

export const searchService = {
  /**
   * Ürün arama fonksiyonu
   * Hem Türkçe hem de diğer diller için çalışır
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

    // Türkçe için direkt products tablosundan ara
    if (language === 'tr') {
      let queryBuilder = supabase
        .from('products')
        .select('*', {count: 'exact'})
        .eq('is_active', true);

      // Arama terimi varsa ekle
      if (query && query.trim()) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
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

      // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
      const productsWithImages = data?.map(product => ({
        ...product,
        image_url: getProductImageUrl(product.image_url),
      })) || [];

      return {
        data: productsWithImages,
        count: count || 0,
        hasMore: count ? to < count - 1 : false,
      };
    }

    // Diğer diller için translations ile ara
    let queryBuilder = supabase
      .from('products')
      .select(
        `
        *,
        product_translations!inner(name, description, language_code)
      `,
        {count: 'exact'},
      )
      .eq('product_translations.language_code', language)
      .eq('is_active', true);

    // Arama terimi varsa ekle
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `product_translations.name.ilike.%${query}%,product_translations.description.ilike.%${query}%`,
      );
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

    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    const productsWithImages = data?.map(product => ({
      ...product,
      image_url: getProductImageUrl(product.image_url),
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

