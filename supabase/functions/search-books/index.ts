const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

async function searchGoogleBooks(query: string, apiKey?: string): Promise<any[]> {
  const keyParam = apiKey ? `&key=${apiKey}` : ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=&${keyParam}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

function extractBooks(items: any[]) {
  return items.map((item: any) => {
    const info = item.volumeInfo || {}
    const thumbnail =
      info.imageLinks?.extraLarge ||
      info.imageLinks?.large ||
      info.imageLinks?.medium ||
      info.imageLinks?.small ||
      info.imageLinks?.thumbnail ||
      info.imageLinks?.smallThumbnail ||
      null
    return {
      title: info.title || '',
      author: (info.authors || []).join(', '),
      coverUrl: thumbnail ? thumbnail.replace('http://', 'https://') : null,
      totalPages: info.pageCount || 0,
      genre: (info.categories || [])[0] || null,
      description: info.description || null,
      language: info.language || null,
    }
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { query, title, author } = body

    if (!query && !title) {
      return new Response(JSON.stringify({ error: 'Query or title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')

    let items: any[] = []

    if (title && author) {
      items = await searchGoogleBooks(`${title} ${author}`, apiKey)
      if (!items.length) {
        items = await searchGoogleBooks(title, apiKey)
      }
    } else if (query) {
      items = await searchGoogleBooks(query, apiKey)
      if (!items.length && query.includes('intitle:')) {
        const cleanQuery = query.replace(/intitle:|inauthor:/g, '').replace(/\s+/g, ' ').trim()
        items = await searchGoogleBooks(cleanQuery, apiKey)
      }
    }

    const books = extractBooks(items)

    return new Response(JSON.stringify({ books }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
