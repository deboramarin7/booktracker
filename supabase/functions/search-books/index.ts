const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

async function searchOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const query = author ? `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}` : `title=${encodeURIComponent(title)}`
    const url = `https://openlibrary.org/search.json?${query}&fields=key,title,author_name,isbn,cover_i&limit=5`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const docs = data.docs || []
    for (const doc of docs) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      }
      if (doc.isbn?.length) {
        return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
      }
    }
    return null
  } catch {
    return null
  }
}

async function searchGoogleBooks(query: string, apiKey?: string): Promise<any[]> {
  try {
    const keyParam = apiKey ? `&key=${apiKey}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${keyParam}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
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
    const cleanTitle = title ? title.replace(/\s*\(.*?\)\s*/g, '').trim() : ''
    const cleanAuthor = author ? author.replace(/\s+/g, ' ').trim() : ''

    let items: any[] = []

    if (cleanTitle) {
      const googleQuery = cleanAuthor ? `intitle:${cleanTitle} inauthor:${cleanAuthor}` : `intitle:${cleanTitle}`
      items = await searchGoogleBooks(googleQuery, apiKey)
      if (!items.length) {
        items = await searchGoogleBooks(cleanTitle, apiKey)
      }
    } else if (query) {
      items = await searchGoogleBooks(query, apiKey)
    }

    let books = extractBooks(items)

    if (cleanTitle) {
      const enrichedBooks = await Promise.all(
        books.map(async (book) => {
          if (!book.coverUrl) {
            const olCover = await searchOpenLibrary(cleanTitle, cleanAuthor)
            return { ...book, coverUrl: olCover }
          }
          return book
        })
      )

      if (!enrichedBooks.some(b => b.coverUrl)) {
        const olCover = await searchOpenLibrary(cleanTitle, cleanAuthor)
        if (olCover) {
          if (enrichedBooks.length > 0) {
            enrichedBooks[0].coverUrl = olCover
          } else {
            enrichedBooks.push({ title: cleanTitle, author: cleanAuthor, coverUrl: olCover, totalPages: 0, genre: null, description: null, language: null })
          }
        }
      }

      return new Response(JSON.stringify({ books: enrichedBooks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
