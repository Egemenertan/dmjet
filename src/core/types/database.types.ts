export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          content_en: string | null
          content_ru: string | null
          created_at: string | null
          excerpt: string
          excerpt_en: string | null
          excerpt_ru: string | null
          featured_image: string | null
          id: string
          language: string
          published_at: string | null
          seo_description: string | null
          seo_description_en: string | null
          seo_description_ru: string | null
          seo_title: string | null
          seo_title_en: string | null
          seo_title_ru: string | null
          slug: string
          slug_en: string | null
          slug_ru: string | null
          status: string
          tags: Json | null
          title: string
          title_en: string | null
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          content_en?: string | null
          content_ru?: string | null
          created_at?: string | null
          excerpt: string
          excerpt_en?: string | null
          excerpt_ru?: string | null
          featured_image?: string | null
          id?: string
          language?: string
          published_at?: string | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_description_ru?: string | null
          seo_title?: string | null
          seo_title_en?: string | null
          seo_title_ru?: string | null
          slug: string
          slug_en?: string | null
          slug_ru?: string | null
          status?: string
          tags?: Json | null
          title: string
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          content_en?: string | null
          content_ru?: string | null
          created_at?: string | null
          excerpt?: string
          excerpt_en?: string | null
          excerpt_ru?: string | null
          featured_image?: string | null
          id?: string
          language?: string
          published_at?: string | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_description_ru?: string | null
          seo_title?: string | null
          seo_title_en?: string | null
          seo_title_ru?: string | null
          slug?: string
          slug_en?: string | null
          slug_ru?: string | null
          status?: string
          tags?: Json | null
          title?: string
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string | null
          slug_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug?: string | null
          slug_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string | null
          slug_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          language_code: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      new: {
        Row: {
          barcode: string | null
          created_at: string
          id: number
          image_url: string | null
          name: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          name?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          expo_push_token: string | null
          expo_receipt_id: string | null
          expo_ticket_id: string | null
          failed_reason: string | null
          id: string
          read_at: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          expo_push_token?: string | null
          expo_receipt_id?: string | null
          expo_ticket_id?: string | null
          failed_reason?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          expo_push_token?: string | null
          expo_receipt_id?: string | null
          expo_ticket_id?: string | null
          failed_reason?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string
          delivery_rating: number | null
          id: string
          is_anonymous: boolean | null
          order_id: string
          product_quality_rating: number | null
          rating: number
          service_rating: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id: string
          product_quality_rating?: number | null
          rating: number
          service_rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id?: string
          product_quality_rating?: number | null
          rating?: number
          service_rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statistics: {
        Row: {
          cancellation_reason: string | null
          coupon_discount: number | null
          created_at: string | null
          delivery_fee: number | null
          expense: number
          id: string
          notes: string | null
          order_id: string | null
          order_type: string | null
          product_revenue: number | null
          profit: number | null
          revenue: number | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          delivery_fee?: number | null
          expense?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          order_type?: string | null
          product_revenue?: number | null
          profit?: number | null
          revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          delivery_fee?: number | null
          expense?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          order_type?: string | null
          product_revenue?: number | null
          profit?: number | null
          revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_statistics_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string | null
          delivery_fee_free: boolean | null
          delivery_note: string | null
          expense_amount: number | null
          id: string
          items: Json
          original_amount: number | null
          payment_method: string
          shipping_address: Json
          status: string
          total_amount: number
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          delivery_fee_free?: boolean | null
          delivery_note?: string | null
          expense_amount?: number | null
          id?: string
          items: Json
          original_amount?: number | null
          payment_method: string
          shipping_address: Json
          status: string
          total_amount: number
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          delivery_fee_free?: boolean | null
          delivery_note?: string | null
          expense_amount?: number | null
          id?: string
          items?: Json
          original_amount?: number | null
          payment_method?: string
          shipping_address?: Json
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pro: {
        Row: {
          alim_fiyati: string | null
          bakiye: number | null
          barcode: string | null
          created_at: string | null
          departman: string | null
          grup_kodu: string | null
          id: number
          image_url: string | null
          name: string | null
          no: number | null
          ozel_kod_3: string | null
          satis_fiyati_tl: string | null
          updated_at: string | null
        }
        Insert: {
          alim_fiyati?: string | null
          bakiye?: number | null
          barcode?: string | null
          created_at?: string | null
          departman?: string | null
          grup_kodu?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
          no?: number | null
          ozel_kod_3?: string | null
          satis_fiyati_tl?: string | null
          updated_at?: string | null
        }
        Update: {
          alim_fiyati?: string | null
          bakiye?: number | null
          barcode?: string | null
          created_at?: string | null
          departman?: string | null
          grup_kodu?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
          no?: number | null
          ozel_kod_3?: string | null
          satis_fiyati_tl?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: number | null
          category_id: string | null
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_tsvector: unknown
          price: number
          pro_alim_fiyati: number | null
          pro_departman: string | null
          pro_ozel_kod_3: string | null
          pro_satis_fiyati: number | null
          stock: number | null
          subcategory_id: string | null
          updated_at: string
          updated_via_barcode: boolean | null
        }
        Insert: {
          barcode?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_tsvector?: unknown
          price: number
          pro_alim_fiyati?: number | null
          pro_departman?: string | null
          pro_ozel_kod_3?: string | null
          pro_satis_fiyati?: number | null
          stock?: number | null
          subcategory_id?: string | null
          updated_at?: string
          updated_via_barcode?: boolean | null
        }
        Update: {
          barcode?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_tsvector?: unknown
          price?: number
          pro_alim_fiyati?: number | null
          pro_departman?: string | null
          pro_ozel_kod_3?: string | null
          pro_satis_fiyati?: number | null
          stock?: number | null
          subcategory_id?: string | null
          updated_at?: string
          updated_via_barcode?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_details: string | null
          aile_karti: string | null
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          location_lat: number | null
          location_lng: number | null
          phone: string | null
          push_token: string | null
          push_token_updated_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string | null
        }
        Insert: {
          address?: string | null
          address_details?: string | null
          aile_karti?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          address?: string | null
          address_details?: string | null
          aile_karti?: string | null
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          clicked_product_id: string | null
          clicked_product_name: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          language: string | null
          results_count: number | null
          search_term: string
          search_timestamp: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_product_id?: string | null
          clicked_product_name?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          language?: string | null
          results_count?: number | null
          search_term: string
          search_timestamp?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_product_id?: string | null
          clicked_product_name?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          language?: string | null
          results_count?: number | null
          search_term?: string
          search_timestamp?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_term_translations: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          term_en: string | null
          term_ru: string
          term_tr: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          term_en?: string | null
          term_ru: string
          term_tr: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          term_en?: string | null
          term_ru?: string
          term_tr?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stocks: {
        Row: {
          balance: number | null
          barcode: string | null
          buy_price: number | null
          category_id: string | null
          created_at: string | null
          department: number | null
          group_code: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          sell_price: number | null
          special_code: string | null
          stock_id: number
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          barcode?: string | null
          buy_price?: number | null
          category_id?: string | null
          created_at?: string | null
          department?: number | null
          group_code?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          sell_price?: number | null
          special_code?: string | null
          stock_id: number
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          barcode?: string | null
          buy_price?: number | null
          category_id?: string | null
          created_at?: string | null
          department?: number | null
          group_code?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          sell_price?: number | null
          special_code?: string | null
          stock_id?: number
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string | null
          slug_en: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug?: string | null
          slug_en?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string | null
          slug_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      subcategory_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          name: string
          slug: string | null
          subcategory_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          name: string
          slug?: string | null
          subcategory_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          slug?: string | null
          subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategory_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subcategory_translations_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "subcategory_translations_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_metadata: {
        Row: {
          last_sync: string
          sync_duration_ms: number | null
          sync_type: string | null
          table_name: string
          total_records: number | null
          updated_at: string | null
          updated_records: number | null
        }
        Insert: {
          last_sync: string
          sync_duration_ms?: number | null
          sync_type?: string | null
          table_name: string
          total_records?: number | null
          updated_at?: string | null
          updated_records?: number | null
        }
        Update: {
          last_sync?: string
          sync_duration_ms?: number | null
          sync_type?: string | null
          table_name?: string
          total_records?: number | null
          updated_at?: string | null
          updated_records?: number | null
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string
          description_en: string | null
          description_ru: string | null
          discount: number
          discount_type: string
          expiry_date: string
          id: string
          is_used: boolean | null
          max_discount: number | null
          min_amount: number
          rarity: string
          title: string
          title_en: string | null
          title_ru: string | null
          updated_at: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description: string
          description_en?: string | null
          description_ru?: string | null
          discount: number
          discount_type: string
          expiry_date: string
          id?: string
          is_used?: boolean | null
          max_discount?: number | null
          min_amount?: number
          rarity?: string
          title: string
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string
          description_en?: string | null
          description_ru?: string | null
          discount?: number
          discount_type?: string
          expiry_date?: string
          id?: string
          is_used?: boolean | null
          max_discount?: number | null
          min_amount?: number
          rarity?: string
          title?: string
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          birthday_offers: boolean | null
          coupon_expiry_reminders: boolean | null
          created_at: string | null
          delivery_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          loyalty_program_updates: boolean | null
          new_products: boolean | null
          order_confirmations: boolean | null
          order_status_updates: boolean | null
          promotional_offers: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
          weekly_deals: boolean | null
        }
        Insert: {
          birthday_offers?: boolean | null
          coupon_expiry_reminders?: boolean | null
          created_at?: string | null
          delivery_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          loyalty_program_updates?: boolean | null
          new_products?: boolean | null
          order_confirmations?: boolean | null
          order_status_updates?: boolean | null
          promotional_offers?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_deals?: boolean | null
        }
        Update: {
          birthday_offers?: boolean | null
          coupon_expiry_reminders?: boolean | null
          created_at?: string | null
          delivery_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          loyalty_program_updates?: boolean | null
          new_products?: boolean | null
          order_confirmations?: boolean | null
          order_status_updates?: boolean | null
          promotional_offers?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_deals?: boolean | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          achievements: string[] | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          last_order_date: string | null
          level: number | null
          points: number | null
          total_coupons_collected: number | null
          total_orders: number | null
          total_savings: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: string[] | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_order_date?: string | null
          level?: number | null
          points?: number | null
          total_coupons_collected?: number | null
          total_orders?: number | null
          total_savings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: string[] | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_order_date?: string | null
          level?: number | null
          points?: number | null
          total_coupons_collected?: number | null
          total_orders?: number | null
          total_savings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      yeni_update_jul24: {
        Row: {
          Ad: string | null
          "ALIM FİYATI": string | null
          Bakiye: string | null
          "Barkod 0": string | null
          Birim: string | null
          "COURTYARD DEPO Bakiye": string | null
          "ERENKOY DEPO Bakiye": string | null
          "Grup Kodu": string | null
          "Özel Kod 3": string | null
          "SATIŞ FİYATI TL": string | null
          Tip: string | null
        }
        Insert: {
          Ad?: string | null
          "ALIM FİYATI"?: string | null
          Bakiye?: string | null
          "Barkod 0"?: string | null
          Birim?: string | null
          "COURTYARD DEPO Bakiye"?: string | null
          "ERENKOY DEPO Bakiye"?: string | null
          "Grup Kodu"?: string | null
          "Özel Kod 3"?: string | null
          "SATIŞ FİYATI TL"?: string | null
          Tip?: string | null
        }
        Update: {
          Ad?: string | null
          "ALIM FİYATI"?: string | null
          Bakiye?: string | null
          "Barkod 0"?: string | null
          Birim?: string | null
          "COURTYARD DEPO Bakiye"?: string | null
          "ERENKOY DEPO Bakiye"?: string | null
          "Grup Kodu"?: string | null
          "Özel Kod 3"?: string | null
          "SATIŞ FİYATI TL"?: string | null
          Tip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      coupons: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          description_ru: string | null
          discount: number | null
          discount_type: string | null
          expiry_date: string | null
          id: string | null
          is_used: boolean | null
          max_discount: number | null
          min_amount: number | null
          rarity: string | null
          title: string | null
          title_en: string | null
          title_ru: string | null
          updated_at: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_ru?: string | null
          discount?: number | null
          discount_type?: string | null
          expiry_date?: string | null
          id?: string | null
          is_used?: boolean | null
          max_discount?: number | null
          min_amount?: number | null
          rarity?: string | null
          title?: string | null
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_ru?: string | null
          discount?: number | null
          discount_type?: string | null
          expiry_date?: string | null
          id?: string | null
          is_used?: boolean | null
          max_discount?: number | null
          min_amount?: number | null
          rarity?: string | null
          title?: string | null
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_budget_status: {
        Row: {
          current_month: string | null
          estimated_cost_this_month: number | null
          free_quota: number | null
          quota_usage_percent: number | null
          remaining_free_quota: number | null
          sent_this_month: number | null
        }
        Relationships: []
      }
      notification_stats: {
        Row: {
          failed_count: number | null
          last_notification_at: string | null
          pending_count: number | null
          read_count: number | null
          sent_count: number | null
          total_count: number | null
        }
        Relationships: []
      }
      products_with_categories: {
        Row: {
          category_description: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          image_url: string | null
          price: number | null
          product_active: boolean | null
          product_description: string | null
          product_id: string | null
          product_name: string | null
          stock: number | null
          subcategory_active: boolean | null
          subcategory_description: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      profiles_with_location: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          has_location: boolean | null
          id: string | null
          location_lat: number | null
          location_lng: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_location?: never
          id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_location?: never
          id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_access: { Args: never; Returns: boolean }
      check_and_create_milestone_coupons: {
        Args: { p_user_id: string }
        Returns: Json
      }
      create_secure_order: {
        Args: {
          p_coupon_code?: string
          p_delivery_fee_free?: boolean
          p_delivery_note?: string
          p_items: Json
          p_payment_method: string
          p_shipping_address: Json
          p_user_id: string
        }
        Returns: Json
      }
      create_secure_order_v2: {
        Args: {
          p_coupon_code?: string
          p_delivery_note?: string
          p_items: Json
          p_payment_method: string
          p_shipping_address: Json
          p_user_id: string
        }
        Returns: Json
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_notification_stats_monthly: {
        Args: never
        Returns: {
          estimated_cost: number
          month: string
          total_failed: number
          total_pending: number
          total_sent: number
        }[]
      }
      get_popular_search_terms: {
        Args: { lang: string; term_limit: number }
        Returns: {
          language: string
          search_count: number
          search_term: string
        }[]
      }
      get_search_insights: {
        Args: { days_back: number; lang: string }
        Returns: Json
      }
      get_unread_notification_count: { Args: never; Returns: number }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          action_type: string
          details?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { details?: Json; event_type: string; user_id?: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      translate_to_english: { Args: { turkish_name: string }; Returns: string }
      translate_to_russian: { Args: { turkish_name: string }; Returns: string }
      update_order_status: {
        Args: {
          p_new_status: string
          p_order_id: string
          p_updated_by?: string
        }
        Returns: Json
      }
      update_order_status_v2: {
        Args: { p_new_status: string; p_order_id: string; p_user_id?: string }
        Returns: Json
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      order_status: "pending" | "processing" | "delivered" | "cancelled"
      payment_method: "card" | "cash"
      user_role: "user" | "admin" | "courier" | "picker"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "processing", "delivered", "cancelled"],
      payment_method: ["card", "cash"],
      user_role: ["user", "admin", "courier"],
    },
  },
} as const
