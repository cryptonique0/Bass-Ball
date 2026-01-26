import { usePrivy } from '@privy-io/react-auth';
import NetworkStatusPill from '@/components/NetworkStatusPill';
import { useEffect, useState } from 'react';

const NetworkStatusContainer: React.FC = () => {
  const { ready, user } = usePrivy();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [networkName, setNetworkName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ready) {
      setStatus('connecting');
      setNetworkName(undefined);
    } else if (user && user.wallet?.chainName) {
      setStatus('connected');
      setNetworkName(user.wallet.chainName);
    } else if (user) {
      setStatus('connected');
      setNetworkName('Unknown');
    } else {
      setStatus('disconnected');
      setNetworkName(undefined);
    }
  }, [ready, user]);

  return <NetworkStatusPill status={status} networkName={networkName} />;
};

export default NetworkStatusContainer;
