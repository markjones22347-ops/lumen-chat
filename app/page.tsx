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
      console.log('Setting nickname:', nickname.trim());
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname.trim())
        .single();

      console.log('Existing user check:', existingUser, checkError);

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError);
        throw checkError;
      }

      if (existingUser) {
        storage.setUser({ id: existingUser.id, nickname: existingUser.nickname });
        console.log('Using existing user:', existingUser);
      } else {
        console.log('Creating new user...');
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ nickname: nickname.trim() }])
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        storage.setUser({ id: newUser.id, nickname: newUser.nickname });
        console.log('Created new user:', newUser);
      }

      toast.success('Nickname set!');
      setShowCreate(true);
      setShowJoin(true);
    } catch (error: any) {
      console.error('Nickname set error:', error);
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold text-white mb-3 tracking-tight">
            Lumen
          </h1>
          <p className="text-neutral-500 text-sm tracking-wide uppercase">Private Chat & Planning</p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetNickname()}
            className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-white focus:ring-0"
          />
          <Button 
            onClick={handleSetNickname} 
            disabled={loading} 
            className="w-full bg-white text-black hover:bg-neutral-200 font-semibold rounded-xl py-3"
          >
            {loading ? <LoadingSpinner /> : 'Continue'}
          </Button>
        </div>

        {showCreate && showJoin && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="h-px bg-neutral-800" />
            
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Create New Group</h3>
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-white focus:ring-0"
              />
              <Button 
                onClick={handleCreateGroup} 
                disabled={loading} 
                className="w-full bg-white text-black hover:bg-neutral-200 font-semibold rounded-xl py-3"
              >
                {loading ? <LoadingSpinner /> : 'Create'}
              </Button>
            </div>

            <div className="h-px bg-neutral-800" />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Join Existing</h3>
              <Input
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
                className="bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-white focus:ring-0"
              />
              <Button 
                onClick={handleJoinGroup} 
                disabled={loading} 
                className="w-full bg-neutral-800 text-white hover:bg-neutral-700 font-semibold rounded-xl py-3 border border-neutral-700"
              >
                {loading ? <LoadingSpinner /> : 'Join'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
