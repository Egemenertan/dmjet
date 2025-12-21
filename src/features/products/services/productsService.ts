/**
 * Products Service
 * Product operations
 */

import {supabase} from '@core/services/supabase';
import {Database} from '@core/types/database.types';
import {sanitizeSearchQuery} from '@core/utils/sanitize';
import {getCategoryImageUrl, getProductImageUrl} from '@core/utils';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export const productsService = {
  /**
   * Get products with translations
   * TR için direkt products.name, diğer diller için translations
   */
  async getProducts(language: string = 'tr', limit: number = 20) {
    // Türkçe için translation yok, direkt products tablosundan çek
    if (language === 'tr') {
      const {data, error} = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name)
        `)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      
      // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
      return data?.map(product => ({
        ...product,
        image_url: getProductImageUrl(product.image_url),
      })) || [];
    }

    // Diğer diller için translations ile çek
    const {data, error} = await supabase
      .from('products')
      .select(`
        *,
        product_translations!inner(name, description, language_code),
        categories(id, name)
      `)
      .eq('product_translations.language_code', language)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    
    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    return data?.map(product => ({
      ...product,
      image_url: getProductImageUrl(product.image_url),
    })) || [];
  },

  /**
   * Get product by ID
   * TR için direkt products.name, diğer diller için translations
   */
  async getProductById(id: string, language: string = 'tr') {
    // Türkçe için translation yok, direkt products tablosundan çek
    if (language === 'tr') {
      const {data, error} = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Image URL'yi Supabase Storage'dan tam URL'ye dönüştür
      return data ? {
        ...data,
        image_url: getProductImageUrl(data.image_url),
      } : null;
    }

    // Diğer diller için translations ile çek
    const {data, error} = await supabase
      .from('products')
      .select(`
        *,
        product_translations!inner(name, description, language_code),
        categories(id, name)
      `)
      .eq('id', id)
      .eq('product_translations.language_code', language)
      .single();

    if (error) throw error;
    
    // Image URL'yi Supabase Storage'dan tam URL'ye dönüştür
    return data ? {
      ...data,
      image_url: getProductImageUrl(data.image_url),
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
   * Search products
   * TR için direkt products.name, diğer diller için translations
   */
  async searchProducts(query: string, language: string = 'tr') {
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    // Türkçe için translation yok, direkt products tablosundan ara
    if (language === 'tr') {
      const {data, error} = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${sanitizedQuery}%`);

      if (error) throw error;
      
      // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
      return data?.map(product => ({
        ...product,
        image_url: getProductImageUrl(product.image_url),
      })) || [];
    }

    // Diğer diller için translations ile ara
    const {data, error} = await supabase
      .from('products')
      .select(`
        *,
        product_translations!inner(name, description, language_code)
      `)
      .eq('product_translations.language_code', language)
      .eq('is_active', true)
      .ilike('product_translations.name', `%${sanitizedQuery}%`);

    if (error) throw error;
    
    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    return data?.map(product => ({
      ...product,
      image_url: getProductImageUrl(product.image_url),
    })) || [];
  },

  /**
   * Get products by category
   * TR için direkt products.name, diğer diller için translations
   */
  async getProductsByCategory(categoryId: string, language: string = 'tr') {
    // Türkçe için translation yok, direkt products tablosundan çek
    if (language === 'tr') {
      const {data, error} = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (error) throw error;
      
      // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
      return data?.map(product => ({
        ...product,
        image_url: getProductImageUrl(product.image_url),
      })) || [];
    }

    // Diğer diller için translations ile çek
    const {data, error} = await supabase
      .from('products')
      .select(`
        *,
        product_translations!inner(name, description, language_code)
      `)
      .eq('category_id', categoryId)
      .eq('product_translations.language_code', language)
      .eq('is_active', true);

    if (error) throw error;
    
    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    return data?.map(product => ({
      ...product,
      image_url: getProductImageUrl(product.image_url),
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
   * Get products by category and subcategory with pagination
   * TR için direkt products.name, diğer diller için translations
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

    // Türkçe için translation yok, direkt products tablosundan çek
    if (language === 'tr') {
      let query = supabase
        .from('products')
        .select('*', {count: 'exact'})
        .eq('category_id', categoryId)
        .eq('is_active', true);

      // Eğer subcategory seçiliyse filtrele, null ise tüm ürünleri getir
      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      }

      // Pagination
      query = query.range(from, to).order('created_at', {ascending: false});

      const {data, error, count} = await query;
      if (error) throw error;
      
      // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
      const productsWithImages = data?.map(product => ({
        ...product,
        image_url: getProductImageUrl(product.image_url),
      })) || [];
      
      return {data: productsWithImages, count, hasMore: count ? to < count - 1 : false};
    }

    // Diğer diller için translations ile çek
    let query = supabase
      .from('products')
      .select(
        `
        *,
        product_translations!inner(name, description, language_code)
      `,
        {count: 'exact'},
      )
      .eq('category_id', categoryId)
      .eq('product_translations.language_code', language)
      .eq('is_active', true);

    // Eğer subcategory seçiliyse filtrele
    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    // Pagination
    query = query.range(from, to).order('created_at', {ascending: false});

    const {data, error, count} = await query;
    if (error) throw error;
    
    // Image URL'lerini Supabase Storage'dan tam URL'ye dönüştür
    const productsWithImages = data?.map(product => ({
      ...product,
      image_url: getProductImageUrl(product.image_url),
    })) || [];
    
    return {data: productsWithImages, count, hasMore: count ? to < count - 1 : false};
  },
};

