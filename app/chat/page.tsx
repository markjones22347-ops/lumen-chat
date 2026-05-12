'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import { Message } from '@/lib/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Send, Image, Calendar } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = storage.getUser();
  const group = storage.getGroup();

  useEffect(() => {
    if (!user || !group) {
      router.push('/');
      return;
    }

    fetchMessages();
    subscribeToMessages();

    return () => {
      supabase.channel('messages').unsubscribe();
    };
  }, [router, user, group]);

  useEffect(() => {
    // Only scroll to bottom when new messages are added
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!group) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users(*)')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!group) return;
    
    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchMessages();
          }
        }
      )
      .subscribe();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !group) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          group_id: group.id,
          user_id: user.id,
          content: newMessage.trim(),
          type: 'text',
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !group) return;

    setUploading(true);
    try {
      // Create stickers bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('stickers', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880, // 5MB
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${group.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      const { error: messageError } = await supabase.from('messages').insert([
        {
          group_id: group.id,
          user_id: user.id,
          content: publicUrl,
          type: 'sticker',
        },
      ]);

      if (messageError) throw messageError;
    } catch (error: any) {
      // Ignore bucket already exists error
      if (error.message?.includes('already exists')) {
        // Try upload again after bucket exists
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${group.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('stickers')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stickers')
          .getPublicUrl(filePath);

        const { error: messageError } = await supabase.from('messages').insert([
          {
            group_id: group.id,
            user_id: user.id,
            content: publicUrl,
            type: 'sticker',
          },
        ]);

        if (messageError) throw messageError;
      } else {
        toast.error(error.message || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLeaveGroup = () => {
    storage.clearGroup();
    router.push('/');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <h1 className="text-white font-semibold text-sm">{group?.name}</h1>
              <p className="text-neutral-500 text-xs">Code: {group?.code}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/calendar')}
            className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-600 mt-20">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 ${
                      isOwnMessage
                        ? 'bg-white text-black'
                        : 'bg-neutral-900 text-white'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 text-neutral-400">
                        {message.users?.nickname}
                      </p>
                    )}
                    {message.type === 'sticker' ? (
                      <img src={message.content} alt="" className="max-w-[200px] rounded-lg" />
                    ) : (
                      <p className="break-words text-sm leading-relaxed">{message.content}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${isOwnMessage ? 'text-neutral-500' : 'text-neutral-600'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-neutral-950 border-t border-neutral-900 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <Image className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="mb-0 bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700 focus:ring-0 rounded-xl"
              />
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 right-0 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <span className="text-sm">😀</span>
            </button>
            <button
              onClick={handleSendMessage}
              disabled={uploading}
              className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {uploading ? <LoadingSpinner /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
