import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// X (Twitter) API Configuration
const X_CONFIG = {
  API_KEY: process.env.X_API_KEY || '',
  API_SECRET: process.env.X_API_SECRET || '',
  ACCESS_TOKEN: process.env.X_ACCESS_TOKEN || '',
  ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET || '',
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
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Error downloading image:', error.message);
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
      console.log('Image downloaded, uploading to X...');
      
      // Upload media first
      const mediaId = await client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg',
      });
      
      console.log('Media uploaded, ID:', mediaId);
      
      // Post tweet with media
      const tweet = await client.v2.tweet({
        text: tweetText,
        media: {
          media_ids: [mediaId],
        },
      });
      
      console.log('Tweet posted successfully:', tweet.data.id);
      
      return {
        id: tweet.data.id,
        success: true,
      };
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
