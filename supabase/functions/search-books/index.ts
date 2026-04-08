const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')
    const keyParam = apiKey ? `&key=${apiKey}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${keyParam}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      console.error('Google Books API error:', data)
      return new Response(JSON.stringify({ error: 'Google Books API error', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const books = (data.items || []).map((item: any) => {
      const info = item.volumeInfo || {}
      return {
        title: info.title || '',
        author: (info.authors || []).join(', '),
        coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        totalPages: info.pageCount || 0,
        genre: (info.categories || [])[0] || null,
        description: info.description || null,
        language: info.language || null,
      }
    })

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
