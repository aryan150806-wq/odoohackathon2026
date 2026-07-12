import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export function KPICard({ title, value, icon: Icon, colorClass }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{title}</div>
      </div>
    </div>
  );
}
