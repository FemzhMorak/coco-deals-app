import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { usePaywall } from '../context/PaywallContext';
import { useUser } from '../context/UserContext';

export function useGrabDeal() {
  const { recordDealOpen } = useUser();
  const { show } = usePaywall();

  return useCallback(
    (deal) => {
      const shouldShowPaywall = recordDealOpen(deal, 'grab');

      if (deal.dealUrl) {
        Linking.openURL(deal.dealUrl).catch(() => {
          Alert.alert('Couldn\'t open link', `We weren't able to open ${deal.brand}'s website. Please try again.`);
        });
      }

      if (shouldShowPaywall) setTimeout(show, 350);
    },
    [recordDealOpen, show]
  );
}
