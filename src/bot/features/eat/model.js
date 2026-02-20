/**
 * Restaurant Model - Guild-based (group shared)
 */

const { getSupabase } = require('../../../database/supabase');

const TABLE_NAME = 'restaurants';

async function createRestaurant(data) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data: restaurant, error } = await supabase
        .from(TABLE_NAME)
        .insert({
            user_id: data.userId,
            guild_id: data.guildId,
            name: data.name,
            cuisine_type: data.cuisineType,
            location: data.location,
            price_range: data.priceRange,
            rating: data.rating,
            notes: data.notes,
            is_favorite: data.isFavorite ?? true,
        })
        .select()
        .single();

    if (error) throw error;
    return restaurant;
}

async function getRestaurantsByGuild(guildId, options = {}) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('guild_id', guildId);

    if (options.isFavorite !== undefined) {
        query = query.eq('is_favorite', options.isFavorite);
    }

    if (options.cuisineType) {
        query = query.eq('cuisine_type', options.cuisineType);
    }

    if (options.priceRange) {
        query = query.eq('price_range', options.priceRange);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getRandomRestaurant(guildId, options = {}) {
    const restaurants = await getRestaurantsByGuild(guildId, { 
        isFavorite: true,
        ...options 
    });
    
    if (restaurants.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * restaurants.length);
    return restaurants[randomIndex];
}

async function getCuisineTypes(guildId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('cuisine_type')
        .eq('guild_id', guildId)
        .not('cuisine_type', 'is', null);

    if (error) throw error;
    const types = [...new Set(data.map(r => r.cuisine_type))];
    return types;
}

async function updateRestaurant(id, updates) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function deleteRestaurant(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

async function getRestaurantById(id, guildId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('guild_id', guildId)
        .filter('id', 'ilike', `${id}%`)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

module.exports = {
    createRestaurant,
    getRestaurantsByGuild,
    getRandomRestaurant,
    getCuisineTypes,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantById,
};
