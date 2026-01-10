import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HANIME_SEARCH_API = 'https://search.htv-services.com';

// Server-side proxy to avoid CORS issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchText = '', page = 0, tags = [], orderBy = 'created_at_unix' } = body;

    const response = await axios.post(HANIME_SEARCH_API, {
      blacklist: [],
      brands: [],
      order_by: orderBy,
      page: page,
      tags: tags,
      search_text: searchText,
      tags_mode: 'AND',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const hits = JSON.parse(response.data?.hits || '[]');

    const hentaiList = hits.slice(0, 20).map((item: any) => ({
      id: item.id,
      name: item.name,
      titles: item.titles || [],
      slug: item.slug,
      description: item.description || '',
      views: item.views,
      bannerImage: item.poster_url,
      coverImage: item.cover_url,
      cover_url: item.cover_url,
      poster_url: item.poster_url,
      brand: {
        name: item.brand,
        id: item.brand_id,
      },
      tags: item.tags || [],
      rating: item.rating,
    }));

    return NextResponse.json({
      success: true,
      data: hentaiList,
      count: hentaiList.length,
    });
  } catch (error: any) {
    console.error('Hentai API Proxy Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch hentai data',
      data: [],
    }, { status: 500 });
  }
}

// GET method for simple requests
export async function GET(request: NextRequest) {
  try {
    const response = await axios.post(HANIME_SEARCH_API, {
      blacklist: [],
      brands: [],
      order_by: 'created_at_unix',
      page: 0,
      tags: [],
      search_text: '',
      tags_mode: 'AND',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const hits = JSON.parse(response.data?.hits || '[]');

    const hentaiList = hits.slice(0, 20).map((item: any) => ({
      id: item.id,
      name: item.name,
      titles: item.titles || [],
      slug: item.slug,
      description: item.description || '',
      views: item.views,
      bannerImage: item.poster_url,
      coverImage: item.cover_url,
      cover_url: item.cover_url,
      poster_url: item.poster_url,
      brand: {
        name: item.brand,
        id: item.brand_id,
      },
      tags: item.tags || [],
      rating: item.rating,
    }));

    return NextResponse.json({
      success: true,
      data: hentaiList,
      count: hentaiList.length,
    });
  } catch (error: any) {
    console.error('Hentai API Proxy Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch hentai data',
      data: [],
    }, { status: 500 });
  }
}
