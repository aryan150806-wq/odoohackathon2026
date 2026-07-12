import React from 'react';

interface AlertProps {
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function Alert({ type, title, message, action }: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <div className="flex-1">
        <strong>{title}</strong>
        {message && <div className="mt-1">{message}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
