const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[:(–—-]\s*.+$/, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*#\d+.*$/, '')
    .trim()
}

function cleanAuthor(author: string): string {
  const parts = author.split(',')
  if (parts.length > 1) {
    return `${parts[1].trim()} ${parts[0].trim()}`
  }
  return author.replace(/\s+/g, ' ').trim()
}

interface BookResult {
  title: string
  author: string
  coverUrl: string | null
  totalPages: number
  genre: string | null
  description: string | null
  language: string | null
  isbn: string | null
}

async function searchOpenLibrary(query: string, author?: string): Promise<BookResult[]> {
  try {
    const params = new URLSearchParams({ q: query, limit: '15', fields: 'key,title,author_name,cover_i,isbn,number_of_pages_median,subject,first_sentence,language' })
    if (author) params.set('author', author)
    const url = `https://openlibrary.org/search.json?${params}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error('Open Library error:', res.status)
      return []
    }
    const data = await res.json()
    const docs: any[] = data.docs || []
    return docs.slice(0, 10).map((doc: any) => {
      const isbn13 = (doc.isbn || []).find((i: string) => i.length === 13) || (doc.isbn || [])[0] || null
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : isbn13
        ? `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`
        : null
      return {
        title: doc.title || '',
        author: (doc.author_name || []).join(', '),
        coverUrl,
        totalPages: doc.number_of_pages_median || 0,
        genre: (doc.subject || [])[0] || null,
        description: doc.first_sentence?.value || doc.first_sentence || null,
        language: (doc.language || [])[0] || null,
        isbn: isbn13,
      }
    })
  } catch (e) {
    console.error('Open Library fetch error:', e)
    return []
  }
}

async function searchGoogleBooks(query: string, apiKey?: string): Promise<BookResult[]> {
  try {
    const keyParam = apiKey ? `&key=${apiKey}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books&langRestrict=es${keyParam}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.items || []
    return items.map((item: any) => {
      const info = item.volumeInfo || {}
      const links = info.imageLinks || {}
      const rawCover = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || null
      const coverUrl = rawCover
        ? rawCover.replace('http://', 'https://').replace('zoom=1', 'zoom=3').replace('&edge=curl', '')
        : null
      const isbn13 = (info.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_13')?.identifier || null
      return {
        title: info.title || '',
        author: (info.authors || []).join(', '),
        coverUrl,
        totalPages: info.pageCount || 0,
        genre: (info.categories || [])[0] || null,
        description: info.description || null,
        language: info.language || null,
        isbn: isbn13,
      }
    })
  } catch (e) {
    console.error('Google Books error:', e)
    return []
  }
}

function deduplicateBooks(books: BookResult[]): BookResult[] {
  const seen = new Set<string>()
  return books.filter((b) => {
    const key = normalize(b.title + (b.author || ''))
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function findAllCovers(title: string, author: string, isbn?: string, apiKey?: string): Promise<{ url: string; source: string }[]> {
  const results: { url: string; source: string }[] = []
  const seen = new Set<string>()
  const add = (url: string, source: string) => { if (!seen.has(url)) { seen.add(url); results.push({ url, source }) } }

  const olBooks = await searchOpenLibrary(title, author || undefined)
  for (const b of olBooks) {
    if (b.coverUrl) add(b.coverUrl, 'Open Library')
    if (results.length >= 4) break
  }

  if (apiKey) {
    const googleBooks = await searchGoogleBooks(`intitle:"${cleanTitle(title)}"${author ? ` inauthor:"${author}"` : ''}`, apiKey)
    for (const b of googleBooks) {
      if (b.coverUrl) add(b.coverUrl, 'Google Books')
      if (results.length >= 8) break
    }
  }

  if (isbn) {
    const isbnCover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    add(isbnCover, 'Open Library (ISBN)')
  }

  return results.slice(0, 8)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { query, title, author, isbn, coversOnly } = body

    if (!query && !title) {
      return new Response(JSON.stringify({ error: 'Query or title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')

    if (coversOnly && title) {
      const covers = await findAllCovers(title, author || '', isbn, apiKey)
      return new Response(JSON.stringify({ covers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const searchQuery = title || query
    let books: BookResult[] = []

    const olResults = await searchOpenLibrary(searchQuery, author || undefined)
    books = olResults

    if (apiKey) {
      const googleResults = await searchGoogleBooks(
        title ? `intitle:"${cleanTitle(title)}"${author ? ` inauthor:"${cleanAuthor(author)}"` : ''}` : query,
        apiKey
      )
      books = [...books, ...googleResults]
    }

    books = deduplicateBooks(books)

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
