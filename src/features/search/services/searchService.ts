/**
 * Search Service
 * Ürün arama işlemleri için Supabase servisi
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {getProductImageUrl} from '@core/utils';
import {sanitizeSearchQuery, normalizeSearchQuery, normalizeTurkishChars, calculateMatchScore, filterAndSortByMatch, calculateMultiWordMatchScore, filterAndSortByMultiWordMatch} from '@core/utils/sanitize';

type Stock = Database['public']['Tables']['stocks']['Row'];

export const searchService = {
  /**
   * Arama terimine göre eşleşen kategori bul (çok dilli, Türkçe karakterlere duyarsız, çoklu kelime desteği)
   * @param query - Arama terimi
   * @param language - Dil kodu (tr, en, ru)
   * @returns Eşleşen kategori ID ve adı veya null
   */
  async findMatchingCategory(query: string, language: string = 'tr'): Promise<{id: string; name: string} | null> {
    if (!query || !query.trim()) return null;
    
    const normalizedQuery = normalizeSearchQuery(query);
    
    // Çok dilli kategori araması - category_translations tablosundan
    const {data: translations} = await supabase
      .from('category_translations')
      .select(`
        category_id,
        name,
        language_code
      `)
      .eq('language_code', language);
    
    if (!translations || translations.length === 0) return null;
    
    // Çoklu kelime akıllı eşleştirme ile en iyi sonucu bul
    const scoredMatches = filterAndSortByMultiWordMatch(
      query,
      translations,
      (t) => t.name,
      50 // Minimum %50 eşleşme skoru
    );
    
    // En yüksek skorlu eşleşmeyi döndür
    if (scoredMatches.length > 0) {
      const bestMatch = scoredMatches[0];
      return {id: bestMatch.category_id, name: bestMatch.name};
    }
    
    return null;
  },

  /**
   * Arama terimine göre eşleşen alt kategori bul (çok dilli, Türkçe karakterlere duyarsız, çoklu kelime desteği)
   * @param query - Arama terimi
   * @param language - Dil kodu (tr, en, ru)
   * @returns Eşleşen alt kategori ID, adı ve kategori ID'si veya null
   */
  async findMatchingSubcategory(query: string, language: string = 'tr'): Promise<{id: string; name: string; categoryId: string} | null> {
    if (!query || !query.trim()) return null;
    
    const normalizedQuery = normalizeSearchQuery(query);
    
    // Çok dilli alt kategori araması - subcategory_translations tablosundan
    const {data: translations} = await supabase
      .from('subcategory_translations')
      .select(`
        subcategory_id,
        name,
        language_code
      `)
      .eq('language_code', language);
    
    if (!translations || translations.length === 0) return null;
    
    // Çoklu kelime akıllı eşleştirme ile en iyi sonucu bul
    const scoredMatches = filterAndSortByMultiWordMatch(
      query,
      translations,
      (t) => t.name,
      50 // Minimum %50 eşleşme skoru
    );
    
    // En yüksek skorlu eşleşmeyi bul ve category_id'sini al
    if (scoredMatches.length > 0) {
      const bestMatch = scoredMatches[0];
      
      // Alt kategorinin category_id'sini almak için subcategories tablosuna sorgu at
      const {data: subcategory} = await supabase
        .from('subcategories')
        .select('id, category_id')
        .eq('id', bestMatch.subcategory_id)
        .eq('is_active', true)
        .single();
      
      if (subcategory) {
        return {
          id: subcategory.id,
          name: bestMatch.name,
          categoryId: subcategory.category_id
        };
      }
    }
    
    return null;
  },

  /**
   * Ürün arama fonksiyonu - stocks tablosundan
   * Gelişmiş çoklu kelime araması, Türkçe karakterlere duyarsız
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

    // Arama terimini sanitize et
    const sanitizedQuery = query && query.trim() ? sanitizeSearchQuery(query) : '';

    // Eğer arama terimi varsa ve kategori/alt kategori filtresi yoksa
    // kategori ve alt kategori adlarında da ara (çok dilli, Türkçe karakterlere duyarsız, kelime bazlı akıllı eşleştirme)
    if (sanitizedQuery && !categoryId && !subcategoryId) {
      const normalizedQuery = normalizeSearchQuery(query);
      
      // 1. Çok dilli kategori adlarında akıllı arama (çoklu kelime desteği)
      const {data: categoryTranslations} = await supabase
        .from('category_translations')
        .select('category_id, name')
        .eq('language_code', language);
      
      // Çoklu kelime eşleştirme ile kategori filtrele
      const matchingCategories = filterAndSortByMultiWordMatch(
        query,
        categoryTranslations || [],
        (t) => t.name,
        40 // Minimum %40 eşleşme skoru (çoklu kelime için daha düşük)
      );
      const matchingCategoryIds = matchingCategories.map(t => t.category_id);
      
      // 2. Çok dilli alt kategori adlarında akıllı arama (çoklu kelime desteği)
      const {data: subcategoryTranslations} = await supabase
        .from('subcategory_translations')
        .select('subcategory_id, name')
        .eq('language_code', language);
      
      // Çoklu kelime eşleştirme ile alt kategori filtrele
      const matchingSubcategories = filterAndSortByMultiWordMatch(
        query,
        subcategoryTranslations || [],
        (t) => t.name,
        40 // Minimum %40 eşleşme skoru (çoklu kelime için daha düşük)
      );
      const matchingSubcategoryIds = matchingSubcategories.map(t => t.subcategory_id);
      
      // Alt kategorilerin category_id'lerini al
      let categoriesFromSubcategories: string[] = [];
      if (matchingSubcategoryIds.length > 0) {
        const {data: subcategories} = await supabase
          .from('subcategories')
          .select('category_id')
          .in('id', matchingSubcategoryIds)
          .eq('is_active', true);
        
        categoriesFromSubcategories = subcategories?.map(sub => sub.category_id) || [];
      }
      
      // Tüm eşleşen kategori ID'lerini birleştir
      const allCategoryIds = [...new Set([...matchingCategoryIds, ...categoriesFromSubcategories])];
      
      // 3. Ürünleri ara - Türkçe karakterlere duyarsız, çoklu kelime desteği
      // Önce tüm aktif ürünleri getir (client-side filtreleme için)
      const {data: allProducts, error: productsError} = await supabase
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
        `)
        .eq('is_active', true)
        .gt('balance', 1);
      
      if (productsError) {
        console.error('Search error:', productsError);
        throw productsError;
      }

      // Client-side filtreleme ve skorlama
      const scoredProducts = (allProducts || [])
        .map(product => {
          let score = 0;
          
          // Ürün adında çoklu kelime araması (en yüksek öncelik)
          const nameScore = calculateMultiWordMatchScore(query, product.name || '');
          score = Math.max(score, nameScore);
          
          // Barkod eşleşmesi (yüksek öncelik)
          if (product.barcode) {
            const normalizedBarcode = normalizeTurkishChars(product.barcode.toLowerCase());
            if (normalizedBarcode.includes(normalizedQuery)) {
              score = Math.max(score, 85);
            }
          }
          
          // Kategori eşleşmesi (orta öncelik)
          if (allCategoryIds.includes(product.category_id)) {
            score = Math.max(score, 60);
          }
          
          // Alt kategori eşleşmesi (orta öncelik)
          if (matchingSubcategoryIds.includes(product.subcategory_id)) {
            score = Math.max(score, 65);
          }
          
          return {
            ...product,
            matchScore: score
          };
        })
        .filter(product => product.matchScore >= 40) // Minimum %40 eşleşme
        .sort((a, b) => b.matchScore - a.matchScore); // Skora göre sırala

      // Pagination uygula
      const paginatedProducts = scoredProducts.slice(from, to + 1);
      const totalCount = scoredProducts.length;

      // stocks verisini products formatına dönüştür
      const productsWithImages = paginatedProducts.map(stock => ({
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
      }));

      return {
        data: productsWithImages,
        count: totalCount,
        hasMore: to < totalCount - 1,
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

    // Arama terimi varsa - çoklu kelime ve Türkçe karakter desteği
    if (sanitizedQuery) {
      // Tüm ürünleri getir ve client-side filtrele
      const {data: allProducts, error: productsError} = await queryBuilder;
      
      if (productsError) {
        console.error('Search error:', productsError);
        throw productsError;
      }

      // Client-side filtreleme ve skorlama
      let filteredProducts = (allProducts || [])
        .map(product => ({
          ...product,
          matchScore: calculateMultiWordMatchScore(query, product.name || '')
        }))
        .filter(product => product.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore);

      // Kategori filtresi
      if (categoryId) {
        filteredProducts = filteredProducts.filter(p => p.category_id === categoryId);
      }

      // Alt kategori filtresi
      if (subcategoryId) {
        filteredProducts = filteredProducts.filter(p => p.subcategory_id === subcategoryId);
      }

      // Pagination
      const paginatedProducts = filteredProducts.slice(from, to + 1);
      const totalCount = filteredProducts.length;

      // stocks verisini products formatına dönüştür
      const productsWithImages = paginatedProducts.map(stock => ({
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
      }));

      return {
        data: productsWithImages,
        count: totalCount,
        hasMore: to < totalCount - 1,
      };
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

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

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

