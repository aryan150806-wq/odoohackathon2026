import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, Building, Tags, Plus, MoreVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const MOCK_DEPARTMENTS = [
  { id: '1', name: 'IT Support', head: 'Raj Kumar', status: 'Active', members: 12 },
  { id: '2', name: 'Engineering', head: 'Sarah Chen', status: 'Active', members: 45 },
  { id: '3', name: 'Facilities', head: 'Mike Davis', status: 'Active', members: 8 }
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Electronics', desc: 'Laptops, phones, tablets', fields: 3 },
  { id: '2', name: 'Furniture', desc: 'Desks, chairs, cabinets', fields: 1 },
  { id: '3', name: 'AV Equipment', desc: 'Projectors, microphones', fields: 2 }
];

const MOCK_EMPLOYEES = [
  { id: '1', name: 'System Admin', email: 'admin@assetflow.local', role: 'ADMIN', dept: 'IT Support' },
  { id: '2', name: 'Raj Kumar', email: 'raj@assetflow.local', role: 'DEPARTMENT_HEAD', dept: 'IT Support' },
  { id: '3', name: 'Priya Sharma', email: 'priya@assetflow.local', role: 'EMPLOYEE', dept: 'IT Support' },
  { id: '4', name: 'Dave Tech', email: 'dave@assetflow.local', role: 'ASSET_MANAGER', dept: 'Facilities' },
];

export function Organization() {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments');
  const [modalType, setModalType] = useState<'departments' | 'categories' | 'employees' | null>(null);
  
  const [newDept, setNewDept] = useState({ name: '' });
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [newEmp, setNewEmp] = useState({ name: '', email: '', password: 'password123' });
  
  const queryClient = useQueryClient();

  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get('/organizations/departments');
      return res.data;
    }
  });

  const createDept = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/organizations/departments', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setModalType(null);
      setNewDept({ name: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error creating department');
    }
  });

  const createCat = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/organizations/categories', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalType(null);
      setNewCat({ name: '', description: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error creating category');
    }
  });

  const createEmp = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/auth/signup', data);
      return res.data;
    },
    onSuccess: () => {
      // In a real app we'd fetch employees, for now just close
      setModalType(null);
      setNewEmp({ name: '', email: '', password: 'password123' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error creating employee');
    }
  });

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    createDept.mutate(newDept);
  };

  const handleCreateCat = (e: React.FormEvent) => {
    e.preventDefault();
    createCat.mutate(newCat);
  };

  const handleCreateEmp = (e: React.FormEvent) => {
    e.preventDefault();
    createEmp.mutate(newEmp);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Setup</h1>
          <p className="page-subtitle">Manage departments, asset categories, and the employee directory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalType(activeTab)}>
          <Plus size={18} className="mr-2" />
          {activeTab === 'departments' && 'New Department'}
          {activeTab === 'categories' && 'New Category'}
          {activeTab === 'employees' && 'Add Employee'}
        </button>
      </div>

      <div className="flex border-b border-border mb-6">
        <button 
          className={`px-4 py-3 font-medium flex items-center ${activeTab === 'departments' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-secondary hover:text-primary-600'}`}
          onClick={() => setActiveTab('departments')}
        >
          <Building size={18} className="mr-2" />
          Departments
        </button>
        <button 
          className={`px-4 py-3 font-medium flex items-center ${activeTab === 'categories' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-secondary hover:text-primary-600'}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tags size={18} className="mr-2" />
          Asset Categories
        </button>
        <button 
          className={`px-4 py-3 font-medium flex items-center ${activeTab === 'employees' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-secondary hover:text-primary-600'}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} className="mr-2" />
          Employee Directory
        </button>
      </div>

      <Card>
        <div className="table-wrapper">
          {activeTab === 'departments' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Department Head</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDepts ? (
                  <tr><td colSpan={5} className="text-center py-8 text-secondary">Loading...</td></tr>
                ) : (
                  departments?.map((dept: any) => (
                    <tr key={dept.id}>
                      <td className="font-medium">{dept.name}</td>
                      <td>{dept.head?.name || '—'}</td>
                      <td>{dept._count?.members || 0}</td>
                      <td><Badge variant="success">Active</Badge></td>
                      <td>
                        <button className="btn btn-sm btn-ghost px-2"><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'categories' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Custom Fields</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CATEGORIES.map(cat => (
                  <tr key={cat.id}>
                    <td className="font-medium">{cat.name}</td>
                    <td className="text-secondary">{cat.desc}</td>
                    <td><Badge variant="info">{cat.fields} fields configured</Badge></td>
                    <td>
                      <button className="btn btn-sm btn-ghost px-2"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'employees' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_EMPLOYEES.map(emp => (
                  <tr key={emp.id}>
                    <td className="font-medium">{emp.name}</td>
                    <td className="text-secondary">{emp.email}</td>
                    <td>{emp.dept}</td>
                    <td>
                      <Badge variant={emp.role === 'ADMIN' ? 'danger' : emp.role === 'ASSET_MANAGER' ? 'purple' : emp.role === 'DEPARTMENT_HEAD' ? 'warning' : 'default'}>
                        {emp.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary text-primary">Promote Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Basic Department Modal */}
      {modalType === 'departments' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">New Department</h2>
              <button onClick={() => setModalType(null)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleCreateDept} className="p-6 space-y-4">
              <div>
                <label className="form-label">Department Name</label>
                <input required type="text" className="form-input" value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createDept.isPending}>
                  {createDept.isPending ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Basic Category Modal */}
      {modalType === 'categories' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">New Category</h2>
              <button onClick={() => setModalType(null)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleCreateCat} className="p-6 space-y-4">
              <div>
                <label className="form-label">Category Name</label>
                <input required type="text" className="form-input" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <input required type="text" className="form-input" value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createCat.isPending}>
                  {createCat.isPending ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Basic Employee Modal */}
      {modalType === 'employees' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add Employee</h2>
              <button onClick={() => setModalType(null)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleCreateEmp} className="p-6 space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-input" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input required type="email" className="form-input" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Default Password</label>
                <input required type="text" className="form-input" disabled value={newEmp.password} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createEmp.isPending}>
                  {createEmp.isPending ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
