import { Preferences } from '@capacitor/preferences';

const CACHE_PREFIX = 'leva_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

export const cacheService = {
  async set(key, data) {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    await Preferences.set({
      key: CACHE_PREFIX + key,
      value: JSON.stringify(cacheData)
    });
  },

  async get(key) {
    const { value } = await Preferences.get({ key: CACHE_PREFIX + key });
    if (!value) return null;

    const cacheData = JSON.parse(value);
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
      await Preferences.remove({ key: CACHE_PREFIX + key });
      return null;
    }
    return cacheData.data;
  },

  async clear() {
    const { keys } = await Preferences.keys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    for (const key of cacheKeys) {
      await Preferences.remove({ key });
    }
  }
}; 