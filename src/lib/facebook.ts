import axios from 'axios';

interface FacebookPostOptions {
  pageId: string;
  accessToken: string;
  message: string;
  imageUrl?: string;
  link?: string;
}

interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

// Post to Facebook Page
export async function postToFacebookPage(options: FacebookPostOptions): Promise<FacebookPostResponse> {
  const { pageId, accessToken, message, imageUrl, link } = options;
  
  try {
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}`;
    let postData: Record<string, string> = {
      access_token: accessToken,
      message,
    };
    
    if (imageUrl) {
      // Post with image
      endpoint += '/photos';
      postData.url = imageUrl;
    } else if (link) {
      // Post with link
      endpoint += '/feed';
      postData.link = link;
    } else {
      // Text only post
      endpoint += '/feed';
    }
    
    const response = await axios.post(endpoint, postData);
    
    return {
      id: response.data.id,
      post_id: response.data.post_id || response.data.id,
    };
  } catch (error: any) {
    console.error('Error posting to Facebook:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to post to Facebook');
  }
}

// Upload photo to Facebook Page
export async function uploadPhotoToFacebook(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        url: imageUrl,
        message: caption,
        access_token: accessToken,
      }
    );
    
    return response.data.id;
  } catch (error: any) {
    console.error('Error uploading photo to Facebook:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to upload photo');
  }
}

// Get Page Access Token from User Token (for setup)
export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'access_token',
          access_token: userAccessToken,
        },
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting page access token:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get page access token');
  }
}

// Get list of managed pages
export async function getManagedPages(userAccessToken: string): Promise<any[]> {
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: {
          access_token: userAccessToken,
        },
      }
    );
    
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error getting managed pages:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get managed pages');
  }
}

// Verify Page Access Token
export async function verifyPageToken(
  pageId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'id,name,access_token',
          access_token: accessToken,
        },
      }
    );
    
    return !!response.data.id;
  } catch (error) {
    console.error('Error verifying page token:', error);
    return false;
  }
}

// Get Page Info
export async function getPageInfo(
  pageId: string,
  accessToken: string
): Promise<{ id: string; name: string; picture?: string } | null> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'id,name,picture',
          access_token: accessToken,
        },
      }
    );
    
    return {
      id: response.data.id,
      name: response.data.name,
      picture: response.data.picture?.data?.url,
    };
  } catch (error) {
    console.error('Error getting page info:', error);
    return null;
  }
}

// Schedule a post (Facebook's native scheduling)
export async function schedulePost(
  pageId: string,
  accessToken: string,
  message: string,
  imageUrl: string,
  scheduledPublishTime: number // Unix timestamp
): Promise<string> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        url: imageUrl,
        message: message,
        published: false,
        scheduled_publish_time: scheduledPublishTime,
        access_token: accessToken,
      }
    );
    
    return response.data.id;
  } catch (error: any) {
    console.error('Error scheduling post:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to schedule post');
  }
}
