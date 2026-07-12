import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'default';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function AssetStatusBadge({ status }: { status: string }) {
  const getStatusClass = (s: string) => {
    switch (s) {
      case 'AVAILABLE': return 'available';
      case 'ALLOCATED': return 'allocated';
      case 'RESERVED': return 'reserved';
      case 'UNDER_MAINTENANCE': return 'under-maintenance';
      case 'LOST': return 'lost';
      case 'RETIRED': return 'retired';
      case 'DISPOSED': return 'disposed';
      default: return 'default';
    }
  };

  return (
    <span className={`badge badge-${getStatusClass(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
