const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  return author
    .replace(/\b[A-Z]\.\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function lastNameOnly(author: string): string {
  const cleaned = cleanAuthor(author)
  const parts = cleaned.split(' ')
  return parts[parts.length - 1]
}

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

function isGoodMatch(item: any, searchTitle: string, searchAuthor: string): boolean {
  const info = item?.volumeInfo || {}
  const resultTitle = normalize(info.title || '')
  const resultAuthors: string[] = (info.authors || []).map((a: string) => normalize(a))

  const normSearchTitle = normalize(cleanTitle(searchTitle))
  const normFullTitle = normalize(searchTitle)
  const normLastName = normalize(lastNameOnly(searchAuthor))
  const normSearchAuthor = normalize(cleanAuthor(searchAuthor))

  const meaningfulWords = (s: string) => s.split(' ').filter((w: string) => w.length > 3)

  const titleMatch =
    resultTitle.includes(normSearchTitle) ||
    normSearchTitle.includes(resultTitle) ||
    resultTitle.includes(normFullTitle) ||
    normFullTitle.includes(resultTitle) ||
    meaningfulWords(normSearchTitle).some((w: string) => resultTitle.includes(w)) ||
    meaningfulWords(normFullTitle).some((w: string) => resultTitle.includes(w)) ||
    meaningfulWords(normSearchTitle).filter((w: string) => resultTitle.includes(w)).length >= Math.min(2, meaningfulWords(normSearchTitle).length)

  if (!titleMatch) return false

  const authorMatch = resultAuthors.some((a: string) =>
    a.includes(normLastName) ||
    normLastName.includes(a) ||
    normSearchAuthor.split(' ').some((part: string) => part.length > 3 && a.includes(part))
  )

  return authorMatch
}

async function searchGoogleBooks(query: string, apiKey?: string): Promise<any[]> {
  try {
    const keyParam = apiKey ? `&key=${apiKey}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books${keyParam}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

async function searchGoogleByISBN(isbn: string, apiKey?: string): Promise<any[]> {
  try {
    const keyParam = apiKey ? `&key=${apiKey}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=3${keyParam}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

function extractCoverFromGoogleItem(item: any): string | null {
  const info = item?.volumeInfo || {}
  const links = info.imageLinks || {}
  const thumbnail =
    links.extraLarge ||
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    links.smallThumbnail ||
    null
  if (!thumbnail) return null
  return thumbnail
    .replace('http://', 'https://')
    .replace('zoom=1', 'zoom=3')
    .replace('&edge=curl', '')
}

function extractBooks(items: any[]) {
  return items.map((item: any) => {
    const info = item.volumeInfo || {}
    return {
      title: info.title || '',
      author: (info.authors || []).join(', '),
      coverUrl: extractCoverFromGoogleItem(item),
      totalPages: info.pageCount || 0,
      genre: (info.categories || [])[0] || null,
      description: info.description || null,
      language: info.language || null,
      isbn: (info.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_13')?.identifier || null,
    }
  })
}

async function searchOpenLibraryByISBN(isbn: string): Promise<string | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const key = `ISBN:${isbn}`
    const book = data[key]
    if (!book) return null
    if (book.cover?.large) return book.cover.large
    if (book.cover?.medium) return book.cover.medium
    if (book.cover?.small) return book.cover.small
    return null
  } catch {
    return null
  }
}

async function searchOpenLibraryByTitle(title: string, author: string): Promise<string | null> {
  try {
    const queries = [
      author ? `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}` : null,
      `title=${encodeURIComponent(title)}&author=${encodeURIComponent(lastNameOnly(author))}`,
      `title=${encodeURIComponent(cleanTitle(title))}&author=${encodeURIComponent(lastNameOnly(author))}`,
      `title=${encodeURIComponent(title)}`,
    ].filter(Boolean) as string[]

    for (const q of queries) {
      const url = `https://openlibrary.org/search.json?${q}&fields=key,cover_i,isbn,title,author_name&limit=10`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const docs = data.docs || []

      for (const doc of docs) {
        const docTitle = normalize(doc.title || '')
        const docAuthors: string[] = (doc.author_name || []).map((a: string) => normalize(a))
        const normTitle = normalize(cleanTitle(title))
        const normLastName = normalize(lastNameOnly(author))

        const titleOk = docTitle.includes(normTitle) || normTitle.includes(docTitle) ||
          normTitle.split(' ').filter((w: string) => w.length > 3).some((w: string) => docTitle.includes(w))
        const authorOk = docAuthors.some((a: string) => a.includes(normLastName) || normLastName.includes(a))

        if (!titleOk || !authorOk) continue

        if (doc.cover_i) {
          return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        }
        const isbns: string[] = doc.isbn || []
        for (const isbn of isbns.slice(0, 3)) {
          const cover = await searchOpenLibraryByISBN(isbn)
          if (cover) return cover
          const directUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
          const check = await fetch(directUrl, { method: 'HEAD' })
          if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) {
            return directUrl
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function findBestCover(title: string, author: string, isbn?: string, apiKey?: string): Promise<string | null> {
  const ct = cleanTitle(title)
  const ca = cleanAuthor(author)
  const ln = lastNameOnly(author)

  if (isbn) {
    const isbnDirect = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    const check = await fetch(isbnDirect, { method: 'HEAD' })
    if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) {
      return isbnDirect
    }
    const olByIsbn = await searchOpenLibraryByISBN(isbn)
    if (olByIsbn) return olByIsbn
    const googleByIsbn = await searchGoogleByISBN(isbn, apiKey)
    for (const item of googleByIsbn) {
      const cover = extractCoverFromGoogleItem(item)
      if (cover) return cover
    }
  }

  const googleStrategies = [
    `intitle:${ct} inauthor:${ca}`,
    `intitle:${ct} inauthor:${ln}`,
    `intitle:"${ct}" inauthor:${ln}`,
    `intitle:${removeDiacritics(ct)} inauthor:${removeDiacritics(ln)}`,
    `intitle:${removeDiacritics(ct)}`,
    ct,
  ]

  for (const q of googleStrategies) {
    const items = await searchGoogleBooks(q, apiKey)
    for (const item of items) {
      if (!isGoodMatch(item, title, author)) continue
      const cover = extractCoverFromGoogleItem(item)
      if (cover) return cover
    }
  }

  const olCover = await searchOpenLibraryByTitle(title, author)
  if (olCover) return olCover

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { query, title, author, isbn } = body

    if (!query && !title) {
      return new Response(JSON.stringify({ error: 'Query or title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')
    const ct = title ? cleanTitle(title) : ''
    const ca = author ? cleanAuthor(author) : ''

    if (title) {
      const ln = author ? lastNameOnly(author) : ''
      const queries = ca
        ? [
            `intitle:"${ct}" inauthor:"${ca}"`,
            `intitle:"${ct}" inauthor:"${ln}"`,
            `intitle:"${ct}" ${ln}`,
            `"${ct}" ${ca}`,
            ct,
          ]
        : [`intitle:"${ct}"`, ct]

      let items: any[] = []
      for (const q of queries) {
        items = await searchGoogleBooks(q, apiKey)
        if (items.length > 0) break
      }
      if (!items.length) {
        items = await searchGoogleBooks(`intitle:${removeDiacritics(ct)} inauthor:${removeDiacritics(ca)}`, apiKey)
      }
      if (!items.length) {
        items = await searchGoogleBooks(removeDiacritics(ct), apiKey)
      }

      const goodMatches = items.filter((item: any) => isGoodMatch(item, title, author || ''))
      const booksToUse = goodMatches.length > 0 ? goodMatches : items
      let books = extractBooks(booksToUse)

      const enriched = await Promise.all(
        books.map(async (book) => {
          if (book.coverUrl) return book
          const cover = await findBestCover(title, author || '', isbn, apiKey)
          return { ...book, coverUrl: cover }
        })
      )

      if (!enriched.some((b) => b.coverUrl)) {
        const cover = await findBestCover(title, author || '', isbn, apiKey)
        if (cover) {
          if (enriched.length > 0) {
            enriched[0].coverUrl = cover
          } else {
            enriched.push({
              title: ct,
              author: ca,
              coverUrl: cover,
              totalPages: 0,
              genre: null,
              description: null,
              language: null,
              isbn: isbn || null,
            })
          }
        }
      }

      if (!enriched.length) {
        const cover = await findBestCover(title, author || '', isbn, apiKey)
        if (cover) {
          enriched.push({
            title: ct || title,
            author: ca || author || '',
            coverUrl: cover,
            totalPages: 0,
            genre: null,
            description: null,
            language: null,
            isbn: isbn || null,
          })
        }
      }

      return new Response(JSON.stringify({ books: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const items = await searchGoogleBooks(query, apiKey)
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
