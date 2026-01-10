import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCaption, 
  generateCaptionFromImage, 
  analyzeImageAndGenerateCaption,
  CaptionStyle 
} from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      imageUrl, 
      category = 'anime', 
      style = 'otaku',
      includeHashtags = true,
      customHashtags = [],
      analyze = false 
    } = body;
    
    if (!title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title is required' 
      }, { status: 400 });
    }
    
    let result;
    
    if (analyze && imageUrl) {
      // Analyze image and generate caption with suggestions
      result = await analyzeImageAndGenerateCaption(
        imageUrl,
        title,
        description || '',
        category as 'anime' | 'komik' | 'hentai',
        style as CaptionStyle
      );
      
      return NextResponse.json({ 
        success: true, 
        data: result 
      });
    } else {
      // Generate simple caption
      const caption = await generateCaption({
        title,
        description,
        category: category as 'anime' | 'komik' | 'hentai',
        style: style as CaptionStyle,
        includeHashtags,
        customHashtags,
      });
      
      return NextResponse.json({ 
        success: true, 
        data: { caption } 
      });
    }
  } catch (error: any) {
    console.error('Caption Generation Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate caption' 
    }, { status: 500 });
  }
}
