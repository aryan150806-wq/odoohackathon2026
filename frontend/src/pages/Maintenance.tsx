import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Wrench, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const MOCK_TICKETS = {
  PENDING: [],
  APPROVED: [],
  TECHNICIAN_ASSIGNED: [],
  IN_PROGRESS: [],
  RESOLVED: []
};

export function Maintenance() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ assetId: '', description: '', priority: 'MEDIUM' });
  const queryClient = useQueryClient();

  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/maintenance', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsModalOpen(false);
      setNewRequest({ assetId: '', description: '', priority: 'MEDIUM' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error raising request');
    }
  });

  const handleRaiseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest.mutate(newRequest);
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">Track repairs, servicing, and technical support requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Raise Request
        </button>
      </div>

      <div className="kanban-board flex-1 flex gap-4 overflow-x-auto pb-4">
        {/* PENDING COLUMN */}
        <div className="kanban-column flex-1 min-w-[280px]">
          <div className="kanban-header flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm uppercase text-secondary">Pending</h3>
            <Badge>{MOCK_TICKETS.PENDING.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TICKETS.PENDING.map(t => (
              <Card key={t.id} className="p-3 cursor-grab hover:shadow-md transition-shadow border-l-4 border-warning-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-tertiary">{t.asset}</span>
                  <Badge variant={t.priority === 'HIGH' ? 'danger' : 'warning'}>{t.priority}</Badge>
                </div>
                <div className="font-medium text-sm mb-3">{t.title}</div>
                <div className="flex justify-between items-center text-xs text-secondary">
                  <span className="flex items-center"><Clock size={12} className="mr-1"/> {t.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* APPROVED COLUMN */}
        <div className="kanban-column flex-1 min-w-[280px]">
          <div className="kanban-header flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm uppercase text-secondary">Approved</h3>
            <Badge>{MOCK_TICKETS.APPROVED.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TICKETS.APPROVED.length === 0 && (
              <div className="text-center p-4 border border-dashed border-border rounded-lg text-tertiary text-sm">
                No tickets in this stage
              </div>
            )}
          </div>
        </div>

        {/* TECHNICIAN ASSIGNED COLUMN */}
        <div className="kanban-column flex-1 min-w-[280px]">
          <div className="kanban-header flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm uppercase text-secondary">Tech Assigned</h3>
            <Badge>{MOCK_TICKETS.TECHNICIAN_ASSIGNED.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TICKETS.TECHNICIAN_ASSIGNED.map(t => (
              <Card key={t.id} className="p-3 cursor-grab hover:shadow-md transition-shadow border-l-4 border-info-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-tertiary">{t.asset}</span>
                  <Badge variant="info">{t.priority}</Badge>
                </div>
                <div className="font-medium text-sm mb-3">{t.title}</div>
                <div className="flex justify-between items-center text-xs text-secondary">
                  <span className="flex items-center text-primary-600 font-medium">{t.tech}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="kanban-column flex-1 min-w-[280px]">
          <div className="kanban-header flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm uppercase text-secondary">In Progress</h3>
            <Badge>{MOCK_TICKETS.IN_PROGRESS.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TICKETS.IN_PROGRESS.map(t => (
              <Card key={t.id} className="p-3 cursor-grab hover:shadow-md transition-shadow border-l-4 border-primary-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-tertiary">{t.asset}</span>
                  <Badge variant="default">{t.priority}</Badge>
                </div>
                <div className="font-medium text-sm mb-3">{t.title}</div>
                <div className="flex justify-between items-center text-xs text-secondary">
                  <span className="flex items-center text-primary-600 font-medium">{t.tech}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* RESOLVED COLUMN */}
        <div className="kanban-column flex-1 min-w-[280px]">
          <div className="kanban-header flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm uppercase text-secondary">Resolved</h3>
            <Badge variant="success">{MOCK_TICKETS.RESOLVED.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TICKETS.RESOLVED.map(t => (
              <Card key={t.id} className="p-3 opacity-60 border-l-4 border-success-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-tertiary">{t.asset}</span>
                  <CheckCircle2 size={16} className="text-success-600" />
                </div>
                <div className="font-medium text-sm mb-3 line-through text-secondary">{t.title}</div>
                <div className="flex justify-between items-center text-xs text-secondary">
                  <span>{t.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Raise Maintenance Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleRaiseRequest} className="p-6 space-y-4">
              <div>
                <label className="form-label">Asset ID (UUID)</label>
                <input required type="text" className="form-input" placeholder="Needs valid asset UUID" value={newRequest.assetId} onChange={e => setNewRequest({...newRequest, assetId: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Description of Issue</label>
                <textarea required className="form-input" rows={3} value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="form-input" value={newRequest.priority} onChange={e => setNewRequest({...newRequest, priority: e.target.value})}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createRequest.isPending}>
                  {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
