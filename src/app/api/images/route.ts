import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchLatestAnime, 
  fetchPopularAnime, 
  fetchTrendingAnime,
  fetchLatestKomik,
  fetchPopularKomik,
  fetchRecentHentai,
  getRandomImage 
} from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'anime';
  const type = searchParams.get('type') || 'latest';
  const random = searchParams.get('random') === 'true';
  
  try {
    if (random) {
      const result = await getRandomImage(category as 'anime' | 'komik' | 'hentai');
      if (!result) {
        return NextResponse.json({ 
          success: false, 
          error: 'No images found' 
        }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result });
    }
    
    let data: any[] = [];
    
    switch (category) {
      case 'anime':
        if (type === 'popular') {
          data = await fetchPopularAnime();
        } else if (type === 'trending') {
          data = await fetchTrendingAnime();
        } else {
          data = await fetchLatestAnime();
        }
        break;
      
      case 'komik':
        if (type === 'popular') {
          data = await fetchPopularKomik();
        } else {
          data = await fetchLatestKomik();
        }
        break;
      
      case 'hentai':
        data = await fetchRecentHentai();
        break;
      
      default:
        data = await fetchLatestAnime();
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      count: data.length 
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    }, { status: 500 });
  }
}
