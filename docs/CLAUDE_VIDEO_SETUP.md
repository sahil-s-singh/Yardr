# Claude AI Video Analysis Setup

This guide will help you set up AI-powered video analysis for garage sale listings.

## Overview

Users can now record a 5-second video of their garage sale items, and Claude AI will automatically:
- Generate a catchy title
- Write a detailed description
- Detect item categories
- The video is stored and displayed on the map

## Step 1: Get Your Claude API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy your API key

### Pricing (As of 2025)
- **Free Credits**: New accounts get $5 in free credits
- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output tokens
- **Estimated cost**: ~$0.01-0.02 per video analysis
- **Free tier**: Enough for 250-500 video analyses

## Step 2: Configure the App

1. Open `lib/claude.ts`
2. Replace `YOUR_CLAUDE_API_KEY` with your actual API key:
   ```typescript
   const CLAUDE_API_KEY = 'sk-ant-api03-...';
   ```

## Step 3: Set Up Supabase Storage

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `garage-sale-videos`
4. Set to **Public bucket** (so videos can be displayed on the map)
5. Click **Save**

## Step 4: Update Database Schema

Run this SQL in your Supabase SQL Editor to add video URL support:

```sql
ALTER TABLE garage_sales
ADD COLUMN video_url TEXT;

CREATE INDEX garage_sales_video_idx ON garage_sales (video_url);
```

## How It Works

### User Flow:
1. User taps the "+" button
2. Camera opens with instructions
3. 3-second countdown begins
4. Records 5-second video automatically
5. User reviews the video
6. Claude AI analyzes the video:
   - Extracts 3 key frames
   - Sends to Claude API
   - Claude identifies items and generates content
7. Form auto-fills with AI-generated content
8. Video uploads to Supabase Storage
9. User adds date, time, and contact info
10. Submits and video appears on map!

### Technical Flow:
```
Video Recording → Frame Extraction → Claude API → Auto-fill Form
     ↓
Video Upload to Supabase Storage → Get Public URL → Save to Database
     ↓
Display on Map with Video Thumbnail
```

## Features

### Video Recorder Component
- 3-second countdown before recording
- Automatic 5-second recording
- Recording indicator
- Retake option
- Preview before use

### AI Analysis
- Uses Claude 3.5 Sonnet (latest model)
- Analyzes up to 3 frames from video
- Generates:
  - Catchy title (max 60 chars)
  - Detailed description (2-3 sentences)
  - Relevant categories

### Auto-fill
- Title field
- Description field
- Categories (auto-selected)
- User only needs to add:
  - Date & time
  - Contact information

## Privacy & Security

- Videos are stored in public Supabase bucket (read-only)
- API key should be kept secret
- Consider adding user authentication for better security
- Videos can be moderated before going live

## Cost Optimization

To reduce API costs:
- Extract only 3 frames (first, middle, last)
- Use image compression
- Cache results
- Add rate limiting

Current setup: ~$0.01 per analysis = 500 analyses per $5

## Troubleshooting

### Camera Permission Denied
- iOS: Settings → YourAppName → Enable Camera
- Android: Settings → Apps → YourAppName → Permissions → Camera

### "Failed to analyze video"
- Check API key is correct in `lib/claude.ts`
- Ensure you have remaining free credits
- Check network connection

### Video Won't Upload
- Verify Supabase Storage bucket is created
- Check bucket is set to public
- Verify Storage permissions in Supabase

### Poor AI Results
- Ensure good lighting when recording
- Keep items clearly visible
- Avoid fast camera movements
- Record from a steady position

## Next Steps

### Optional Enhancements:
1. **Better Frame Extraction**: Use react-native-video-processing
2. **Thumbnail Generation**: Create video thumbnails for map markers
3. **Video Player**: Add video playback in detail modal
4. **Moderation**: Add approval flow before publishing
5. **Image Fallback**: Allow photo upload if video fails

## Example API Usage

The Claude API call looks like this:

```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame1 }},
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame2 }},
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame3 }},
      { type: 'text', text: 'Analyze these garage sale items...' }
    ]
  }]
});
```

## Support

For issues with:
- **Claude API**: [Anthropic Support](https://support.anthropic.com)
- **Supabase**: [Supabase Docs](https://supabase.com/docs)
- **App Issues**: Check console logs and error messages
