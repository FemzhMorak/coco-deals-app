import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { storage } from '../services/storage';

const DealsContext = createContext(null);

export function DealsProvider({ children }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [votes, setVotes] = useState({}); // dealId -> 'up' | 'down'
  const [verifications, setVerifications] = useState({}); // dealId -> 'still_works' | 'expired'

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await api.fetchDeals();
      setDeals(data.filter((d) => (d.expiredCount ?? 0) < 3));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [v, ver] = await Promise.all([
        storage.getJSON(storage.KEYS.VOTES, {}),
        storage.getJSON(storage.KEYS.VERIFICATIONS, {}),
      ]);
      setVotes(v);
      setVerifications(ver);
    })();
    load();
  }, [load]);

  const applyVote = useCallback(
    async (id, direction) => {
      const prev = votes[id];
      if (prev === direction) return; // already voted this way

      setDeals((cur) =>
        cur.map((d) => {
          if (d.id !== id) return d;
          const next = { ...d };
          if (prev === 'up') next.upvotes = Math.max(0, next.upvotes - 1);
          if (prev === 'down') next.downvotes = Math.max(0, next.downvotes - 1);
          if (direction === 'up') next.upvotes += 1;
          else next.downvotes += 1;
          return next;
        })
      );
      const nextVotes = { ...votes, [id]: direction };
      setVotes(nextVotes);
      storage.setJSON(storage.KEYS.VOTES, nextVotes);

      if (direction === 'up') api.upvoteDeal(id);
      else api.downvoteDeal(id);
    },
    [votes]
  );

  const applyVerification = useCallback(
    async (id, status) => {
      if (verifications[id] === status) return;

      setDeals((cur) =>
        cur
          .map((d) => {
            if (d.id !== id) return d;
            const next = { ...d };
            const prevStatus = verifications[id];
            if (prevStatus === 'still_works') next.stillWorksCount = Math.max(0, next.stillWorksCount - 1);
            if (prevStatus === 'expired') next.expiredCount = Math.max(0, next.expiredCount - 1);
            if (status === 'still_works') next.stillWorksCount += 1;
            else next.expiredCount += 1;
            next.isVerified = next.stillWorksCount >= 10 ? true : next.isVerified;
            return next;
          })
          .filter((d) => d.expiredCount < 3)
      );
      const nextVer = { ...verifications, [id]: status };
      setVerifications(nextVer);
      storage.setJSON(storage.KEYS.VERIFICATIONS, nextVer);

      api.verifyDeal(id, status);
    },
    [verifications]
  );

  const getDeal = useCallback((id) => deals.find((d) => d.id === id), [deals]);

  const value = useMemo(
    () => ({
      deals,
      loading,
      refreshing,
      votes,
      verifications,
      refresh: () => load(true),
      reload: () => load(false),
      upvote: (id) => applyVote(id, 'up'),
      downvote: (id) => applyVote(id, 'down'),
      markStillWorks: (id) => applyVerification(id, 'still_works'),
      markExpired: (id) => applyVerification(id, 'expired'),
      getDeal,
    }),
    [deals, loading, refreshing, votes, verifications, load, applyVote, applyVerification, getDeal]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error('useDeals must be used within DealsProvider');
  return ctx;
}
