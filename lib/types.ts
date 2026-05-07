export interface User {
  id: string;
  nickname: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: 'text' | 'sticker';
  users?: User;
}

export interface Event {
  id: string;
  group_id: string;
  title: string;
  description: string;
  date: string;
  created_by: string;
  created_at: string;
}
