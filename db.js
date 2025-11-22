import { createClient } from '@supabase/supabase-js';

// Supabase Credentials (provided by user)
const SUPABASE_URL = 'https://hifbpizbafgqoxtyaces.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmJwaXpiYWZncW94dHlhY2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3NjE5MCwiZXhwIjoyMDc5MjUyMTkwfQ._hPzUoc9t9jzf-AoHg31zLtNQzvTn9e7C-JUntlfdyA';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fetch active filters from the database
 */
export async function getActiveFilters() {
  const { data, error } = await supabase
    .from('filters')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching filters:', error);
    return [];
  }
  return data;
}

/**
 * Check if an ad has already been processed for a specific filter
 * @param {number} filterId 
 * @param {string} adId 
 */
export async function isAdSeen(filterId, adId) {
  const { data, error } = await supabase
    .from('seen_ads')
    .select('id')
    .eq('filter_id', filterId)
    .eq('ad_id', adId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error checking seen ads:', error);
  }

  return !!data;
}

/**
 * Mark an ad as seen in the database
 * @param {number} filterId 
 * @param {string} adId 
 */
export async function markAdSeen(filterId, adId) {
  const { error } = await supabase
    .from('seen_ads')
    .insert([{ filter_id: filterId, ad_id: adId }]);

  if (error) {
    console.error('Error inserting seen ad:', error);
  }
}
