'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import { Event } from '@/lib/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const user = storage.getUser();
  const group = storage.getGroup();

  useEffect(() => {
    if (!user || !group) {
      router.push('/');
      return;
    }

    fetchEvents();
    subscribeToEvents();

    return () => {
      supabase.channel('events').unsubscribe();
    };
  }, [router, user, group]);

  const fetchEvents = async () => {
    if (!group) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('group_id', group.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToEvents = () => {
    if (!group) return;
    
    supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            fetchEvents();
          }
        }
      )
      .subscribe();
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !date || !user || !group) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('events').insert([
        {
          group_id: group.id,
          title: title.trim(),
          description: description.trim(),
          date: new Date(date).toISOString(),
          created_by: user.id,
        },
      ]);

      if (error) throw error;
      toast.success('Event added!');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDate('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) throw error;
      toast.success('Event deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
    }
  };

  const handleLeaveGroup = () => {
    storage.clearGroup();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex">
      <Sidebar currentGroupId={group?.id} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white font-bold text-sm">
              {group?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">{group?.name} Calendar</h1>
              <p className="text-neutral-500 text-xs">Code: {group?.code}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-semibold text-lg">Events</h2>
              <button
                onClick={() => setShowModal(true)}
                className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center text-neutral-600 mt-20">
                <p className="text-sm">No events yet. Plan something!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base mb-2">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-neutral-400 text-sm mb-3">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-neutral-500">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {format(new Date(event.date), 'PPP')}
                        </div>
                      </div>
                      {event.created_by === user?.id && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Event Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Event">
          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="What's happening?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700 focus:ring-0"
            />
            <Input
              label="Description"
              placeholder="Add details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700 focus:ring-0"
            />
            <Input
              label="Date & Time"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700 focus:ring-0"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleAddEvent}
                className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Add Event
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-neutral-900 text-white font-semibold py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
