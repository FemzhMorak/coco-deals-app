import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../constants/colors';
import { PAYWALL_FREE_OPENS_THRESHOLD, PAYWALL_REPEAT_INTERVAL } from '../constants/config';
import * as api from '../services/api';
import { storage } from '../services/storage';
import { uuidv4 } from '../utils/uuid';

const UserContext = createContext(null);

const ALL_CATEGORY_KEYS = CATEGORIES.map((c) => c.key).filter((k) => k !== 'all' && k !== 'more');

export function UserProvider({ children }) {
  const [savedDealIds, setSavedDealIds] = useState([]);
  const [followedCategories, setFollowedCategories] = useState(ALL_CATEGORY_KEYS);
  const [notificationPrefs, setNotificationPrefs] = useState(
    Object.fromEntries(ALL_CATEGORY_KEYS.map((k) => [k, true]))
  );
  const [dealOpens, setDealOpens] = useState(0);
  const [dealHistory, setDealHistory] = useState([]); // { dealId, category, brand, price, action, at }
  const [isPro, setIsPro] = useState(false);
  const [profile, setProfile] = useState(null); // { displayName, handle, uuid } | null
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [saved, followed, prefs, opens, history, pro, storedProfile] = await Promise.all([
        storage.getJSON(storage.KEYS.SAVED_DEALS, []),
        storage.getJSON(storage.KEYS.FOLLOWED_CATEGORIES, ALL_CATEGORY_KEYS),
        storage.getJSON(
          storage.KEYS.NOTIFICATION_PREFS,
          Object.fromEntries(ALL_CATEGORY_KEYS.map((k) => [k, true]))
        ),
        storage.getJSON(storage.KEYS.DEAL_OPENS, 0),
        storage.getJSON(storage.KEYS.DEAL_HISTORY, []),
        storage.getJSON(storage.KEYS.IS_PRO, false),
        storage.getJSON(storage.KEYS.PROFILE, null),
      ]);
      setSavedDealIds(saved);
      setFollowedCategories(followed);
      setNotificationPrefs(prefs);
      setDealOpens(opens);
      setDealHistory(history);
      setIsPro(pro);
      setProfile(storedProfile);
      setHydrated(true);
    })();
  }, []);

  const toggleSaved = useCallback((dealId) => {
    setSavedDealIds((cur) => {
      const next = cur.includes(dealId) ? cur.filter((id) => id !== dealId) : [...cur, dealId];
      storage.setJSON(storage.KEYS.SAVED_DEALS, next);
      return next;
    });
  }, []);

  const toggleFollowedCategory = useCallback((key) => {
    setFollowedCategories((cur) => {
      const next = cur.includes(key) ? cur.filter((c) => c !== key) : [...cur, key];
      storage.setJSON(storage.KEYS.FOLLOWED_CATEGORIES, next);
      return next;
    });
  }, []);

  const toggleNotificationPref = useCallback((key) => {
    setNotificationPrefs((cur) => {
      const next = { ...cur, [key]: !cur[key] };
      storage.setJSON(storage.KEYS.NOTIFICATION_PREFS, next);
      return next;
    });
  }, []);

  // Returns true if the paywall should be shown after this open.
  const recordDealOpen = useCallback(
    (deal, action = 'open') => {
      let shouldShowPaywall = false;
      setDealOpens((cur) => {
        const next = cur + 1;
        storage.setJSON(storage.KEYS.DEAL_OPENS, next);
        if (!isPro) {
          if (next === PAYWALL_FREE_OPENS_THRESHOLD) shouldShowPaywall = true;
          else if (
            next > PAYWALL_FREE_OPENS_THRESHOLD &&
            (next - PAYWALL_FREE_OPENS_THRESHOLD) % PAYWALL_REPEAT_INTERVAL === 0
          ) {
            shouldShowPaywall = true;
          }
        }
        return next;
      });
      setDealHistory((cur) => {
        const next = [
          {
            dealId: deal.id,
            category: deal.category,
            brand: deal.brand,
            price: deal.dealPrice,
            action,
            at: new Date().toISOString(),
          },
          ...cur,
        ].slice(0, 200);
        storage.setJSON(storage.KEYS.DEAL_HISTORY, next);
        return next;
      });
      return shouldShowPaywall;
    },
    [isPro]
  );

  const upgradeToPro = useCallback(() => {
    setIsPro(true);
    storage.setJSON(storage.KEYS.IS_PRO, true);
  }, []);

  // Handle = first name, lowercased, + a hyphen + the first 8 characters of
  // a locally-generated UUID v4 (e.g. "olorunfemi-a3f9b2c1"). The full UUID
  // is kept separately as the member id.
  const createProfile = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const firstName = trimmed.split(/\s+/)[0].toLowerCase();
    const id = uuidv4();
    const newProfile = {
      displayName: trimmed,
      handle: `${firstName}-${id.slice(0, 8)}`,
      uuid: id,
    };
    setProfile(newProfile);
    storage.setJSON(storage.KEYS.PROFILE, newProfile);
    return newProfile;
  }, []);

  // Behaviour-derived preference profile: favourite categories/brands and
  // average price point, built purely from local interaction history.
  const preferenceProfile = useMemo(() => {
    const categoryCounts = {};
    const brandCounts = {};
    let priceSum = 0;
    let priceCount = 0;

    for (const entry of dealHistory) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
      brandCounts[entry.brand] = (brandCounts[entry.brand] || 0) + 1;
      if (typeof entry.price === 'number') {
        priceSum += entry.price;
        priceCount += 1;
      }
    }

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    return {
      topCategories,
      topBrands,
      averagePricePoint: priceCount ? Math.round(priceSum / priceCount) : null,
      daysOfData: dealHistory.length
        ? Math.floor((Date.now() - new Date(dealHistory[dealHistory.length - 1].at).getTime()) / 86400000)
        : 0,
      isFullyPersonalized:
        dealHistory.length > 0 &&
        Math.floor((Date.now() - new Date(dealHistory[dealHistory.length - 1].at).getTime()) / 86400000) >= 30,
    };
  }, [dealHistory]);

  useEffect(() => {
    if (hydrated) api.savePreferences({ followedCategories, notificationPrefs, preferenceProfile });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, followedCategories]);

  const value = useMemo(
    () => ({
      hydrated,
      savedDealIds,
      followedCategories,
      notificationPrefs,
      dealOpens,
      dealHistory,
      isPro,
      profile,
      preferenceProfile,
      toggleSaved,
      isSaved: (id) => savedDealIds.includes(id),
      toggleFollowedCategory,
      toggleNotificationPref,
      recordDealOpen,
      upgradeToPro,
      createProfile,
    }),
    [
      hydrated,
      savedDealIds,
      followedCategories,
      notificationPrefs,
      dealOpens,
      dealHistory,
      isPro,
      profile,
      preferenceProfile,
      toggleSaved,
      toggleFollowedCategory,
      toggleNotificationPref,
      recordDealOpen,
      upgradeToPro,
      createProfile,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
