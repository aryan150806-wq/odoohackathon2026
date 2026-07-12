import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlertCircle, CalendarCheck, Package, Download } from 'lucide-react';

const MOCK_ACTIVITY = [
  { id: '1', action: 'ASSET_CREATED', details: 'Added new MacBook Pro 16" (AF-0114)', user: 'Dave Tech', time: '10 mins ago', type: 'asset' },
  { id: '2', action: 'ROLE_PROMOTED', details: 'Raj Kumar promoted to DEPARTMENT_HEAD', user: 'System Admin', time: '2 hours ago', type: 'user' },
  { id: '3', action: 'ALLOCATION_MADE', details: 'Allocated AF-0114 to Priya Sharma', user: 'Dave Tech', time: 'Yesterday', type: 'asset' },
  { id: '4', action: 'BOOKING_CANCELLED', details: 'Cancelled Conference Room B2', user: 'Raj Kumar', time: 'Yesterday', type: 'booking' },
];

export function ActivityLog() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Activity Log</h1>
          <p className="page-subtitle">Append-only audit trail of all system actions and security events.</p>
        </div>
        <button className="btn btn-secondary">
          <Download size={18} className="mr-2" />
          Export Log
        </button>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex gap-2">
          <button className="btn btn-sm btn-secondary bg-surface border-border">All Events</button>
          <button className="btn btn-sm btn-ghost">Asset Changes</button>
          <button className="btn btn-sm btn-ghost">Security & Access</button>
          <button className="btn btn-sm btn-ghost">Allocations & Bookings</button>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Details</th>
                <th>Performed By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVITY.map(log => (
                <tr key={log.id}>
                  <td>
                    <Badge variant={log.type === 'user' ? 'danger' : log.type === 'booking' ? 'info' : 'success'}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="font-medium text-sm">{log.details}</td>
                  <td className="text-secondary">{log.user}</td>
                  <td className="text-secondary text-sm">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-secondary">
          <div>Showing 4 of 48,219 events</div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-secondary" disabled>Previous</button>
            <button className="btn btn-sm btn-secondary">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
