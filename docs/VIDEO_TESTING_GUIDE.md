# 🎬 Video Feature Testing Guide

## Quick Test Setup

I've created a dedicated test screen to verify the video feature works end-to-end!

---

## 🚀 How to Test

### Step 1: Prerequisites

Before testing, make sure you've completed:

#### A. Database Migration
Run this in Supabase SQL Editor:
```sql
ALTER TABLE garage_sales ADD COLUMN IF NOT EXISTS video_url TEXT;
CREATE INDEX IF NOT EXISTS garage_sales_video_idx ON garage_sales (video_url);
```

#### B. Create Storage Bucket
1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `garage-sale-videos`
4. Check **Public bucket** ✓
5. Click **Create bucket**

### Step 2: Access Test Screen

1. **Run the app** on a **real device** (camera doesn't work in simulator)
   ```bash
   npm run ios
   # or
   npm run android
   ```

2. You'll see a **🎬 button** in the top-right of the map screen

3. Tap the **🎬 button** to open the test screen

### Step 3: Run the Test

On the test screen, you'll see:
- Instructions for the test workflow
- A big **"🎬 Start Test"** button

**Tap "Start Test"** and the test will:

1. ✅ Open camera with countdown (3-2-1)
2. ✅ Auto-record 5-second video
3. ✅ Show preview with "Use Video" button
4. ✅ Extract frames from video
5. ✅ Call Claude API for analysis
6. ✅ Upload video to Supabase Storage
7. ✅ Display results

### Step 4: Verify Results

After the test completes, you'll see:

```
✅ Test Results:

Title: [AI-generated title]
Description: [AI-generated description]
Categories: [AI-detected categories]
Video URL: https://gfkqmaupmuhxavkfyjbb.supabase.co/storage/v1/object/public/garage-sale-videos/[filename].mp4
```

---

## 📋 What Gets Tested

| Step | What It Tests | Expected Result |
|------|---------------|-----------------|
| Camera Access | Permissions & camera API | Camera opens, countdown shows |
| Video Recording | Video capture | 5-second video recorded |
| Frame Extraction | Image manipulation | Thumbnail generated |
| Claude API | AI analysis | Title, description, categories returned |
| Supabase Upload | Storage integration | Video URL returned |
| Full Workflow | End-to-end | All steps complete successfully |

---

## 🎯 Success Criteria

✅ **Test Passed** if you see:
- Camera opens and records
- "Analyzing with AI..." appears
- Alert shows AI-generated content
- Video URL is displayed
- No errors in console

❌ **Test Failed** if:
- Camera permission denied → Check device settings
- "Failed to upload video" → Check storage bucket exists
- "Failed to analyze" → Check Claude API key
- Network error → Check internet connection

---

## 🐛 Troubleshooting

### Camera Won't Open
- **Cause**: No permission or using simulator
- **Fix**: Test on real device, grant camera permission in Settings

### "Failed to upload video"
- **Cause**: Storage bucket doesn't exist or isn't public
- **Fix**:
  1. Go to Supabase → Storage
  2. Create `garage-sale-videos` bucket
  3. Make it public

### "Failed to analyze video"
- **Cause**: Claude API error
- **Fix**:
  1. Check API key in `lib/claude.ts`
  2. Check you have free credits ($5 free)
  3. Check network connection

### "Database error"
- **Cause**: Missing video_url column
- **Fix**: Run the SQL migration (Step 1A above)

---

## 📊 Console Logs

While testing, watch the console for:

```
Video recorded: file:///path/to/video.mp4
Generated test frame
Analyzing with Claude...
Analysis result: { title: '...', description: '...', categories: [...] }
Uploading video to Supabase...
Video uploaded: https://...
```

---

## 🎥 What to Record

For best results, record a video showing:
- Various items laid out
- Good lighting
- Steady camera (not shaky)
- Clear view of items

**Examples:**
- ✅ Items on table/ground
- ✅ Close-up of items
- ✅ Well-lit area
- ❌ Dark/blurry video
- ❌ No items visible
- ❌ Too much camera movement

---

## 💰 API Usage

Each test uses:
- **Claude API**: ~$0.01-0.02 per analysis
- **Your $5 free credits**: ~250-500 tests
- **Supabase Storage**: ~5-10MB per video

---

## ✅ Next Steps After Successful Test

Once the test passes:

1. **Integrate into main form**
   - Add VideoRecorder to `add-garage-sale.tsx`
   - Auto-fill form with Claude results
   - Include video URL when submitting

2. **Enhance frame extraction**
   - Extract multiple frames at different timestamps
   - Improve thumbnail quality
   - Add loading states

3. **Add video playback**
   - Show video thumbnail on map markers
   - Play video in detail modal
   - Add video controls

4. **Production ready**
   - Add error recovery
   - Add retry logic
   - Add analytics

---

## 🔄 Testing Different Scenarios

### Scenario 1: Furniture Sale
Record: Couch, chairs, table
Expected: Categories include "furniture"

### Scenario 2: Electronics Sale
Record: Laptops, phones, gadgets
Expected: Categories include "electronics"

### Scenario 3: Multi-Category Sale
Record: Mix of items
Expected: Multiple categories detected

---

## 📱 Test Screen Features

The test screen (`/test-video`) includes:
- ✅ Step-by-step workflow display
- ✅ Real-time status updates
- ✅ Results display
- ✅ Error handling
- ✅ Requirements checklist

---

## 🎉 Success!

If everything works, you've successfully:
- ✅ Integrated Claude AI
- ✅ Set up video recording
- ✅ Connected Supabase Storage
- ✅ Completed end-to-end workflow

**You're ready to integrate this into the main app!**

---

## 📝 Quick Reference

**Test Screen Path**: `/test-video`
**Access**: Tap 🎬 button on map
**Requirements**: Real device, SQL migration, storage bucket
**API Key**: Configured in `lib/claude.ts`
**Storage Bucket**: `garage-sale-videos` (public)

---

## Need Help?

Check these files:
- `app/test-video.tsx` - Test screen code
- `components/VideoRecorder.tsx` - Camera component
- `lib/claude.ts` - AI analysis
- `services/videoService.ts` - Upload service

Or check the console logs for detailed error messages!
