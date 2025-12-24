/**
 * Products Service
 * Product operations
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {sanitizeSearchQuery, calculateMultiWordMatchScore, normalizeTurkishChars, normalizeSearchQuery} from '@core/utils/sanitize';
import {getCategoryImageUrl, getProductImageUrl, api} from '@core/utils';
import {calculateFinalPrice} from '@core/utils/priceCalculator';
import {getDeliverySettings} from '@features/cart/services/deliveryService';

type Stock = Database['public']['Tables']['stocks']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export const productsService = {
  /**
   * Get products from stocks table with enhanced error handling
   * Sadece is_active = true olan ürünleri getir
   * Fiyatlar kar marjı ile hesaplanır
   */
  async getProducts(language: string = 'tr', limit: number = 20) {
    try {
      // Debug log silindi - production'da gereksiz
      
      // Kar marjını al
      const deliverySettings = await getDeliverySettings();
      const profitMargin = deliverySettings?.profit_margin || 10;
      
      const {data, error} = await supabase
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
          categories(id, name)
        `)
        .eq('is_active', true)
        .gt('balance', 1)
        .limit(limit);

      if (error) {
        console.error('❌ Products fetch error:', {
          code: error.code,
          message: error.message
        });
        throw error;
      }

      if (!data) {
        return [];
      }

      // Debug log silindi - production'da gereksiz
      
      // stocks verisini products formatına dönüştür ve kar marjını uygula
      const products = data.map(stock => ({
        id: stock.stock_id.toString(),
        name: stock.name || '',
        price: calculateFinalPrice(stock.sell_price || 0, profitMargin), // Kar marjı eklenmiş fiyat
        sell_price: stock.sell_price || 0, // Orijinal satış fiyatı
        image_url: getProductImageUrl(stock.image_url),
        barcode: stock.barcode,
        stock: stock.balance || 0,
        category_id: stock.category_id,
        subcategory_id: stock.subcategory_id,
        discount: 0,
        is_active: true,
        categories: stock.categories,
      }));

      // Debug log silindi - production'da gereksiz

      return products;
    } catch (error: any) {
      console.error('❌ Products service error:', {
        message: error.message,
        code: error.code
      });
      
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  /**
   * Get product by ID from stocks table
   */
  async getProductById(id: string, language: string = 'tr') {
    // Kar marjını al
    const deliverySettings = await getDeliverySettings();
    const profitMargin = deliverySettings?.profit_margin || 10;
    
    const {data, error} = await supabase
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
        categories(id, name)
      `)
      .eq('stock_id', parseInt(id))
      .eq('is_active', true)
      .gt('balance', 1)
      .single();

    if (error) throw error;
    
    // stocks verisini products formatına dönüştür ve kar marjını uygula
    return data ? {
      id: data.stock_id.toString(),
      name: data.name || '',
      price: calculateFinalPrice(data.sell_price || 0, profitMargin), // Kar marjı eklenmiş fiyat
      sell_price: data.sell_price || 0, // Orijinal satış fiyatı
      image_url: getProductImageUrl(data.image_url),
      barcode: data.barcode,
      stock: data.balance || 0,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      discount: 0,
      is_active: true,
      categories: data.categories,
    } : null;
  },

  /**
   * Get categories with translations
   * Cypher projesindeki gibi optimize edilmiş çeviri yapısı
   * TR için direkt categories.name kullanılır, diğer diller için translations
   * Çeviri yoksa fallback olarak Türkçe isim gösterilir
   */
  async getCategories(language: string = 'tr') {
    try {
      // Türkçe için translation yok, direkt categories tablosundan çek
      if (language === 'tr') {
        const {data, error} = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        
        // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
        return data?.map(category => ({
          ...category,
          image_url: getCategoryImageUrl(category.image_url),
          original_name: category.name, // Orijinal Türkçe ismi sakla
        })) || [];
      }

      // Diğer diller için: Önce tüm kategorileri çek
      const {data: categories, error: categoriesError} = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      if (!categories) return [];

      // Sonra seçili dil için tüm çevirileri tek sorguda çek
      const categoryIds = categories.map(c => c.id);
      
      const {data: translations, error: translationsError} = await supabase
        .from('category_translations')
        .select('category_id, name, description, language_code')
        .eq('language_code', language)
        .in('category_id', categoryIds);

      if (translationsError) {
        console.warn('⚠️ Translation fetch error:', translationsError);
        // Çeviri hatası olsa bile kategorileri Türkçe olarak döndür
      }

      // Çevirileri kategorilerle eşleştir
      const translationMap = new Map(
        translations?.map(t => [t.category_id, t]) || []
      );

      // Her kategori için çeviriyi uygula
      return categories.map(category => {
        const translation = translationMap.get(category.id);
        
        return {
          ...category,
          name: translation?.name || category.name, // Çeviri varsa kullan, yoksa Türkçe
          description: translation?.description || category.description,
          image_url: getCategoryImageUrl(category.image_url),
          original_name: category.name, // Orijinal Türkçe ismi sakla
          has_translation: !!translation, // Çeviri var mı flag'i
        };
      });
    } catch (error: any) {
      console.error('❌ Categories fetch error:', {
        message: error.message,
        language,
      });
      // Hata durumunda boş array döndür
      return [];
    }
  },

  /**
   * Search products from stocks table
   * Gelişmiş çoklu kelime araması, Türkçe karakterlere duyarsız
   */
  async searchProducts(query: string, language: string = 'tr') {
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    if (!sanitizedQuery) {
      return [];
    }

    // Kar marjını al
    const deliverySettings = await getDeliverySettings();
    const profitMargin = deliverySettings?.profit_margin || 10;

    // Tüm aktif ürünleri getir
    const {data, error} = await supabase
      .from('stocks')
      .select(`
        stock_id,
        name,
        barcode,
        sell_price,
        image_url,
        balance,
        category_id,
        subcategory_id
      `)
      .eq('is_active', true)
      .gt('balance', 1);

    if (error) throw error;

    // Client-side filtreleme ve skorlama (çoklu kelime, Türkçe karakter desteği)
    const normalizedQuery = normalizeSearchQuery(query);
    
    const scoredProducts = (data || [])
      .map(stock => {
        let score = 0;
        
        // Ürün adında çoklu kelime araması
        const nameScore = calculateMultiWordMatchScore(query, stock.name || '');
        score = Math.max(score, nameScore);
        
        // Barkod eşleşmesi
        if (stock.barcode) {
          const normalizedBarcode = normalizeTurkishChars(stock.barcode.toLowerCase());
          if (normalizedBarcode.includes(normalizedQuery)) {
            score = Math.max(score, 85);
          }
        }
        
        return {
          ...stock,
          matchScore: score
        };
      })
      .filter(stock => stock.matchScore >= 40) // Minimum %40 eşleşme
      .sort((a, b) => b.matchScore - a.matchScore); // Skora göre sırala
    
    // stocks verisini products formatına dönüştür ve kar marjını uygula
    return scoredProducts.map(stock => ({
      id: stock.stock_id.toString(),
      name: stock.name || '',
      price: calculateFinalPrice(stock.sell_price || 0, profitMargin), // Kar marjı eklenmiş fiyat
      sell_price: stock.sell_price || 0, // Orijinal satış fiyatı
      image_url: getProductImageUrl(stock.image_url),
      barcode: stock.barcode,
      stock: stock.balance || 0,
      category_id: stock.category_id,
      subcategory_id: stock.subcategory_id,
      discount: 0,
      is_active: true,
    }));
  },

  /**
   * Get products by category from stocks table
   */
  async getProductsByCategory(categoryId: string, language: string = 'tr') {
    // Kar marjını al
    const deliverySettings = await getDeliverySettings();
    const profitMargin = deliverySettings?.profit_margin || 10;
    
    const {data, error} = await supabase
      .from('stocks')
      .select(`
        stock_id,
        name,
        barcode,
        sell_price,
        image_url,
        balance,
        category_id,
        subcategory_id
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (error) throw error;
    
    // stocks verisini products formatına dönüştür ve kar marjını uygula
    return data?.map(stock => ({
      id: stock.stock_id.toString(),
      name: stock.name || '',
      price: calculateFinalPrice(stock.sell_price || 0, profitMargin), // Kar marjı eklenmiş fiyat
      sell_price: stock.sell_price || 0, // Orijinal satış fiyatı
      image_url: getProductImageUrl(stock.image_url),
      barcode: stock.barcode,
      stock: stock.balance || 0,
      category_id: stock.category_id,
      subcategory_id: stock.subcategory_id,
      discount: 0,
      is_active: true,
    })) || [];
  },

  /**
   * Get subcategories by category
   * Cypher projesindeki gibi optimize edilmiş çeviri yapısı
   * TR için direkt subcategories.name, diğer diller için translations
   * Çeviri yoksa fallback olarak Türkçe isim gösterilir
   */
  async getSubcategoriesByCategory(categoryId: string, language: string = 'tr') {
    try {
      // Türkçe için translation yok, direkt subcategories tablosundan çek
      if (language === 'tr') {
        const {data, error} = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        
        return data?.map(subcategory => ({
          ...subcategory,
          original_name: subcategory.name,
        })) || [];
      }

      // Diğer diller için: Önce tüm alt kategorileri çek
      const {data: subcategories, error: subcategoriesError} = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

      if (subcategoriesError) throw subcategoriesError;
      if (!subcategories || subcategories.length === 0) return [];

      // Sonra seçili dil için tüm çevirileri tek sorguda çek
      const subcategoryIds = subcategories.map(s => s.id);
      const {data: translations, error: translationsError} = await supabase
        .from('subcategory_translations')
        .select('subcategory_id, name, description, language_code')
        .eq('language_code', language)
        .in('subcategory_id', subcategoryIds);

      if (translationsError) {
        console.warn('⚠️ Subcategory translation fetch error:', translationsError);
        // Çeviri hatası olsa bile alt kategorileri Türkçe olarak döndür
      }

      // Çevirileri alt kategorilerle eşleştir
      const translationMap = new Map(
        translations?.map(t => [t.subcategory_id, t]) || []
      );

      // Her alt kategori için çeviriyi uygula
      return subcategories.map(subcategory => {
        const translation = translationMap.get(subcategory.id);
        
        return {
          ...subcategory,
          name: translation?.name || subcategory.name, // Çeviri varsa kullan, yoksa Türkçe
          description: translation?.description || subcategory.description,
          original_name: subcategory.name, // Orijinal Türkçe ismi sakla
          has_translation: !!translation, // Çeviri var mı flag'i
        };
      });
    } catch (error: any) {
      console.error('❌ Subcategories fetch error:', {
        message: error.message,
        categoryId,
        language,
      });
      return [];
    }
  },

  /**
   * Get products by category and subcategory with pagination from stocks table
   */
  async getProductsByCategoryAndSubcategory(
    categoryId: string,
    subcategoryId: string | null,
    language: string = 'tr',
    page: number = 0,
    pageSize: number = 20,
  ) {
    // Kar marjını al
    const deliverySettings = await getDeliverySettings();
    const profitMargin = deliverySettings?.profit_margin || 10;
    
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
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
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .gt('balance', 1);

    // Eğer subcategory seçiliyse filtrele
    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    // Pagination
    query = query.range(from, to).order('created_at', {ascending: false});

    const {data, error, count} = await query;
    if (error) throw error;
    
    // stocks verisini products formatına dönüştür ve kar marjını uygula
    const productsWithImages = data?.map(stock => ({
      id: stock.stock_id.toString(),
      name: stock.name || '',
      price: calculateFinalPrice(stock.sell_price || 0, profitMargin), // Kar marjı eklenmiş fiyat
      sell_price: stock.sell_price || 0, // Orijinal satış fiyatı
      image_url: getProductImageUrl(stock.image_url),
      barcode: stock.barcode,
      stock: stock.balance || 0,
      category_id: stock.category_id,
      subcategory_id: stock.subcategory_id,
      discount: 0,
      is_active: true,
      created_at: stock.created_at,
    })) || [];
    
    return {data: productsWithImages, count, hasMore: count ? to < count - 1 : false};
  },
};

