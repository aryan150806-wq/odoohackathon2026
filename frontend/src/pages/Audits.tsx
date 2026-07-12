import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const MOCK_AUDITS = [
  {
    id: '1',
    name: 'Q3 IT Equipment Audit',
    scope: 'Department: IT',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    status: 'IN_PROGRESS',
    progress: 75,
    items: 42,
    verified: 30,
    missing: 2,
    damaged: 0
  },
  {
    id: '2',
    name: 'HQ Furniture Audit',
    scope: 'Location: New York HQ',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'COMPLETED',
    progress: 100,
    items: 120,
    verified: 115,
    missing: 3,
    damaged: 2
  }
];

export function Audits() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Audits</h1>
          <p className="page-subtitle">Manage physical verifications and compliance cycles.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} className="mr-2" />
          Create Audit Cycle
        </button>
      </div>

      <div className="flex-col gap-6">
        {MOCK_AUDITS.map(audit => (
          <Card key={audit.id} className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-hover flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{audit.name}</h3>
                  <Badge variant={audit.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {audit.status}
                  </Badge>
                </div>
                <div className="text-sm text-secondary flex items-center gap-4">
                  <span>{audit.scope}</span>
                  <span>|</span>
                  <span>{audit.startDate} to {audit.endDate}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium mb-1">{audit.progress}% Complete</div>
                <div className="w-48 bg-border h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${audit.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`} 
                    style={{ width: `${audit.progress}%` }} 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg border border-border">
                <div className="text-3xl font-bold text-tertiary mb-1">{audit.items}</div>
                <div className="text-xs text-secondary font-medium uppercase">Total Items</div>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-success-50/30 border-success-200">
                <div className="text-3xl font-bold text-success mb-1">{audit.verified}</div>
                <div className="text-xs text-success font-medium uppercase flex items-center justify-center">
                  <CheckCircle2 size={14} className="mr-1" /> Verified
                </div>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-danger-50/30 border-danger-200">
                <div className="text-3xl font-bold text-danger mb-1">{audit.missing}</div>
                <div className="text-xs text-danger font-medium uppercase flex items-center justify-center">
                  <XCircle size={14} className="mr-1" /> Missing
                </div>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-warning-50/30 border-warning-200">
                <div className="text-3xl font-bold text-warning-600 mb-1">{audit.damaged}</div>
                <div className="text-xs text-warning-600 font-medium uppercase flex items-center justify-center">
                  <AlertTriangle size={14} className="mr-1" /> Damaged
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-surface-hover border-t border-border flex justify-end gap-3">
              <button className="btn btn-secondary">View Discrepancy Report</button>
              {audit.status === 'IN_PROGRESS' && (
                <button className="btn btn-primary">Resume Audit</button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
