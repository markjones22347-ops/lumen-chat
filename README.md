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

## Render Deployment

Render is a cloud platform that offers free hosting for web services, static sites, and databases. This guide will walk you through deploying Lumen to Render.

### Prerequisites

Before deploying to Render, make sure you have:
- A GitHub account with your code pushed to GitHub
- A Supabase project set up with the database schema completed
- Your Supabase project URL and anon key ready

### Step 1: Create a Render Account

1. Go to [https://render.com](https://render.com)
2. Click the **"Sign Up"** button in the top right
3. Sign up using your GitHub account (recommended) or email
4. Complete the account setup process
5. You may need to verify your email address

### Step 2: Connect Your GitHub Repository

1. After signing in, you'll be taken to your Render dashboard
2. Click the **"New +"** button in the top right
3. Select **"Web Service"** from the dropdown
4. If prompted, authorize Render to access your GitHub repositories
5. You'll see a list of your GitHub repositories

### Step 3: Select Your Repository

1. Find and select the `lumen-chat` repository (or your repository name)
2. If you don't see it, click **"Connect a different repository"** and search for it
3. Make sure you're selecting the correct repository

### Step 4: Configure the Web Service

Render will automatically detect that this is a Next.js application. Configure the following settings:

**Name:**
- Enter a name for your service (e.g., `lumen-chat`)
- This will be part of your deployment URL: `https://lumen-chat.onrender.com`

**Region:**
- Select a region closest to your users
- Common choices: Oregon (US), Frankfurt (EU), Singapore (Asia)
- This affects latency but not functionality

**Branch:**
- Select `main` (or your default branch)
- Render will deploy from this branch

**Runtime:**
- Render should automatically detect **Node.js**
- If not, select **Node** from the dropdown
- Set the Node version to `18` or higher

**Build Command:**
- Render should auto-detect: `npm run build`
- If not, enter: `npm run build`

**Start Command:**
- Render should auto-detect: `npm start`
- If not, enter: `npm start`

**Root Directory:**
- Leave this blank (root of the repository)

### Step 5: Add Environment Variables

This is a critical step. Your Supabase credentials must be added as environment variables.

1. Scroll down to the **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add the first variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - Click **"Save"**
4. Add the second variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key (long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Click **"Save"**

**Important Notes:**
- Make sure the variable names match exactly (case-sensitive)
- Do not include quotes around the values
- These are the same values you used in `.env.local` locally

### Step 6: Configure Advanced Settings (Optional)

**Instance Type:**
- **Free**: Free tier (recommended for testing)
  - Limited resources, may have cold starts
  - Spins down after 15 minutes of inactivity
  - Can take up to 30 seconds to wake up
- **Standard**: Paid tier ($7/month starting)
  - Better performance
  - No cold starts
  - Suitable for production

**Environment:**
- Leave as **Production** for live deployment

### Step 7: Deploy the Application

1. Review all your settings
2. Click the **"Create Web Service"** button at the bottom
3. Render will begin the deployment process
4. You'll see a live log of the deployment progress

### Step 8: Monitor Deployment

The deployment process typically takes 2-5 minutes and includes:
1. Cloning your repository
2. Installing dependencies (`npm install`)
3. Building the application (`npm run build`)
4. Starting the server (`npm start`)

You can monitor the progress in the **"Logs"** tab. Look for:
- Green checkmarks for successful steps
- Any red error messages that need attention

### Step 9: Access Your Application

Once deployment is complete:
1. You'll see a success message
2. Click on the URL provided (e.g., `https://lumen-chat.onrender.com`)
3. Your Lumen chat application should now be live!

### Step 10: Verify the Deployment

1. Test the home page loads correctly
2. Try creating a group
3. Test the chat functionality
4. Test the calendar feature
5. Test sticker uploads

### Automatic Deploys

Render can automatically redeploy when you push changes to GitHub:

1. Go to your web service in Render
2. Click on the **"Events"** tab
3. Automatic deploys are enabled by default
4. When you push to the connected branch, Render will:
   - Detect the new commit
   - Automatically build and deploy
   - Update your live application

To disable automatic deploys:
1. Go to **Settings** → **Build & Deploy**
2. Toggle off **"Auto-Deploy"**

### Manual Deploys

To manually trigger a deploy:
1. Go to your web service in Render
2. Click the **"Manual Deploy"** button in the top right
3. Select **"Clear build cache & deploy"** (recommended for major changes)
4. Or select **"Deploy latest commit"** for quick updates

### Custom Domain (Optional)

To use a custom domain instead of the default `.onrender.com` URL:

1. Go to your web service in Render
2. Click on **Settings** → **Custom Domains**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `chat.yourdomain.com`)
5. Follow the DNS instructions provided by Render
6. Update your domain's DNS records as instructed
7. Wait for DNS propagation (can take up to 24 hours)

### Viewing Logs

To view application logs:
1. Go to your web service in Render
2. Click on the **"Logs"** tab
3. You'll see real-time logs from your application
4. Common logs to check:
   - Build logs (during deployment)
   - Server logs (runtime errors)
   - Access logs (incoming requests)

### Scaling Your Application

If you need more resources:

1. Go to your web service in Render
2. Click on **Settings** → **Scaling**
3. Adjust the following:
   - **Instance Type**: Upgrade to Standard or Pro
   - **Min Instances**: Minimum number of instances running
   - **Max Instances**: Maximum number of instances (auto-scaling)
   - **RAM**: Increase memory allocation
   - **CPU**: Increase CPU allocation

### Render Free Tier Limitations

The free tier has some limitations:
- **Cold Starts**: Service spins down after 15 minutes of inactivity
- **Wake-up Time**: Can take 10-30 seconds to respond after being idle
- **Build Time**: Longer build times (up to 15 minutes)
- **Resource Limits**: Limited CPU and RAM
- **Disk Space**: Limited disk storage

For production use, consider upgrading to the Standard tier.

### Troubleshooting Render Deployment

**Issue: Build fails with "Cannot find module 'next'"**

**Solution**: Make sure `package.json` includes all dependencies. Render runs `npm install` during build.

**Issue: Environment variables not working**

**Solution**:
1. Check that variable names match exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Make sure values don't have extra quotes or spaces
3. After adding variables, you may need to redeploy

**Issue: Application shows "404 Not Found"**

**Solution**:
1. Check the build logs for errors
2. Make sure the build command is `npm run build`
3. Make sure the start command is `npm start`
4. Verify Next.js is building correctly

**Issue: Realtime not working on Render**

**Solution**:
1. Verify Supabase realtime is enabled for `messages` and `events` tables
2. Check that your Supabase URL is correct (no typos)
3. Ensure your anon key is correct
4. Check browser console for WebSocket errors

**Issue: Slow performance / cold starts**

**Solution**:
1. This is normal on the free tier
2. Upgrade to Standard tier for better performance
3. Consider using a cron job to keep the service warm

**Issue: Deployment stuck in "Building" state**

**Solution**:
1. Check the build logs for specific errors
2. Try "Clear build cache & deploy"
3. Check if dependencies are correct in `package.json`
4. Verify Node version compatibility

**Issue: Sticker uploads failing**

**Solution**:
1. Verify Supabase Storage bucket is set to public
2. Check that environment variables are set correctly
3. Check browser console for CORS errors
4. Verify the bucket name is exactly `stickers`

### Render vs Vercel Comparison

| Feature | Render | Vercel |
|---------|--------|--------|
| Free Tier | Yes (with limitations) | Yes (generous) |
| Cold Starts | Yes (free tier) | No |
| Build Time | Slower (free) | Fast |
| Edge Functions | Limited | Excellent |
| Custom Domains | Free | Free |
| SSL Certificates | Free | Free |
| Analytics | Basic | Advanced |
| Preview Deployments | Manual | Automatic |
| Next.js Support | Good | Excellent |

### Production Checklist

Before going live on Render:

- [ ] Supabase project is fully set up with database schema
- [ ] Realtime is enabled for `messages` and `events` tables
- [ ] Storage bucket `stickers` is created and public
- [ ] Environment variables are correctly set in Render
- [ ] Test all features: chat, calendar, stickers
- [ ] Verify realtime updates work across multiple browsers
- [ ] Check for any console errors in the browser
- [ ] Set up monitoring/alerts if using paid tier
- [ ] Consider setting up a custom domain
- [ ] Document your deployment process for future updates

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
