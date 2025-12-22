/**
 * Products Service
 * Product operations
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {sanitizeSearchQuery} from '@core/utils/sanitize';
import {getCategoryImageUrl, getProductImageUrl} from '@core/utils';

type Stock = Database['public']['Tables']['stocks']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export const productsService = {
  /**
   * Get products from stocks table with enhanced error handling
   * Sadece is_active = true olan ürünleri getir
   */
  async getProducts(language: string = 'tr', limit: number = 20) {
    try {
      console.log(`🛍️ Fetching products (language: ${language}, limit: ${limit})`);
      
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
        .limit(limit);

      if (error) {
        console.error('❌ Products fetch error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.warn('⚠️ Products query returned null');
        return [];
      }

      console.log(`✅ Products fetched successfully: ${data.length} items`);
      
      // stocks verisini products formatına dönüştür
      const products = data.map(stock => ({
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
        categories: stock.categories,
      }));

      // Log sample product for debugging
      if (products.length > 0) {
        console.log('📦 Sample product:', {
          id: products[0].id,
          name: products[0].name,
          price: products[0].price,
          hasImage: !!products[0].image_url,
          stock: products[0].stock
        });
      }

      return products;
    } catch (error: any) {
      console.error('❌ Products service error:', {
        message: error.message,
        code: error.code,
        language,
        limit
      });
      
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  /**
   * Get product by ID from stocks table
   */
  async getProductById(id: string, language: string = 'tr') {
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
      .single();

    if (error) throw error;
    
    // stocks verisini products formatına dönüştür
    return data ? {
      id: data.stock_id.toString(),
      name: data.name || '',
      price: data.sell_price || 0,
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
   * TR için direkt categories.name kullanılır, diğer diller için translations
   */
  async getCategories(language: string = 'tr') {
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
      })) || [];
    }

    // Diğer diller için translations ile çek
    const {data, error} = await supabase
      .from('categories')
      .select(`
        *,
        category_translations!inner(name, description, language_code)
      `)
      .eq('category_translations.language_code', language)
      .order('name');

    if (error) throw error;
    
    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    return data?.map(category => ({
      ...category,
      image_url: getCategoryImageUrl(category.image_url),
    })) || [];
  },

  /**
   * Search products from stocks table
   */
  async searchProducts(query: string, language: string = 'tr') {
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    
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
      .ilike('name', `%${sanitizedQuery}%`);

    if (error) throw error;
    
    // stocks verisini products formatına dönüştür
    return data?.map(stock => ({
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
    })) || [];
  },

  /**
   * Get products by category from stocks table
   */
  async getProductsByCategory(categoryId: string, language: string = 'tr') {
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
    
    // stocks verisini products formatına dönüştür
    return data?.map(stock => ({
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
    })) || [];
  },

  /**
   * Get subcategories by category
   * TR için direkt subcategories.name, diğer diller için translations
   */
  async getSubcategoriesByCategory(categoryId: string, language: string = 'tr') {
    // Türkçe için translation yok, direkt subcategories tablosundan çek
    if (language === 'tr') {
      const {data, error} = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }

    // Diğer diller için translations ile çek
    const {data, error} = await supabase
      .from('subcategories')
      .select(`
        *,
        subcategory_translations!inner(name, description, language_code)
      `)
      .eq('category_id', categoryId)
      .eq('subcategory_translations.language_code', language)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
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
      .eq('is_active', true);

    // Eğer subcategory seçiliyse filtrele
    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    // Pagination
    query = query.range(from, to).order('created_at', {ascending: false});

    const {data, error, count} = await query;
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
    
    return {data: productsWithImages, count, hasMore: count ? to < count - 1 : false};
  },
};

