import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ArrowRightLeft, Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';

export function Allocations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConflict, setShowConflict] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlloc, setNewAlloc] = useState({ assetId: '', userId: '', expectedReturnDate: '' });
  
  const queryClient = useQueryClient();

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['allocations'],
    queryFn: async () => {
      const res = await apiClient.get('/allocations');
      return res.data;
    }
  });

  const createAllocation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/allocations', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      setIsModalOpen(false);
      setShowConflict(false);
      setNewAlloc({ assetId: '', userId: '', expectedReturnDate: '' });
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        setShowConflict(true);
        setConflictMsg(err.response.data.message);
      }
    }
  });

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    createAllocation.mutate(newAlloc);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Allocations & Transfers</h1>
          <p className="page-subtitle">Assign assets to employees and manage transfer requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          New Allocation
        </button>
      </div>

      {showConflict && (
        <div className="mb-6 animate-fade-in">
          <Alert 
            type="danger" 
            title="Allocation Conflict Detected"
            message={conflictMsg || "This asset is already allocated."}
            action={
              <button className="btn btn-sm btn-secondary mt-2 border-danger-200 hover:bg-danger-50">
                Submit Transfer Request
              </button>
            }
          />
        </div>
      )}

      <Card className="mb-6 p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Search by Asset Tag or Employee Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>
      </Card>

      <Card title="Active Allocations">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Allocated To</th>
                <th>Department</th>
                <th>Allocated Date</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-secondary">Loading allocations...</td></tr>
              ) : allocations?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-secondary">No active allocations.</td></tr>
              ) : (
                allocations?.map((alloc: any) => {
                  const isOverdue = alloc.expectedReturnDate && new Date(alloc.expectedReturnDate) < new Date();
                  return (
                    <tr key={alloc.id} className={isOverdue ? 'bg-danger-50/30' : ''}>
                      <td>
                        <div className="font-medium">{alloc.asset?.assetTag}</div>
                        <div className="text-xs text-secondary">{alloc.asset?.name}</div>
                      </td>
                      <td>{alloc.user?.name}</td>
                      <td>{alloc.user?.department?.name || '—'}</td>
                      <td>{new Date(alloc.allocatedAt).toLocaleDateString()}</td>
                      <td>
                        {isOverdue ? (
                          <span className="flex items-center text-danger font-medium">
                            <AlertTriangle size={14} className="mr-1" />
                            {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                          </span>
                        ) : (
                          alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : '—'
                        )}
                      </td>
                      <td>
                        <Badge variant={isOverdue ? 'danger' : 'success'}>
                          {isOverdue ? 'OVERDUE' : alloc.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-ghost text-primary">Return</button>
                          <button className="btn btn-sm btn-ghost text-secondary">Transfer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Allocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">New Allocation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleAllocate} className="p-6 space-y-4">
              <div>
                <label className="form-label">Asset ID (UUID)</label>
                <input required type="text" className="form-input" value={newAlloc.assetId} onChange={e => setNewAlloc({...newAlloc, assetId: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Employee ID (UUID)</label>
                <input required type="text" className="form-input" value={newAlloc.userId} onChange={e => setNewAlloc({...newAlloc, userId: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Expected Return Date</label>
                <input type="date" className="form-input" value={newAlloc.expectedReturnDate} onChange={e => setNewAlloc({...newAlloc, expectedReturnDate: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createAllocation.isPending}>
                  {createAllocation.isPending ? 'Allocating...' : 'Allocate Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
