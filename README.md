# Lumen - Private Group Chat & Planning

A lightweight private hangout + study planning web app for small groups of friends. Chat in real-time, join groups via invite codes, send custom stickers/emojis, and plan hangouts with a shared calendar.

## Features

- **Real-time Chat**: Instant messaging with Supabase Realtime
- **Group System**: Create groups with unique invite codes
- **Sticker Support**: Upload and send sticker images
- **Shared Calendar**: Plan events with your group
- **Simple Auth**: Nickname-based authentication (no passwords)
- **Modern UI**: Clean, responsive design with dark mode support
- **Fast Performance**: Built with Next.js 14 and TypeScript

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Realtime, Storage)
- **Deployment**: Vercel-ready

## Project Structure

```
├── app/
│   ├── chat/          # Chat page with real-time messaging
│   ├── calendar/      # Calendar page with shared events
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page (nickname, create/join group)
├── components/
│   ├── Button.tsx     # Reusable button component
│   ├── Input.tsx      # Reusable input component
│   ├── LoadingSpinner.tsx
│   └── Modal.tsx      # Reusable modal component
├── lib/
│   ├── supabaseClient.ts  # Supabase client configuration
│   ├── storage.ts         # localStorage utilities
│   └── types.ts           # TypeScript interfaces
└── supabase/
    └── schema.sql         # Database schema
```

## Local Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/markjones22347-ops/lumen-chat.git
cd lumen-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials (see Supabase Setup below).

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

# FULL SUPABASE SETUP GUIDE

This guide will walk you through setting up Supabase for Lumen step by step.

## 1. Creating a Supabase Project

### Step 1: Sign In to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click the **"Start your project"** button in the top right
3. Sign in with your GitHub account or create a new account

### Step 2: Create a New Project

1. After signing in, click the **"New Project"** button
2. You'll be taken to the project creation page

### Step 3: Choose Organization

1. If you already have an organization, select it from the dropdown
2. If not, you can create a new organization by clicking **"New organization"**
3. Enter a name for your organization (e.g., "Lumen")
4. Click **"Create organization"**

### Step 4: Configure Project Settings

1. **Name**: Enter a name for your project (e.g., "lumen-chat")
2. **Database Password**: Create a strong password for your database
   - Make sure to save this password somewhere safe
   - You'll need it if you want to connect directly to the database
3. **Region**: Choose a region closest to your users
   - For best performance, pick the region nearest to you
   - Common choices: US East, US West, EU West, etc.
4. **Pricing Plan**: Select **"Free"** (the free tier is sufficient for Lumen)

### Step 5: Create the Project

1. Click the **"Create new project"** button
2. Wait for the database to be provisioned
   - This usually takes 1-2 minutes
   - You'll see a progress bar
3. Once complete, you'll be redirected to your project dashboard

## 2. Getting API Keys

### Step 1: Navigate to Project Settings

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **"API"** from the settings menu

### Step 2: Copy API Credentials

You'll see two important values on this page:

1. **Project URL**: 
   - Find the field labeled **"Project URL"**
   - Click the copy button next to it
   - This looks like: `https://xxxxxxxxxxxxx.supabase.co`

2. **anon public key**:
   - Find the field labeled **"anon public"** or **"anon / public"**
   - Click the copy button next to it
   - This is a long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Add to Environment Variables

Open your `.env.local` file and paste these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace the placeholder values with your actual credentials.

**Important**: Never commit your `.env.local` file to GitHub. It contains sensitive credentials.

## 3. Running SQL Schema

### Step 1: Open SQL Editor

1. In your Supabase project dashboard, click on the **SQL Editor** icon in the left sidebar
   - It looks like a terminal/console icon
2. You'll see a list of queries (if any)

### Step 2: Create a New Query

1. Click the **"New query"** button in the top right
2. A blank SQL editor will open

### Step 3: Paste the Schema

Copy the entire content of the `supabase/schema.sql` file from this repository and paste it into the SQL editor.

The schema includes:
- **users table**: Stores user nicknames
- **groups table**: Stores group information and invite codes
- **group_members table**: Links users to groups
- **messages table**: Stores chat messages (text and stickers)
- **events table**: Stores calendar events

### Step 4: Run the Schema

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the query to complete
3. You should see a success message showing all tables were created

### Step 5: Verify Tables

1. In the left sidebar, click on the **Table Editor** icon (looks like a grid)
2. You should see the following tables listed:
   - `users`
   - `groups`
   - `group_members`
   - `messages`
   - `events`

## 4. Enabling Realtime

Realtime enables instant updates for chat messages and calendar events without refreshing the page.

### For Messages Table

1. In your Supabase dashboard, click on **Replication** in the left sidebar
2. You'll see a list of tables
3. Find the **messages** table
4. Toggle the switch to **ON** for the messages table
5. Wait for the change to save (you'll see a green checkmark)

### For Events Table

1. On the same Replication page
2. Find the **events** table
3. Toggle the switch to **ON** for the events table
4. Wait for the change to save

**Note**: Make sure both tables have their realtime enabled. This is critical for the chat and calendar to update in real-time.

## 5. Creating Storage Bucket

Storage is used to upload and store sticker images.

### Step 1: Navigate to Storage

1. In the left sidebar, click on the **Storage** icon (looks like a bucket)
2. You'll see the storage management page

### Step 2: Create a New Bucket

1. Click the **"New bucket"** button
2. A modal will appear

### Step 3: Configure Bucket Settings

1. **Name**: Enter `stickers` (exactly this, lowercase)
2. **Public bucket**: Toggle this to **ON**
   - This is important so images can be displayed in the chat
3. Click **"Create bucket"**

### Step 4: Configure Bucket Policies (Optional but Recommended)

By default, anyone can upload to a public bucket. For better security:

1. Click on the **stickers** bucket you just created
2. Click on **"Policies"** tab
3. For a simple setup, you can leave the default policies
4. For production, you may want to add authentication requirements

### How Uploads Work

When a user uploads a sticker:
1. The image is uploaded to the `stickers` bucket in Supabase Storage
2. Supabase generates a public URL for the image
3. The URL is stored in the `messages` table with type `sticker`
4. The image is displayed in the chat using this URL

## 6. Row Level Security (RLS)

### What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access based on policies. It provides an additional layer of security.

### RLS Status in Lumen

The schema includes RLS policies that:
- Allow anyone to view users, groups, and messages
- Allow users to insert their own profiles
- Allow group members to send messages
- Allow event creators to delete their own events

### Policies Included

The schema automatically creates these policies when you run the SQL:

**Users Table:**
- Users can be viewed by anyone
- Users can insert their own profile
- Users can update their own profile

**Groups Table:**
- Groups can be viewed by anyone
- Groups can be created by anyone
- Groups can be updated by members

**Group Members Table:**
- Group members can be viewed by anyone
- Users can join groups
- Group members can leave

**Messages Table:**
- Messages can be viewed by group members
- Messages can be inserted by group members

**Events Table:**
- Events can be viewed by group members
- Events can be inserted by group members
- Events can be deleted by creator

### Verifying RLS

1. Go to **Table Editor** in Supabase
2. Click on any table (e.g., `messages`)
3. Click on the **"RLS policies"** tab
4. You should see the policies listed there

## 7. Testing the Database

### Verify Tables Exist

1. Go to **Table Editor** in Supabase
2. You should see all 5 tables: `users`, `groups`, `group_members`, `messages`, `events`
3. Click on each table to verify they have the correct columns

### Verify Realtime Works

1. Start your local development server: `npm run dev`
2. Open the app in two different browser windows
3. Create a group in one window
4. Join the same group in the other window
5. Send a message in one window
6. The message should appear instantly in the other window without refreshing

### Verify Uploads Work

1. Start the app and join/create a group
2. Click the image icon in the chat input
3. Select an image file
4. The image should upload and appear in the chat
5. Check the Storage section in Supabase to see the uploaded file

## Vercel Deployment

### Deploying to Vercel

1. Push your code to GitHub (see GitHub Push Instructions below)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click **"Deploy"**
7. Wait for deployment to complete
8. Your app will be live at a `.vercel.app` domain

### Environment Variables in Vercel

1. In your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add your Supabase credentials:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key
4. Click **"Save"**
5. Redeploy your project if needed

## GitHub Push Instructions

### Initial Push

If this is your first time pushing to the repository:

```bash
git init
git add .
git commit -m "Initial commit: Lumen chat application"
git branch -M main
git remote add origin https://github.com/markjones22347-ops/lumen-chat.git
git push -u origin main
```

### Using GitHub CLI (if installed)

```bash
gh auth login
gh repo set-default markjones22347-ops/lumen-chat
git add .
git commit -m "Initial commit: Lumen chat application"
git push -u origin main
```

### Subsequent Pushes

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

### Issue: "Cannot find module 'next'" or similar errors

**Solution**: Install dependencies:
```bash
npm install
```

### Issue: Realtime not working

**Solution**: 
1. Check that realtime is enabled for both `messages` and `events` tables in Supabase
2. Verify your Supabase URL and anon key are correct in `.env.local`
3. Restart your development server

### Issue: Image uploads failing

**Solution**:
1. Verify the `stickers` bucket exists in Supabase Storage
2. Make sure the bucket is set to public
3. Check that you have the correct storage permissions

### Issue: Messages not appearing

**Solution**:
1. Check the browser console for errors
2. Verify the SQL schema was run correctly
3. Check that you're a member of the group you're trying to view messages from

### Issue: "Database error: relation 'users' does not exist"

**Solution**: The SQL schema wasn't run. Follow the "Running SQL Schema" section above.

### Issue: CORS errors when uploading images

**Solution**: This is usually resolved by making the storage bucket public. If issues persist, check Supabase Storage CORS settings.

### Issue: Environment variables not loading

**Solution**:
1. Make sure your file is named `.env.local` (not `.env.example`)
2. Restart your development server after adding environment variables
3. Verify the variable names match exactly (case-sensitive)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Key Dependencies

- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers
- `lucide-react` - Icon library
- `date-fns` - Date formatting
- `react-hot-toast` - Toast notifications
- `emoji-picker-react` - Emoji picker
- `clsx` - Conditional className utility

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
3. Open an issue on GitHub

---

**Built with ❤️ using Next.js and Supabase**
