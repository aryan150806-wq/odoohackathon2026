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
  // Wibify bento card style using vanilla CSS classes defined in index.css
  return (
    <div className="card bento-card">
      <div className="bento-card-top">
        <div className="bento-icon">
          <Icon size={20} />
        </div>
        <div className="bento-number">
          {/* Static index could go here if needed, e.g. 01 */}
        </div>
      </div>
      
      <div>
        <div className="bento-value">{value}</div>
        <div className="bento-label">{title}</div>
      </div>

      <div className="bento-arrow">
        →
      </div>
    </div>
  );
}
