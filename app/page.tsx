'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    const user = storage.getUser();
    const group = storage.getGroup();
    if (user && group) {
      router.push('/chat');
    }
  }, [router]);

  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSetNickname = async () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    setLoading(true);
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        storage.setUser({ id: existingUser.id, nickname: existingUser.nickname });
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ nickname: nickname.trim() }])
          .select()
          .single();

        if (insertError) throw insertError;

        storage.setUser({ id: newUser.id, nickname: newUser.nickname });
      }

      toast.success('Nickname set!');
      setShowCreate(true);
      setShowJoin(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set nickname');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const user = storage.getUser();
      if (!user) {
        toast.error('Please set a nickname first');
        return;
      }

      const code = generateInviteCode();
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: groupName.trim(), code }])
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ user_id: user.id, group_id: newGroup.id }]);

      if (memberError) throw memberError;

      storage.setGroup({ id: newGroup.id, name: newGroup.name, code: newGroup.code });
      toast.success('Group created!');
      router.push('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const user = storage.getUser();
      if (!user) {
        toast.error('Please set a nickname first');
        return;
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', inviteCode.trim().toUpperCase())
        .single();

      if (groupError || !group) {
        toast.error('Invalid invite code');
        return;
      }

      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', group.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([{ user_id: user.id, group_id: group.id }]);

        if (memberError) throw memberError;
      }

      storage.setGroup({ id: group.id, name: group.name, code: group.code });
      toast.success('Joined group!');
      router.push('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Lumen</h1>
          <p className="text-gray-600 dark:text-gray-400">Private group chat & planning</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetNickname()}
          />
          <Button onClick={handleSetNickname} disabled={loading} className="w-full">
            {loading ? <LoadingSpinner /> : 'Set Nickname'}
          </Button>
        </div>

        {showCreate && showJoin && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Create a Group</h3>
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button onClick={handleCreateGroup} disabled={loading} className="w-full mt-2">
                {loading ? <LoadingSpinner /> : 'Create Group'}
              </Button>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Join with Code</h3>
              <Input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
              />
              <Button onClick={handleJoinGroup} disabled={loading} variant="secondary" className="w-full mt-2">
                {loading ? <LoadingSpinner /> : 'Join Group'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
