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
          <div className="flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center p-3 rounded-lg hover:bg-surface-hover transition-fast">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium">Asset Allocated</div>
                  <div className="text-xs text-secondary">Laptop AF-0220 assigned to Raj Kumar by Admin</div>
                </div>
                <div className="ml-auto text-xs text-tertiary">2h ago</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
