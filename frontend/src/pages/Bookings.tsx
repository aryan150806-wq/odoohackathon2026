import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Calendar as CalendarIcon, Clock, Plus, Filter, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export function Bookings() {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showOverlap, setShowOverlap] = useState(false);
  const [overlapMsg, setOverlapMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({ assetId: '', startTime: '', endTime: '', purpose: '' });
  
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get('/bookings');
      return res.data;
    }
  });

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/bookings', {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString()
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsModalOpen(false);
      setShowOverlap(false);
      setNewBooking({ assetId: '', startTime: '', endTime: '', purpose: '' });
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        setShowOverlap(true);
        setOverlapMsg(err.response.data.message);
      }
    }
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    createBooking.mutate(newBooking);
  };

  const filteredBookings = bookings?.filter((b: any) => 
    !filterCategory || b.asset?.category?.name === filterCategory
  );

  const categories = Array.from(new Set(bookings?.map((b: any) => b.asset?.category?.name).filter(Boolean))) as string[];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resource Bookings</h1>
          <p className="page-subtitle">Schedule and manage shared assets and spaces.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          New Booking
        </button>
      </div>

      {showOverlap && (
        <div className="mb-6 animate-fade-in">
          <Alert 
            type="danger" 
            title="Booking Request Rejected"
            message={overlapMsg || "Your requested slot overlaps with an existing booking."}
          />
        </div>
      )}

      <div className="grid-3 mb-6">
        <Card className="col-span-1">
          <div className="p-4 border-b border-border font-medium">Quick Filter</div>
          <div className="p-2 flex-col gap-1">
            <button 
              onClick={() => setFilterCategory(null)}
              className={`flex justify-between items-center w-full p-2 text-sm hover:bg-surface-hover rounded-md text-left ${!filterCategory ? 'bg-primary-50 text-primary-700' : ''}`}
            >
              <span>All Resources</span>
              <Badge variant={!filterCategory ? 'purple' : 'default'}>{bookings?.length || 0}</Badge>
            </button>
            
            {categories.map(cat => {
              const count = bookings?.filter((b: any) => b.asset?.category?.name === cat).length;
              const isActive = filterCategory === cat;
              return (
                <button 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`flex justify-between items-center w-full p-2 text-sm hover:bg-surface-hover rounded-md text-left ${isActive ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  <span>{cat}</span>
                  <Badge variant={isActive ? 'purple' : 'default'}>{count}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-2 p-0">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <CalendarIcon size={18} className="mr-2 text-secondary" />
              Schedule for Conference Rooms
            </h3>
            <button className="btn btn-sm btn-secondary">
              <Clock size={16} className="mr-2" />
              Today
            </button>
          </div>
          
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Reserved By</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-secondary">Loading bookings...</td></tr>
                ) : filteredBookings?.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-secondary">No active bookings.</td></tr>
                ) : (
                  filteredBookings?.map((booking: any) => (
                    <tr key={booking.id}>
                      <td className="font-medium">{booking.asset?.name || booking.assetId}</td>
                      <td>{booking.user?.name || booking.userId}</td>
                      <td>
                        <div className="text-sm">
                          {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-xs text-secondary">{new Date(booking.startTime).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <Badge variant={
                          booking.status === 'COMPLETED' ? 'default' :
                          booking.status === 'ONGOING' ? 'success' : 'info'
                        }>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="text-secondary">{booking.purpose}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">New Booking Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary-600">&times;</button>
            </div>
            <form onSubmit={handleBook} className="p-6 space-y-4">
              <div>
                <label className="form-label">Asset ID (UUID)</label>
                <input required type="text" className="form-input" value={newBooking.assetId} onChange={e => setNewBooking({...newBooking, assetId: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Time</label>
                  <input required type="datetime-local" className="form-input" value={newBooking.startTime} onChange={e => setNewBooking({...newBooking, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input required type="datetime-local" className="form-input" value={newBooking.endTime} onChange={e => setNewBooking({...newBooking, endTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Purpose</label>
                <input type="text" className="form-input" placeholder="e.g. Client Meeting" value={newBooking.purpose} onChange={e => setNewBooking({...newBooking, purpose: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createBooking.isPending}>
                  {createBooking.isPending ? 'Checking availability...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
