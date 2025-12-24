/**
 * Google Places Proxy Edge Function
 * Güvenli bir şekilde Google Places API'yi kullanmak için proxy
 * 
 * Endpoints:
 * - /autocomplete - Places Autocomplete
 * - /details - Place Details
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Maps API Key - Supabase Secrets'tan alınacak
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface AutocompleteRequest {
  input: string;
  location?: string;
  radius?: number;
  language?: string;
}

interface DetailsRequest {
  placeId: string;
  language?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // API Key kontrolü
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API Key not configured');
      return new Response(
        JSON.stringify({ 
          status: 'ERROR',
          error_message: 'Google Maps API Key not configured. Please set GOOGLE_MAPS_API_KEY secret.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const body = await req.json();
    
    // Autocomplete isteği (input parametresi varsa)
    if (body.input) {
      const autocompleteBody = body as AutocompleteRequest;
      
      if (!autocompleteBody.input || autocompleteBody.input.length < 2) {
        return new Response(
          JSON.stringify({ 
            status: 'INVALID_REQUEST',
            predictions: [] 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      console.log('🔍 Autocomplete request:', autocompleteBody.input);

      // Google Places Autocomplete API çağrısı
      const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      autocompleteUrl.searchParams.set('input', autocompleteBody.input);
      autocompleteUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      
      if (autocompleteBody.location) {
        autocompleteUrl.searchParams.set('location', autocompleteBody.location);
      }
      if (autocompleteBody.radius) {
        autocompleteUrl.searchParams.set('radius', autocompleteBody.radius.toString());
      }
      if (autocompleteBody.language) {
        autocompleteUrl.searchParams.set('language', autocompleteBody.language);
      }
      
      // Kıbrıs'a özel kısıtlama
      autocompleteUrl.searchParams.set('components', 'country:cy');

      const response = await fetch(autocompleteUrl.toString());
      const data = await response.json();

      console.log('✅ Autocomplete response:', data.status);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Place Details isteği (placeId parametresi varsa)
    if (body.placeId) {
      const detailsBody = body as DetailsRequest;

      console.log('🔍 Place Details request:', detailsBody.placeId);

      // Google Place Details API çağrısı
      const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      detailsUrl.searchParams.set('place_id', detailsBody.placeId);
      detailsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      detailsUrl.searchParams.set('fields', 'geometry,formatted_address,address_components');
      
      if (detailsBody.language) {
        detailsUrl.searchParams.set('language', detailsBody.language);
      }

      const response = await fetch(detailsUrl.toString());
      const data = await response.json();

      console.log('✅ Place Details response:', data.status);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Geçersiz istek
    return new Response(
      JSON.stringify({ 
        status: 'INVALID_REQUEST',
        error_message: 'Either input (for autocomplete) or placeId (for details) is required' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

