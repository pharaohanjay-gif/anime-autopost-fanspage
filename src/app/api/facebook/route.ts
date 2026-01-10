import { NextRequest, NextResponse } from 'next/server';
import { postToWeebnesia, postTextToWeebnesia, verifyToken, getPageInfo } from '@/lib/weebnesia';
import { FACEBOOK_CONFIG } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, imageUrl } = body;
    
    switch (action) {
      case 'verify':
        const tokenCheck = await verifyToken();
        return NextResponse.json({ 
          success: true, 
          data: { 
            valid: tokenCheck.valid,
            error: tokenCheck.error,
            pageName: FACEBOOK_CONFIG.PAGE_NAME,
            pageId: FACEBOOK_CONFIG.PAGE_ID,
          } 
        });
      
      case 'info':
        const pageInfo = await getPageInfo();
        return NextResponse.json({ 
          success: true, 
          data: pageInfo 
        });
      
      case 'post':
        if (!message) {
          return NextResponse.json({ 
            success: false, 
            error: 'Message is required for posting' 
          }, { status: 400 });
        }
        
        let postResult;
        if (imageUrl) {
          postResult = await postToWeebnesia(imageUrl, message);
        } else {
          postResult = await postTextToWeebnesia(message);
        }
        
        if (!postResult.success) {
          return NextResponse.json({ 
            success: false, 
            error: postResult.error 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          success: true, 
          data: postResult 
        });
      
      case 'photo':
        if (!imageUrl || !message) {
          return NextResponse.json({ 
            success: false, 
            error: 'Image URL and message are required' 
          }, { status: 400 });
        }
        
        const photoResult = await postToWeebnesia(imageUrl, message);
        
        if (!photoResult.success) {
          return NextResponse.json({ 
            success: false, 
            error: photoResult.error 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          success: true, 
          data: { id: photoResult.id } 
        });
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Facebook API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pageInfo = await getPageInfo();
    const tokenCheck = await verifyToken();
    
    return NextResponse.json({
      success: true,
      data: {
        connected: tokenCheck.valid,
        pageName: FACEBOOK_CONFIG.PAGE_NAME,
        pageId: FACEBOOK_CONFIG.PAGE_ID,
        pageInfo,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
