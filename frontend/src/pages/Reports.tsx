import React from 'react';
import { Card } from '../components/ui/Card';
import { BarChart3, TrendingUp, TrendingDown, Download } from 'lucide-react';

export function Reports() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Analyze asset utilization, maintenance frequencies, and overall system health.</p>
        </div>
        <button className="btn btn-primary">
          <Download size={18} className="mr-2" />
          Export All (CSV)
        </button>
      </div>

      <div className="grid-2 mb-6">
        <Card title="Asset Utilization Trend" subtitle="Most-used vs. idle assets over the last 30 days">
          <div className="h-64 flex items-center justify-center bg-surface-hover rounded-lg border border-dashed border-border mt-4">
            <div className="text-center text-tertiary">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
              Chart visualization (Recharts/Chart.js)
            </div>
          </div>
        </Card>

        <Card title="Department Allocation Summary" subtitle="Total asset value and count per department">
          <div className="h-64 flex items-center justify-center bg-surface-hover rounded-lg border border-dashed border-border mt-4">
            <div className="text-center text-tertiary">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
              Pie chart visualization
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-3">
        <Card title="Maintenance Frequency" subtitle="By asset category">
          <div className="flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Electronics</div>
              <div className="flex items-center text-danger text-sm font-medium"><TrendingUp size={14} className="mr-1"/> 12%</div>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div className="h-full bg-danger w-[65%]" />
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm font-medium">AV Equipment</div>
              <div className="flex items-center text-success text-sm font-medium"><TrendingDown size={14} className="mr-1"/> 4%</div>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div className="h-full bg-warning-500 w-[25%]" />
            </div>
          </div>
        </Card>
        
        <Card className="col-span-2" title="Resource Booking Heatmap" subtitle="Peak usage windows by day and hour">
          <div className="h-32 flex items-center justify-center bg-surface-hover rounded-lg border border-dashed border-border mt-4">
            <div className="text-center text-tertiary text-sm">
              Heatmap grid placeholder
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
