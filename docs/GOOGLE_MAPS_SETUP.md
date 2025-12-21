# Google Maps API Setup for Address Autocomplete

The address autocomplete feature requires a Google Maps API key. Follow these steps to set it up:

## Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (required for autocomplete)
   - **Geocoding API** (required for address to coordinates conversion)
   - **Maps SDK for iOS** (if using iOS)
   - **Maps SDK for Android** (if using Android)

4. Create an API key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key

## Step 2: Configure the API Key

### Option 1: For Development (Quick Start)

Edit `constants/config.ts` and replace the placeholder:

```typescript
export const GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

### Option 2: For Production (Recommended)

Use environment variables or Expo's secure storage.

**IMPORTANT:** Never commit your actual API key to git! Add `constants/config.ts` to `.gitignore`.

## Step 3: Restrict Your API Key (Recommended)

1. Go to your API key in Google Cloud Console
2. Click **Edit API Key**
3. Under **API restrictions**, select **Restrict key**
4. Choose the APIs you enabled above
5. Under **Application restrictions**, add your app's bundle ID or package name

## Step 4: Test the Autocomplete

1. Make sure you've updated the API key in `constants/config.ts`
2. Restart the Expo app (`npm start` and reload)
3. Navigate to Add Garage Sale
4. Start typing in the address field
5. You should see address suggestions appear

## Troubleshooting

### No suggestions appear:
- Check the console for API errors
- Verify the API key is correct
- Make sure Places API is enabled in Google Cloud Console
- Check if you have billing enabled (Google requires it even for free tier)

### "This API project is not authorized to use this API" error:
- Enable the Places API in your Google Cloud project
- Wait a few minutes for changes to propagate

### "REQUEST_DENIED" error:
- Check API restrictions in Google Cloud Console
- Make sure your app's package name/bundle ID is allowed

## API Usage and Billing

- Google provides $200 free credit per month
- Places Autocomplete costs $2.83 per 1,000 requests (after free tier)
- Geocoding costs $5.00 per 1,000 requests (after free tier)
- Set up billing alerts in Google Cloud Console to monitor usage

## Alternative: Manual Address Entry

If you don't want to set up Google Maps API immediately, users can:
1. Type the address manually in the field
2. Click "Use Current Location" button
3. The app will geocode the address when submitting (using Expo's built-in geocoding)
