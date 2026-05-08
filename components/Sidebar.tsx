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
import { Plus, Hash, LogOut, Settings } from 'lucide-react';

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

      toast.success('Group updated!');
      setShowSettingsModal(false);
      fetchUserGroups();
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
      fetchUserGroups();
      if (currentGroupId === groupId) {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group');
    }
  };

  return (
    <>
      <div className="w-64 bg-gray-900 dark:bg-gray-950 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Lumen</h2>
          <p className="text-gray-400 text-sm">{user?.nickname}</p>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`group relative rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                  currentGroupId === group.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
                onClick={() => router.push(`/chat?group=${group.id}`)}
              >
                <div className="flex items-center gap-3">
                  {group.avatar_url ? (
                    <img
                      src={group.avatar_url}
                      alt={group.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    <p className="text-xs opacity-75">Code: {group.code}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSettings(group);
                    }}
                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup(group.id);
                    }}
                    className="p-1 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plus Button */}
        <div className="p-4 border-t border-gray-800">
          <Button
            onClick={() => setShowJoinModal(true)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Join Group
          </Button>
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
