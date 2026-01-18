import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
      },
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text().trim() || new URL(url).hostname,
      description: $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content') || '',
    };

    // Make ogImage absolute if relative
    if (metadata.ogImage && !metadata.ogImage.startsWith('http')) {
      const urlObj = new URL(url);
      metadata.ogImage = `${urlObj.protocol}//${urlObj.host}${metadata.ogImage.startsWith('/') ? '' : '/'}${metadata.ogImage}`;
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      title: new URL(url).hostname,
      description: '',
      ogImage: ''
    }, { status: 200 }); // Fallback aman
  }
}