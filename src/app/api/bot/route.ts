import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption, CaptionStyle } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';
import { FACEBOOK_CONFIG } from '@/lib/config';

// In-memory store
let scheduledPosts: any[] = [];
let botInterval: NodeJS.Timeout | null = null;
let postHistory: any[] = [];
let postedImageUrls: string[] = [];
let currentRhythmIndex = 0;

// Rhythm: hentai → anime → komik → repeat
const POSTING_RHYTHM: ('hentai' | 'anime' | 'komik')[] = ['hentai', 'anime', 'komik'];

let botStats = {
  totalPosts: 0,
  successfulPosts: 0,
  failedPosts: 0,
  lastPostTime: null as string | null,
  nextPostTime: null as string | null,
};

function getNextCategory(): 'hentai' | 'anime' | 'komik' {
  return POSTING_RHYTHM[currentRhythmIndex % POSTING_RHYTHM.length];
}

function advanceRhythm() {
  currentRhythmIndex = (currentRhythmIndex + 1) % POSTING_RHYTHM.length;
}

function isImagePosted(url: string): boolean {
  return postedImageUrls.includes(url);
}

function addPostedImage(url: string) {
  postedImageUrls.push(url);
  // Keep only last 500
  if (postedImageUrls.length > 500) {
    postedImageUrls = postedImageUrls.slice(-500);
  }
}

function addToHistory(post: any) {
  postHistory.unshift(post);
  // Keep only last 100
  if (postHistory.length > 100) {
    postHistory = postHistory.slice(0, 100);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings, postData } = body;
    
    switch (action) {
      case 'start':
        return startBot(settings);
      case 'stop':
        return stopBot();
      case 'status':
        return getBotStatus();
      case 'post-now':
        return postNow(postData);
      case 'schedule':
        return schedulePostAction(postData);
      case 'get-scheduled':
        return getScheduledPosts();
      case 'remove-scheduled':
        return removeScheduledPost(postData?.id);
      case 'get-history':
        return NextResponse.json({ success: true, data: postHistory });
      case 'delete-history':
        return deleteFromHistory(postData?.id);
      case 'clear-history':
        postHistory = [];
        return NextResponse.json({ success: true, message: 'History cleared' });
      case 'delete-post':
        return deletePost(postData?.postId);
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Bot API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Bot operation failed' }, { status: 500 });
  }
}

async function startBot(settings: any) {
  if (botInterval) {
    return NextResponse.json({ success: false, error: 'Bot is already running' });
  }
  
  const intervalMs = (settings?.postInterval || 60) * 60 * 1000;
  const nextPost = new Date(Date.now() + intervalMs);
  botStats.nextPostTime = nextPost.toISOString();
  
  botInterval = setInterval(async () => {
    try {
      await autoPost(settings);
      botStats.nextPostTime = new Date(Date.now() + intervalMs).toISOString();
    } catch (error) {
      console.error('Auto post error:', error);
    }
  }, intervalMs);
  
  // First post immediately
  try {
    await autoPost(settings);
    botStats.nextPostTime = new Date(Date.now() + intervalMs).toISOString();
  } catch (error) {
    console.error('Initial post error:', error);
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Bot started successfully',
    interval: settings?.postInterval || 60,
    pageName: FACEBOOK_CONFIG.PAGE_NAME,
  });
}

function stopBot() {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
    botStats.nextPostTime = null;
  }
  return NextResponse.json({ success: true, message: 'Bot stopped' });
}

function getBotStatus() {
  return NextResponse.json({ 
    success: true, 
    data: {
      isRunning: !!botInterval,
      scheduledPostsCount: scheduledPosts.length,
      stats: botStats,
      pageName: FACEBOOK_CONFIG.PAGE_NAME,
      pageId: FACEBOOK_CONFIG.PAGE_ID,
      postHistory: postHistory.slice(0, 10), // Last 10 for dashboard
      currentRhythm: getNextCategory(),
    }
  });
}

async function autoPost(settings: any) {
  // Get category based on rhythm
  const category = getNextCategory();
  console.log(`[AutoPost] Rhythm category: ${category}`);
  
  // Try to get unique image (max 10 attempts)
  let imageResult = null;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    imageResult = await getRandomImage(category);
    if (imageResult && !isImagePosted(imageResult.url)) {
      break;
    }
    console.log(`[AutoPost] Image already posted or not found, retrying... (${attempts + 1}/${maxAttempts})`);
    attempts++;
    imageResult = null;
  }
  
  if (!imageResult) {
    const errorMsg = 'No unique image found after multiple attempts';
    console.error(`[AutoPost] ${errorMsg}`);
    
    // Add to history as failed
    addToHistory({
      id: `history_${Date.now()}`,
      category,
      imageUrl: '',
      title: 'Unknown',
      caption: '',
      status: 'failed',
      error: errorMsg,
      postedAt: new Date().toISOString(),
    });
    
    botStats.totalPosts++;
    botStats.failedPosts++;
    throw new Error(errorMsg);
  }
  
  console.log(`[AutoPost] Image found: ${imageResult.title}`);
  console.log(`[AutoPost] Image URL: ${imageResult.url}`);
  
  // Generate caption with Jaksel style
  const caption = await generateCaption({
    title: imageResult.title,
    description: imageResult.description || '',
    category: category,
    style: 'jaksel', // Always use Jaksel style
    includeHashtags: settings?.includeHashtags !== false,
    customHashtags: settings?.customHashtags || ['Weebnesia', 'AnimeIndonesia'],
  });
  
  console.log(`[AutoPost] Caption generated: ${caption.substring(0, 100)}...`);
  
  // Post to Facebook
  const result = await postToWeebnesia(imageResult.url, caption);
  
  const historyEntry = {
    id: `history_${Date.now()}`,
    category,
    imageUrl: imageResult.url,
    title: imageResult.title,
    caption,
    status: result.success ? 'success' : 'failed',
    error: result.error,
    facebookPostId: result.id,
    postedAt: new Date().toISOString(),
  };
  
  addToHistory(historyEntry);
  
  if (result.success) {
    addPostedImage(imageResult.url);
    advanceRhythm(); // Move to next category in rhythm
    botStats.totalPosts++;
    botStats.successfulPosts++;
    botStats.lastPostTime = new Date().toISOString();
    console.log(`[AutoPost] Posted successfully! Post ID: ${result.id}`);
    console.log(`[AutoPost] Next category will be: ${getNextCategory()}`);
  } else {
    botStats.totalPosts++;
    botStats.failedPosts++;
    console.error(`[AutoPost] Failed to post: ${result.error}`);
    throw new Error(result.error);
  }
  
  return { postId: result.id, imageUrl: imageResult.url, caption, historyEntry };
}

async function postNow(postData: any) {
  if (!postData?.imageUrl || !postData?.caption) {
    return NextResponse.json({ success: false, error: 'Image URL and caption are required' }, { status: 400 });
  }
  
  try {
    console.log('[PostNow] Posting to Weebnesia...');
    const result = await postToWeebnesia(postData.imageUrl, postData.caption);
    
    const historyEntry = {
      id: `history_${Date.now()}`,
      category: postData.category || 'anime',
      imageUrl: postData.imageUrl,
      title: postData.title || 'Manual Post',
      caption: postData.caption,
      status: result.success ? 'success' : 'failed',
      error: result.error,
      facebookPostId: result.id,
      postedAt: new Date().toISOString(),
    };
    
    addToHistory(historyEntry);
    
    if (result.success) {
      addPostedImage(postData.imageUrl);
      botStats.totalPosts++;
      botStats.successfulPosts++;
      botStats.lastPostTime = new Date().toISOString();
      
      return NextResponse.json({ 
        success: true, 
        data: { postId: result.id, historyEntry } 
      });
    } else {
      botStats.totalPosts++;
      botStats.failedPosts++;
      
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    botStats.failedPosts++;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function deletePost(postId: string) {
  return NextResponse.json({ 
    success: false, 
    error: 'Delete from Facebook requires additional permissions' 
  });
}

function deleteFromHistory(id: string) {
  postHistory = postHistory.filter(p => p.id !== id);
  return NextResponse.json({ success: true, message: 'Deleted from history' });
}

function schedulePostAction(postData: any) {
  if (!postData?.imageUrl || !postData?.caption || !postData?.scheduledTime) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }
  
  const newPost = {
    id: `post_${Date.now()}`,
    ...postData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  scheduledPosts.push(newPost);
  return NextResponse.json({ success: true, data: newPost });
}

function getScheduledPosts() {
  return NextResponse.json({ success: true, data: scheduledPosts });
}

function removeScheduledPost(id: string) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
  }
  scheduledPosts = scheduledPosts.filter(post => post.id !== id);
  return NextResponse.json({ success: true, message: 'Post removed' });
}
