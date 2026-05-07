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
import toast from 'react-hot-toast';
import { Plus, Trash2, MessageSquare, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{group.name} Calendar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Code: {group.code}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/chat')} variant="ghost" size="sm">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button onClick={handleLeaveGroup} variant="danger" size="sm">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Event
            </Button>
          </div>

          {events.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <p>No events yet. Plan something fun!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                    {event.created_by === user.id && (
                      <Button
                        onClick={() => handleDeleteEvent(event.id)}
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
          />
          <Input
            label="Description"
            placeholder="Add details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddEvent} className="flex-1">
              Add Event
            </Button>
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
