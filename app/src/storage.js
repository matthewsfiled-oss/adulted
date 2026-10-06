import AsyncStorage from '@react-native-async-storage/async-storage';

// Everything the page saves (profile, checklist, finished guides) lives here,
// so it survives app updates and phone restarts.
const PREFIX = 'ad:';

export async function loadState() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    const out = {};
    for (const [k, v] of pairs) { try { if (v != null) out[k.slice(PREFIX.length)] = JSON.parse(v); } catch { /* skip a damaged value */ } }
    return out;
  } catch {
    return {};
  }
}

export async function saveKey(key, value) {
  if (typeof key !== 'string' || !/^[a-z][a-z0-9_-]{0,30}$/i.test(key)) return;
  try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
}
