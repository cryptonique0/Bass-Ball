import React from 'react';

interface NetworkStatusPillProps {
  status: 'connected' | 'disconnected' | 'connecting';
  networkName?: string;
}

const statusColors = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  connecting: 'bg-yellow-400',
};

const statusLabels = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
};

const NetworkStatusPill: React.FC<NetworkStatusPillProps> = ({ status, networkName }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[status]}`}
    title={networkName ? `${statusLabels[status]} to ${networkName}` : statusLabels[status]}
  >
    <span className="w-2 h-2 mr-2 rounded-full bg-white/70 animate-pulse" />
    {statusLabels[status]}
    {networkName ? `: ${networkName}` : ''}
  </span>
);

export default NetworkStatusPill;
