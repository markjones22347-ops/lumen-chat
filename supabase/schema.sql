-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(8) NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'sticker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can be viewed by anyone" ON users;
CREATE POLICY "Users can be viewed by anyone" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

-- RLS Policies for groups
DROP POLICY IF EXISTS "Groups can be viewed by anyone" ON groups;
CREATE POLICY "Groups can be viewed by anyone" ON groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Groups can be created by anyone" ON groups;
CREATE POLICY "Groups can be created by anyone" ON groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Groups can be updated by anyone" ON groups;
CREATE POLICY "Groups can be updated by anyone" ON groups FOR UPDATE USING (true);

-- RLS Policies for group_members
DROP POLICY IF EXISTS "Group members can be viewed by anyone" ON group_members;
CREATE POLICY "Group members can be viewed by anyone" ON group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Group members can leave" ON group_members;
CREATE POLICY "Group members can leave" ON group_members FOR DELETE USING (true);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Messages can be viewed by anyone" ON messages;
CREATE POLICY "Messages can be viewed by anyone" ON messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Messages can be inserted by anyone" ON messages;
CREATE POLICY "Messages can be inserted by anyone" ON messages FOR INSERT WITH CHECK (true);

-- RLS Policies for events
DROP POLICY IF EXISTS "Events can be viewed by anyone" ON events;
CREATE POLICY "Events can be viewed by anyone" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Events can be inserted by anyone" ON events;
CREATE POLICY "Events can be inserted by anyone" ON events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Events can be deleted by anyone" ON events;
CREATE POLICY "Events can be deleted by anyone" ON events FOR DELETE USING (true);

-- Storage: public stickers bucket (run once; fixes "Bucket not found" for image uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stickers',
  'stickers',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "stickers_select_public" ON storage.objects;
CREATE POLICY "stickers_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'stickers');

DROP POLICY IF EXISTS "stickers_insert_public" ON storage.objects;
CREATE POLICY "stickers_insert_public"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stickers');
