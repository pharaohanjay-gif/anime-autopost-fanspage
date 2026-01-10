import axios from 'axios';
import FormData from 'form-data';
import { FACEBOOK_CONFIG } from './config';

interface FacebookPostResponse {
  id: string;
  post_id?: string;
  success: boolean;
  error?: string;
}

// Download image and convert to buffer
async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log('Downloading image from:', imageUrl);
    
    // Check if image is from protected domain
    const isProtectedDomain = imageUrl.includes('hanime') || 
                               imageUrl.includes('htv-services') ||
                               imageUrl.includes('hanime-cdn');
    
    let response;
    if (isProtectedDomain) {
      console.log('Protected domain detected, using special headers...');
      // Use special headers to bypass hotlink protection
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://hanime.tv/',
          'Origin': 'https://hanime.tv',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'image',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-site': 'cross-site',
        },
        timeout: 30000,
      });
    } else {
      // For non-protected domains, download normally
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 30000,
      });
    }
    
    const buffer = Buffer.from(response.data);
    console.log('Image downloaded successfully, size:', buffer.length, 'bytes');
    console.log('Content-Type:', response.headers['content-type']);
    
    // Validate image buffer
    if (buffer.length === 0) {
      console.error('Downloaded image buffer is empty');
      return null;
    }
    
    return buffer;
  } catch (error: any) {
    console.error('Error downloading image:', error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    return null;
  }
}

// Post photo with caption to Weebnesia Facebook Page
export async function postToWeebnesia(
  imageUrl: string,
  caption: string
): Promise<FacebookPostResponse> {
  const { PAGE_ID, ACCESS_TOKEN, API_VERSION } = FACEBOOK_CONFIG;
  
  try {
    console.log('Posting to Weebnesia Facebook Page...');
    console.log('Image URL:', imageUrl);
    console.log('Caption length:', caption.length);
    
    // Check if image is from a protected domain
    const isProtectedDomain = imageUrl.includes('hanime') || 
                               imageUrl.includes('htv-services') ||
                               imageUrl.includes('hanime-cdn');
    
    if (isProtectedDomain) {
      console.log('Protected domain detected, downloading image first...');
      
      // Download image first
      const imageBuffer = await downloadImage(imageUrl);
      
      if (!imageBuffer) {
        console.error('Failed to download image from protected source');
        return {
          id: '',
          success: false,
          error: 'Failed to download image from protected source',
        };
      }
      
      console.log('Image downloaded, size:', imageBuffer.length, 'bytes');
      
      // Create form data with image buffer
      const formData = new FormData();
      formData.append('source', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });
      formData.append('message', caption);
      formData.append('access_token', ACCESS_TOKEN);
      
      console.log('Uploading to Facebook...');
      const response = await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/photos`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      
      console.log('Facebook API Response:', response.data);
      
      return {
        id: response.data.id,
        post_id: response.data.post_id || response.data.id,
        success: true,
      };
    }
    
    // For non-protected URLs, use direct URL posting
    const response = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/photos`,
      {
        url: imageUrl,
        message: caption,
        access_token: ACCESS_TOKEN,
      }
    );
    
    console.log('Facebook API Response:', response.data);
    
    return {
      id: response.data.id,
      post_id: response.data.post_id || response.data.id,
      success: true,
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error('Error posting to Facebook:', error.response?.data || error.message);
    
    return {
      id: '',
      success: false,
      error: errorMessage,
    };
  }
}

// Post text only to Weebnesia Facebook Page
export async function postTextToWeebnesia(message: string): Promise<FacebookPostResponse> {
  const { PAGE_ID, ACCESS_TOKEN, API_VERSION } = FACEBOOK_CONFIG;
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/feed`,
      {
        message: message,
        access_token: ACCESS_TOKEN,
      }
    );
    
    return {
      id: response.data.id,
      success: true,
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error('Error posting to Facebook:', error.response?.data || error.message);
    
    return {
      id: '',
      success: false,
      error: errorMessage,
    };
  }
}

// Verify if the token is still valid
export async function verifyToken(): Promise<{ valid: boolean; error?: string }> {
  const { PAGE_ID, ACCESS_TOKEN, API_VERSION } = FACEBOOK_CONFIG;
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}`,
      {
        params: {
          fields: 'id,name',
          access_token: ACCESS_TOKEN,
        },
      }
    );
    
    console.log('Token valid. Page:', response.data.name);
    return { valid: true };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error('Token verification failed:', errorMessage);
    return { valid: false, error: errorMessage };
  }
}

// Get page info
export async function getPageInfo(): Promise<any> {
  const { PAGE_ID, ACCESS_TOKEN, API_VERSION } = FACEBOOK_CONFIG;
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}`,
      {
        params: {
          fields: 'id,name,fan_count,followers_count',
          access_token: ACCESS_TOKEN,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error getting page info:', error.response?.data || error.message);
    return null;
  }
}
