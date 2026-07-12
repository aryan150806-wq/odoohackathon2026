import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { apiClient } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface UtilizationData {
  category: string;
  used: number;
  idle: number;
}

interface DeptAllocationData {
  department: string;
  count: number;
}

interface MaintenanceData {
  category: string;
  count: number;
  trend: number;
}

const COLORS = ['#00d2ff', '#1a8bb8', '#3b82f6', '#0a5c8a', '#60a5fa'];

export function Reports() {
  const { data: utilization } = useQuery({
    queryKey: ['reports', 'utilization'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/asset-utilization');
      return res.data;
    }
  });

  const { data: deptAllocation } = useQuery({
    queryKey: ['reports', 'deptAllocation'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/department-allocation');
      return res.data;
    }
  });

  const { data: maintenanceFreq } = useQuery({
    queryKey: ['reports', 'maintenanceFreq'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/maintenance-frequency');
      return res.data;
    }
  });

  // Safe mapping with fallbacks in case API fails or returns empty array
  const hasUtilization = utilization && utilization.length > 0;
  const barData = hasUtilization ? utilization.map((u: UtilizationData) => ({
    name: u.category,
    used: u.used,
    idle: u.idle
  })) : [];

  const hasDept = deptAllocation && deptAllocation.length > 0;
  const pieData = hasDept ? deptAllocation.map((d: DeptAllocationData) => ({
    name: d.department,
    value: d.count
  })) : [];

  const hasMaintenance = maintenanceFreq && maintenanceFreq.length > 0;
  const maintenanceData: MaintenanceData[] = hasMaintenance ? maintenanceFreq : [];

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/assets');
      const assets = res.data.data || res.data;
      
      if (!assets || !assets.length) {
        alert('No data to export');
        return;
      }
      
      const headers = Object.keys(assets[0]).filter(k => typeof assets[0][k] !== 'object');
      const csv = [
        headers.join(','),
        ...assets.map((row: any) => 
          headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'assets_export.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Analyze asset utilization, maintenance frequencies, and overall system health.</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={18} className="mr-2" />
          Export All (CSV)
        </button>
      </div>

      <div className="grid-2 mb-6">
        <Card title="Asset Utilization Trend" subtitle="Most-used vs. idle assets over the last 30 days">
          <div className="h-64 mt-4 text-xs font-medium">
            {!hasUtilization ? (
              <div className="h-full flex items-center justify-center text-tertiary">No utilization data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#00d2ff' }}
                  />
                  <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  <Bar dataKey="used" name="Used / Assigned" fill="#00d2ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="idle" name="Idle / Available" fill="#1a1a1a" radius={[4, 4, 0, 0]} stroke="rgba(255,255,255,0.1)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Department Allocation Summary" subtitle="Total asset count per department">
          <div className="h-64 mt-4 text-xs font-medium">
            {!hasDept ? (
              <div className="h-full flex items-center justify-center text-tertiary">No allocation data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry: DeptAllocationData, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="middle" layout="vertical" align="right" wrapperStyle={{ color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid-3">
        <Card title="Maintenance Frequency" subtitle="By asset category">
          <div className="flex-col gap-4 mt-4">
            {!hasMaintenance ? (
              <div className="flex items-center justify-center text-tertiary h-32">No maintenance data available</div>
            ) : (
              maintenanceData.map((item: MaintenanceData) => (
                <div key={item.category} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{item.category}</div>
                    <div className={`flex items-center text-sm font-medium ${item.trend > 0 ? 'text-danger' : item.trend < 0 ? 'text-success' : 'text-secondary'}`}>
                      {item.trend > 0 ? <TrendingUp size={14} className="mr-1"/> : item.trend < 0 ? <TrendingDown size={14} className="mr-1"/> : null}
                      {Math.abs(item.trend)}%
                    </div>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.trend > 0 ? 'bg-danger' : item.trend < 0 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(Math.max(item.count * 5, 5), 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        
        <Card className="col-span-2" title="Resource Booking Heatmap" subtitle="Peak usage windows by day and hour (Under Construction)">
          <div className="h-32 flex items-center justify-center bg-surface-hover rounded-lg border border-dashed border-border mt-4">
            <div className="text-center text-tertiary text-sm">
              Heatmap requires specialized calendar layout. Will be implemented in UI phase 2.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
