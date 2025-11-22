// db.js - DÜZELTİLMİŞ SÜRÜM
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hifbpizbafgqoxtyaces.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmJwaXpiYWZncW94dHlhY2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3NjE5MCwiZXhwIjoyMDc5MjUyMTkwfQ._hPzUoc9t9jzf-AoHg31zLtNQzvTn9e7C-JUntlfdyA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getActiveFilters() {
  const { data, error } = await supabase
    .from('filters')
    .select(`
      id,
      user_id,
      city,
      category,
      min_price,
      max_price,
      keyword,
      is_active,
      users!inner (
        telegram_username
      )
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching filters:', error);
    return [];
  }

  // Her filtreye telegram_id ve url ekleyelim
  return data.map(f => ({
    id: f.id,
    user_id: f.user_id,
    telegram_id: f.users?.telegram_username || null,
    city: f.city,
    category: f.category || 'emlak',
    min_price: f.min_price || 0,
    max_price: f.max_price || '',
    keyword: f.keyword || '',
    url: `https://www.sahibinden.com/${f.category === 'otomobil' ? 'otomobil' : 'kiralik-daire'}?address_town=${f.city || ''}&price_min=${f.min_price || 0}&price_max=${f.max_price || ''}&query_text=${encodeURIComponent(f.keyword || '')}`
  }));
}

export async function isAdSeen(filterId, adId) {
  const { data } = await supabase
    .from('seen_ads')
    .select('id')
    .eq('filter_id', filterId)
    .eq('ad_id', adId)
    .single();
  return !!data;
}

export async function markAdSeen(filterId, adId) {
  await supabase
    .from('seen_ads')
    .insert({ filter_id: filterId, ad_id: adId })
    .catch(() => {});
}
