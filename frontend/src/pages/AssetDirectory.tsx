import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { AssetStatusBadge, Badge } from '../components/ui/Badge';
import { Search, Filter, Plus, FileDown, MoreVertical } from 'lucide-react';
import { apiClient } from '../api/client';

export function AssetDirectory() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', categoryId: '', departmentId: '', acquisitionDate: new Date().toISOString().split('T')[0] });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title, location.pathname + location.search);
    }
  }, [location.state]);

  useEffect(() => {
    const term = searchParams.get('search');
    if (term !== null) {
      setSearchTerm(term);
    }
  }, [location.search]);

  // Fetch Assets
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await apiClient.get('/assets');
      return res.data.data; // backend returns { data: [], meta: {} }
    }
  });

  // Create Asset Mutation
  const createAsset = useMutation({
    mutationFn: async (assetData: any) => {
      const res = await apiClient.post('/assets', assetData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setNewAsset({ name: '', categoryId: '', departmentId: '', acquisitionDate: new Date().toISOString().split('T')[0] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message?.[0] || 'An error occurred creating the asset');
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate(newAsset);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Directory</h1>
          <p className="page-subtitle">Manage and track all company assets.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <FileDown size={18} className="mr-2" />
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Register Asset
          </button>
        </div>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Search by Tag (AF-XXXX), Name, or Serial..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={18} className="mr-2" />
            Filters
            <Badge variant="purple">3</Badge>
          </button>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name & Category</th>
                <th>Department</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-secondary">Loading assets...</td></tr>
              ) : assets?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-secondary">No assets found. Register one!</td></tr>
              ) : (
                assets?.filter((a: any) => (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (a.assetTag?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map((asset: any) => (
                  <tr key={asset.id}>
                    <td className="font-medium">{asset.assetTag}</td>
                    <td>
                      <div>{asset.name}</div>
                      <div className="text-xs text-secondary">{asset.category?.name || 'Uncategorized'}</div>
                    </td>
                    <td>{asset.department?.name || '—'}</td>
                    <td>
                      <AssetStatusBadge status={asset.status} />
                    </td>
                    <td>{asset.condition}</td>
                    <td className="text-secondary">{asset.allocations?.[0]?.user?.name || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost px-2">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-secondary">
          <div>Showing {assets?.length || 0} assets</div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-secondary" disabled>Previous</button>
            <button className="btn btn-sm btn-secondary" disabled>Next</button>
          </div>
        </div>
      </Card>

      {/* Basic Modal for Registration */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Register New Asset</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="form-label">Asset Name</label>
                <input required type="text" className="form-input" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Category ID (UUID)</label>
                <input required type="text" className="form-input" placeholder="Needs valid UUID for now" value={newAsset.categoryId} onChange={e => setNewAsset({...newAsset, categoryId: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Acquisition Date</label>
                <input required type="date" className="form-input" value={newAsset.acquisitionDate} onChange={e => setNewAsset({...newAsset, acquisitionDate: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createAsset.isPending}>
                  {createAsset.isPending ? 'Saving...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
