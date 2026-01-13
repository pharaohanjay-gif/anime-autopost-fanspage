import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// X (Twitter) API Configuration - trim to remove any whitespace/newlines
const X_CONFIG = {
  API_KEY: (process.env.X_API_KEY || '').trim(),
  API_SECRET: (process.env.X_API_SECRET || '').trim(),
  ACCESS_TOKEN: (process.env.X_ACCESS_TOKEN || '').trim(),
  ACCESS_TOKEN_SECRET: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
};

interface XPostResponse {
  id: string;
  success: boolean;
  error?: string;
}

// Create Twitter client
function getTwitterClient(): TwitterApi {
  return new TwitterApi({
    appKey: X_CONFIG.API_KEY,
    appSecret: X_CONFIG.API_SECRET,
    accessToken: X_CONFIG.ACCESS_TOKEN,
    accessSecret: X_CONFIG.ACCESS_TOKEN_SECRET,
  });
}

// Download image and return buffer
async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log('Downloading image for X post:', imageUrl);
    
    // Try multiple user agents and referers
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://hanime.tv/',
    };
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers,
      timeout: 30000,
      maxRedirects: 5,
    });
    
    console.log('Image downloaded, size:', response.data.byteLength, 'bytes');
    
    if (response.data.byteLength < 1000) {
      console.error('Image too small, likely blocked or error');
      return null;
    }
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Error downloading image:', error.message);
    console.error('Image URL was:', imageUrl);
    return null;
  }
}

// Post to X with image
export async function postToX(
  imageUrl: string,
  caption: string
): Promise<XPostResponse> {
  try {
    console.log('Posting to X (@cutyHUB1982)...');
    console.log('Caption length:', caption.length);
    
    const client = getTwitterClient();
    
    // X has 280 character limit - truncate if needed
    let tweetText = caption;
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    // Download image
    const imageBuffer = await downloadImage(imageUrl);
    
    if (imageBuffer) {
      console.log('Image downloaded successfully, size:', imageBuffer.length, 'bytes');
      console.log('Uploading to X media endpoint...');
      
      try {
        // Upload media first using v1.1 API
        const mediaId = await client.v1.uploadMedia(imageBuffer, {
          mimeType: 'image/jpeg',
        });
        
        console.log('Media uploaded successfully, ID:', mediaId);
        
        // Post tweet with media - mark as NOT sensitive
        const tweet = await client.v2.tweet({
          text: tweetText,
          media: {
            media_ids: [mediaId],
          },
        });
        
        console.log('Tweet posted successfully with image:', tweet.data.id);
        
        return {
          id: tweet.data.id,
          success: true,
        };
      } catch (uploadError: any) {
        console.error('Media upload failed:', uploadError.message);
        console.error('Upload error details:', JSON.stringify(uploadError.data || uploadError, null, 2));
        
        // Fallback to text-only if media upload fails
        console.log('Falling back to text-only tweet...');
        const tweet = await client.v2.tweet({
          text: tweetText,
        });
        
        return {
          id: tweet.data.id,
          success: true,
          error: 'Posted without image: ' + uploadError.message,
        };
      }
    } else {
      // Post text-only tweet if image download failed
      console.log('Image download failed, posting text-only tweet...');
      
      const tweet = await client.v2.tweet({
        text: tweetText,
      });
      
      return {
        id: tweet.data.id,
        success: true,
      };
    }
  } catch (error: any) {
    console.error('Error posting to X:', error.message);
    console.error('Error details:', error.data || error);
    
    return {
      id: '',
      success: false,
      error: error.message,
    };
  }
}

// Post text-only to X
export async function postTextToX(text: string): Promise<XPostResponse> {
  try {
    const client = getTwitterClient();
    
    let tweetText = text;
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    const tweet = await client.v2.tweet({
      text: tweetText,
    });
    
    return {
      id: tweet.data.id,
      success: true,
    };
  } catch (error: any) {
    return {
      id: '',
      success: false,
      error: error.message,
    };
  }
}
