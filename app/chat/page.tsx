'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import { Message } from '@/lib/types';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Send, Image, Calendar } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const STICKERS_BUCKET = 'stickers';

function isBucketMissingError(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: string }).message)
      : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('bucket not found') ||
    (lower.includes('not found') && lower.includes('bucket')) ||
    lower.includes('no such bucket') ||
    msg.includes('404')
  );
}

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

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !group) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random()}.${fileExt}`;
      const filePath = `${group.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STICKERS_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        if (isBucketMissingError(uploadError)) {
          toast.error(
            'Stickers bucket missing. In Supabase → SQL Editor, run the storage block at the end of supabase/schema.sql (creates the stickers bucket and upload policies).',
            { duration: 10000 }
          );
          return;
        }
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(STICKERS_BUCKET).getPublicUrl(filePath);

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
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex text-neutral-900">
      <Sidebar currentGroupId={group?.id} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm">
              {group?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-neutral-900 font-semibold text-sm">{group?.name}</h1>
              <p className="text-neutral-500 text-xs">Code: {group?.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/calendar')}
            className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors border border-neutral-200"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 mt-20">
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
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 border ${
                      isOwnMessage
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-100 text-neutral-900 border-neutral-200'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 text-neutral-600">
                        {message.users?.nickname}
                      </p>
                    )}
                    {message.type === 'sticker' ? (
                      <img src={message.content} alt="" className="max-w-[200px] rounded-lg" />
                    ) : (
                      <p className="break-words text-sm leading-relaxed">{message.content}</p>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwnMessage ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-neutral-50 border-t border-neutral-200 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              <Image className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="mb-0 rounded-xl py-2.5"
              />
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 right-0 z-50 shadow-lg rounded-xl overflow-hidden border border-neutral-200">
                  <EmojiPicker theme={Theme.LIGHT} onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <span className="text-sm">😀</span>
            </button>
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={uploading}
              className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {uploading ? <LoadingSpinner /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
