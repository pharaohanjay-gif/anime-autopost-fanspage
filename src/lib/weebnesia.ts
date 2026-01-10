import axios from 'axios';
import { FACEBOOK_CONFIG } from './config';

interface FacebookPostResponse {
  id: string;
  post_id?: string;
  success: boolean;
  error?: string;
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
