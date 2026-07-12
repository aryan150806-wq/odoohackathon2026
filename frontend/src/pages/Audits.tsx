import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export function Audits() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAudit, setNewAudit] = useState({ 
    name: '', 
    scopeType: 'DEPARTMENT', 
    departmentId: '', 
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const { data: audits, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/audits/cycles');
      return res.data.data || res.data; // Handle pagination envelope if present
    }
  });

  const createAudit = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/audits/cycles', {
        ...data,
        auditorIds: [user?.id] // Assign the current user as the auditor by default
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setIsModalOpen(false);
      setNewAudit({ ...newAudit, name: '', departmentId: '', location: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error creating audit cycle');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAudit.mutate(newAudit);
  };

  const calculateProgress = (audit: any) => {
    if (!audit.items || audit.items.length === 0) return 0;
    const verifiedCount = audit.items.filter((i: any) => i.status !== 'PENDING').length;
    return Math.round((verifiedCount / audit.items.length) * 100);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Audits</h1>
          <p className="page-subtitle">Manage physical verifications and compliance cycles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Create Audit Cycle
        </button>
      </div>

      <div className="flex-col gap-6">
        {isLoading && <div className="text-secondary p-4">Loading audit cycles...</div>}
        {audits?.length === 0 && <div className="text-secondary p-4">No audit cycles found. Create one!</div>}
        {audits?.map((audit: any) => {
          const progress = calculateProgress(audit);
          const totalItems = audit._count?.items || audit.items?.length || 0;
          
          return (
            <Card key={audit.id} className="p-0 overflow-hidden mb-6">
              <div className="p-4 border-b border-border bg-surface-hover flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{audit.name}</h3>
                    <Badge variant={audit.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {audit.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-secondary flex items-center gap-4">
                    <span>{audit.scopeType === 'DEPARTMENT' ? `Department ID: ${audit.departmentId}` : `Location: ${audit.location}`}</span>
                    <span>|</span>
                    <span>{new Date(audit.startDate).toLocaleDateString()} to {new Date(audit.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium mb-1">{progress}% Complete</div>
                  <div className="w-48 bg-border h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${audit.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg border border-border">
                  <div className="text-3xl font-bold text-tertiary mb-1">{totalItems}</div>
                  <div className="text-xs text-secondary font-medium uppercase">Total Items</div>
                </div>
                <div className="text-center p-3 rounded-lg border border-border bg-success-50/30 border-success-200">
                  <div className="text-3xl font-bold text-success mb-1">?</div>
                  <div className="text-xs text-success font-medium uppercase flex items-center justify-center">
                    <CheckCircle2 size={14} className="mr-1" /> Verified
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border border-border bg-danger-50/30 border-danger-200">
                  <div className="text-3xl font-bold text-danger mb-1">?</div>
                  <div className="text-xs text-danger font-medium uppercase flex items-center justify-center">
                    <XCircle size={14} className="mr-1" /> Missing
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border border-border bg-warning-50/30 border-warning-200">
                  <div className="text-3xl font-bold text-warning-600 mb-1">?</div>
                  <div className="text-xs text-warning-600 font-medium uppercase flex items-center justify-center">
                    <AlertTriangle size={14} className="mr-1" /> Damaged
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-surface-hover border-t border-border flex justify-end gap-3">
                <button className="btn btn-secondary">View Discrepancy Report</button>
                {audit.status !== 'COMPLETED' && (
                  <button className="btn btn-primary" onClick={() => alert('The Audit Execution interface is accessed via the AssetFlow Mobile App for barcode scanning.')}>
                    Resume Audit
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create Audit Cycle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="form-label">Audit Name</label>
                <input required type="text" className="form-input" value={newAudit.name} onChange={e => setNewAudit({...newAudit, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Scope</label>
                  <select className="form-input" value={newAudit.scopeType} onChange={e => setNewAudit({...newAudit, scopeType: e.target.value as any})}>
                    <option value="DEPARTMENT">Department</option>
                    <option value="LOCATION">Location</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{newAudit.scopeType === 'DEPARTMENT' ? 'Department ID' : 'Location Name'}</label>
                  {newAudit.scopeType === 'DEPARTMENT' ? (
                    <input type="text" className="form-input" placeholder="UUID" value={newAudit.departmentId} onChange={e => setNewAudit({...newAudit, departmentId: e.target.value})} />
                  ) : (
                    <input type="text" className="form-input" value={newAudit.location} onChange={e => setNewAudit({...newAudit, location: e.target.value})} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date</label>
                  <input required type="date" className="form-input" value={newAudit.startDate} onChange={e => setNewAudit({...newAudit, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input required type="date" className="form-input" value={newAudit.endDate} onChange={e => setNewAudit({...newAudit, endDate: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createAudit.isPending}>
                  {createAudit.isPending ? 'Creating...' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
