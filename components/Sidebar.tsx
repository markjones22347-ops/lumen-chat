'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import { Group } from '@/lib/types';
import { generateInviteCode } from '@/lib/inviteCode';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { Plus, LogOut, UserX } from 'lucide-react';

interface SidebarProps {
  currentGroupId?: string;
}

type GroupModalTab = 'join' | 'create';

export default function Sidebar({ currentGroupId }: SidebarProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupModalTab, setGroupModalTab] = useState<GroupModalTab>('join');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const user = storage.getUser();

  useEffect(() => {
    fetchUserGroups();
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const userGroups = data?.map((item: any) => item.groups as Group).filter(Boolean) || [];
      setGroups(userGroups);
    } catch (error: unknown) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const openGroupModal = () => {
    setGroupModalTab('join');
    setInviteCode('');
    setNewGroupName('');
    setShowGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setInviteCode('');
    setNewGroupName('');
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', inviteCode.trim().toUpperCase())
        .single();

      if (groupError || !group) {
        toast.error('Invalid invite code');
        return;
      }

      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', group.id)
        .single();

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([{ user_id: user.id, group_id: group.id }]);

        if (memberError) throw memberError;
      }

      storage.setGroup({ id: group.id, name: group.name, code: group.code });
      toast.success('Joined group!');
      closeGroupModal();
      fetchUserGroups();
      router.push('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupFromModal = async () => {
    if (!newGroupName.trim() || !user) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const code = generateInviteCode(6);
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: newGroupName.trim(), code }])
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ user_id: user.id, group_id: newGroup.id }]);

      if (memberError) throw memberError;

      storage.setGroup({ id: newGroup.id, name: newGroup.name, code: newGroup.code });
      toast.success('Group created!');
      closeGroupModal();
      fetchUserGroups();
      router.push('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const confirmSignOut = () => {
    storage.clearAll();
    toast.success('Signed out');
    setShowSignOutModal(false);
    router.push('/');
  };

  const groupModalTitle = groupModalTab === 'join' ? 'Join a group' : 'Create a group';

  return (
    <>
      <div className="w-20 bg-neutral-50 flex flex-col h-screen border-r border-neutral-200 relative z-40">
        <div className="p-4 flex justify-center">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
        </div>

        <div className="h-px bg-neutral-200 mx-3" />

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {groups.length === 0 ? (
            <div className="text-neutral-500 text-xs text-center mt-8 px-2">
              <p>No groups</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="relative group flex justify-center py-1">
                <button
                  type="button"
                  onClick={() => router.push(`/chat?group=${group.id}`)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    currentGroupId === group.id
                      ? 'bg-neutral-900 text-white rounded-2xl'
                      : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  title={group.name}
                >
                  {group.name.charAt(0).toUpperCase()}
                </button>

                {currentGroupId === group.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neutral-900 rounded-r" />
                )}

                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {group.name}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-px bg-neutral-200 mx-3" />

        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={openGroupModal}
            className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200"
            title="Join or create group"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
            title="Sign out"
          >
            <UserX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Modal isOpen={showGroupModal} onClose={closeGroupModal} title={groupModalTitle}>
        <div className="space-y-4">
          <div className="flex rounded-xl border border-neutral-200 p-0.5 bg-neutral-100">
            <button
              type="button"
              onClick={() => setGroupModalTab('join')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                groupModalTab === 'join'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => setGroupModalTab('create')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                groupModalTab === 'create'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Create
            </button>
          </div>

          {groupModalTab === 'join' ? (
            <>
              <Input
                label="Invite Code"
                placeholder="Enter 6-character code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleJoinGroup} disabled={loading} className="flex-1">
                  {loading ? 'Joining...' : 'Join'}
                </Button>
                <Button onClick={closeGroupModal} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Group name"
                placeholder="My study group"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroupFromModal()}
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateGroupFromModal} disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create group'}
                </Button>
                <Button onClick={closeGroupModal} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={showSignOutModal} onClose={() => setShowSignOutModal(false)} title="Sign out?">
        <p className="text-neutral-600 text-sm mb-4">Are you sure you want to sign out? You will need your nickname again to return.</p>
        <div className="flex gap-2">
          <Button onClick={() => setShowSignOutModal(false)} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={confirmSignOut} variant="danger" className="flex-1">
            Sign out
          </Button>
        </div>
      </Modal>
    </>
  );
}
