import React from 'react';
import { KPICard, Card } from '../components/ui/Card';
import { PackageCheck, ArrowRightLeft, Wrench, CalendarClock, ClockAlert, FileWarning } from 'lucide-react';
import { AssetStatusBadge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, System Admin. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/assets', { state: { openModal: true } })}>Register Asset</button>
          <button className="btn btn-primary" onClick={() => navigate('/bookings', { state: { openModal: true } })}>Book Resource</button>
        </div>
      </div>

      <div className="kpi-grid mb-6">
        <KPICard title="Assets Available" value="1,245" icon={PackageCheck} colorClass="green" />
        <KPICard title="Assets Allocated" value="842" icon={ArrowRightLeft} colorClass="blue" />
        <KPICard title="Maintenance Today" value="12" icon={Wrench} colorClass="orange" />
        <KPICard title="Active Bookings" value="34" icon={CalendarClock} colorClass="purple" />
      </div>

      <div className="grid-2">
        <Card title="Overdue Returns" subtitle="Allocations past their expected return date">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Assigned To</th>
                  <th>Expected Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>AF-0114</strong>
                    <div className="text-secondary text-xs">MacBook Pro 16"</div>
                  </td>
                  <td>Priya Sharma</td>
                  <td className="text-danger font-medium">2 days ago</td>
                  <td>
                    <button className="btn btn-sm btn-ghost">Remind</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="flex-col" style={{ gap: '1rem', display: 'flex' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-lg)', transition: 'var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="bento-icon" style={{ borderRadius: '50%' }}>
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>Asset Allocated</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Laptop AF-0220 assigned to Raj Kumar by Admin</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>2h ago</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
