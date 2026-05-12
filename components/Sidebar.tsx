'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/lib/storage';
import { Group } from '@/lib/types';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { Plus, Hash, LogOut, Settings, UserX } from 'lucide-react';

interface SidebarProps {
  currentGroupId?: string;
}

export default function Sidebar({ currentGroupId }: SidebarProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
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

      const userGroups = data?.map((item: any) => item.groups).filter(Boolean) || [];
      setGroups(userGroups);
    } catch (error: any) {
      console.error('Failed to fetch groups:', error);
    }
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

      toast.success('Joined group!');
      setShowJoinModal(false);
      setInviteCode('');
      fetchUserGroups();
      router.push(`/chat?group=${group.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setShowSettingsModal(true);
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: groupName.trim() })
        .eq('id', selectedGroup.id);

      if (error) throw error;

      // Update localStorage if this is the current group
      const currentGroup = storage.getGroup();
      if (currentGroup && currentGroup.id === selectedGroup.id) {
        storage.setGroup({ ...currentGroup, name: groupName.trim() });
      }

      toast.success('Group updated!');
      setShowSettingsModal(false);
      fetchUserGroups();
      // Force page refresh to show new name in header
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      if (error) throw error;

      toast.success('Left group');
      
      // If leaving current group, clear it from localStorage
      if (currentGroupId === groupId) {
        storage.clearGroup();
      }
      
      fetchUserGroups();
      if (currentGroupId === groupId) {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group');
    }
  };

  const handleSignOut = () => {
    storage.clearAll();
    toast.success('Signed out');
    router.push('/');
  };

  return (
    <>
      <div className="w-20 bg-neutral-950 flex flex-col h-screen border-r border-neutral-900 relative z-40">
        {/* Lumen Logo */}
        <div className="p-4 flex justify-center">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-lg">L</span>
          </div>
        </div>

        <div className="h-px bg-neutral-900 mx-3" />

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {groups.length === 0 ? (
            <div className="text-neutral-600 text-xs text-center mt-8 px-2">
              <p>No groups</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="relative group flex justify-center py-1"
              >
                <button
                  onClick={() => router.push(`/chat?group=${group.id}`)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    currentGroupId === group.id
                      ? 'bg-white text-black rounded-2xl'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white hover:rounded-2xl'
                  }`}
                  title={group.name}
                >
                  {group.name.charAt(0).toUpperCase()}
                </button>
                
                {/* Active indicator */}
                {currentGroupId === group.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {group.name}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-px bg-neutral-900 mx-3" />

        {/* Bottom Actions */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all duration-200"
            title="Join Group"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200"
            title="Sign Out"
          >
            <UserX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Join Group Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join a Group"
      >
        <div className="space-y-4">
          <Input
            label="Invite Code"
            placeholder="Enter 6-character code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleJoinGroup} disabled={loading} className="flex-1">
              {loading ? 'Joining...' : 'Join'}
            </Button>
            <Button
              onClick={() => setShowJoinModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Group Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Group Settings"
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateGroup} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={() => setShowSettingsModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
