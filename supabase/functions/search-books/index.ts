const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[:(--]\s*.+$/, '').replace(/\s*\(.*?\)\s*/g, '').replace(/\s*#\d+.*$/, '').trim()
}

function cleanAuthor(author: string): string {
  const parts = author.split(',')
  if (parts.length > 1) return `${parts[1].trim()} ${parts[0].trim()}`
  return author.replace(/\b[A-Z]\.\s*/g, '').replace(/\s+/g, ' ').trim()
}

function lastNameOnly(author: string): string {
  const parts = cleanAuthor(author).split(' ')
  return parts[parts.length - 1]
}

function isGoodMatch(item: any, searchTitle: string, searchAuthor: string): boolean {
  const info = item?.volumeInfo || {}
  const resultTitle = normalize(info.title || '')
  const resultAuthors: string[] = (info.authors || []).map((a: string) => normalize(a))
  const normSearchTitle = normalize(cleanTitle(searchTitle))
  const normFullTitle = normalize(searchTitle)
  const normLastName = normalize(lastNameOnly(searchAuthor))
  const titleWords = normSearchTitle.split(' ').filter((w: string) => w.length > 3)
  const titleMatch =
    resultTitle.includes(normSearchTitle) ||
    normSearchTitle.includes(resultTitle) ||
    normFullTitle.split(' ').filter((w: string) => w.length > 3).some((w: string) => resultTitle.includes(w)) ||
    (titleWords.length > 0 && titleWords.filter((w: string) => resultTitle.includes(w)).length >= Math.ceil(titleWords.length * 0.5))
  if (!titleMatch) return false
  if (!normLastName) return true
  return resultAuthors.some((a: string) => a.includes(normLastName) || normLastName.includes(a))
}

function extractCover(item: any): string | null {
  const links = item?.volumeInfo?.imageLinks || {}
  const raw = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || null
  if (!raw) return null
  return raw.replace('http://', 'https://').replace('zoom=1', 'zoom=3').replace('&edge=curl', '')
}

function itemToBook(item: any) {
  const info = item.volumeInfo || {}
  return {
    title: info.title || '',
    author: (info.authors || []).join(', '),
    coverUrl: extractCover(item),
    totalPages: info.pageCount || 0,
    genre: (info.categories || [])[0] || null,
    description: info.description || null,
    language: info.language || null,
    isbn: (info.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_13')?.identifier || null,
  }
}

async function googleSearch(query: string, apiKey?: string): Promise<any[]> {
  try {
    const key = apiKey ? `&key=${apiKey}` : ''
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books${key}`)
    if (!res.ok) return []
    return (await res.json()).items || []
  } catch { return [] }
}

async function googleByISBN(isbn: string, apiKey?: string): Promise<any[]> {
  try {
    const key = apiKey ? `&key=${apiKey}` : ''
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=3${key}`)
    if (!res.ok) return []
    return (await res.json()).items || []
  } catch { return [] }
}

async function openLibraryByISBN(isbn: string): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
    if (!res.ok) return null
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null
    return book.cover?.large || book.cover?.medium || book.cover?.small || null
  } catch { return null }
}

async function openLibraryByTitle(title: string, author: string): Promise<string | null> {
  try {
    const ln = lastNameOnly(author)
    const ct = cleanTitle(title)
    const queries = [
      `title=${encodeURIComponent(title)}&author=${encodeURIComponent(ln)}`,
      `title=${encodeURIComponent(ct)}&author=${encodeURIComponent(ln)}`,
      `title=${encodeURIComponent(removeDiacritics(ct))}&author=${encodeURIComponent(removeDiacritics(ln))}`,
      `title=${encodeURIComponent(title)}`,
    ]
    for (const q of queries) {
      const res = await fetch(`https://openlibrary.org/search.json?${q}&fields=key,cover_i,isbn,title,author_name&limit=10`)
      if (!res.ok) continue
      const docs = (await res.json()).docs || []
      for (const doc of docs) {
        const docTitle = normalize(doc.title || '')
        const docAuthors: string[] = (doc.author_name || []).map((a: string) => normalize(a))
        const normTitle = normalize(ct)
        const normLn = normalize(ln)
        const titleOk = docTitle.includes(normTitle) || normTitle.includes(docTitle) ||
          normTitle.split(' ').filter((w: string) => w.length > 3).some((w: string) => docTitle.includes(w))
        const authorOk = !normLn || docAuthors.some((a: string) => a.includes(normLn) || normLn.includes(a))
        if (!titleOk || !authorOk) continue
        if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        for (const isbn of (doc.isbn || []).slice(0, 3)) {
          const cover = await openLibraryByISBN(isbn)
          if (cover) return cover
          const direct = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
          const check = await fetch(direct, { method: 'HEAD' })
          if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) return direct
        }
      }
    }
  } catch { }
  return null
}

async function amazonCover(isbn: string): Promise<string | null> {
  function to10(isbn13: string): string | null {
    if (isbn13.length !== 13 || !isbn13.startsWith('978')) return null
    const core = isbn13.slice(3, 12)
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(core[i]) * (10 - i)
    const check = (11 - (sum % 11)) % 11
    return core + (check === 10 ? 'X' : String(check))
  }
  try {
    const isbn10 = to10(isbn) || isbn
    const url = `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok && res.headers.get('content-type')?.startsWith('image/jpeg')) {
      if (parseInt(res.headers.get('content-length') || '0') > 15000) return url
    }
  } catch { }
  return null
}

async function findBestCover(title: string, author: string, isbn?: string, apiKey?: string): Promise<string | null> {
  const ct = cleanTitle(title)
  const ca = cleanAuthor(author)
  const ln = lastNameOnly(author)

  if (isbn) {
    const direct = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    const check = await fetch(direct, { method: 'HEAD' })
    if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) return direct
    const ol = await openLibraryByISBN(isbn)
    if (ol) return ol
    for (const item of await googleByISBN(isbn, apiKey)) { const c = extractCover(item); if (c) return c }
    const amz = await amazonCover(isbn)
    if (amz) return amz
  }

  for (const q of [
    `intitle:${ct} inauthor:${ca}`,
    `intitle:${ct} inauthor:${ln}`,
    `intitle:"${ct}" inauthor:${ln}`,
    `intitle:${removeDiacritics(ct)} inauthor:${removeDiacritics(ln)}`,
    `intitle:${removeDiacritics(ct)}`,
    ct,
  ]) {
    for (const item of await googleSearch(q, apiKey)) {
      if (!isGoodMatch(item, title, author)) continue
      const c = extractCover(item)
      if (c) return c
    }
  }

  const ol = await openLibraryByTitle(title, author)
  if (ol) return ol

  if (isbn) return amazonCover(isbn)
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })

  try {
    const body = await req.json()
    const { query, title, author, isbn, coversOnly } = body

    if (!query && !title) {
      return new Response(JSON.stringify({ error: 'Query or title is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')
    const ct = title ? cleanTitle(title) : ''
    const ca = author ? cleanAuthor(author) : ''

    if (coversOnly && title) {
      const covers: { url: string; source: string }[] = []
      const seen = new Set<string>()
      const add = (url: string, source: string) => { if (!seen.has(url)) { seen.add(url); covers.push({ url, source }) } }
      for (const item of await googleSearch(`intitle:"${ct}"${ca ? ` inauthor:"${ca}"` : ''}`, apiKey)) {
        const c = extractCover(item); if (c) add(c, 'Google Books')
      }
      if (isbn) { const ol = await openLibraryByISBN(isbn); if (ol) add(ol, 'Open Library') }
      const olTitle = await openLibraryByTitle(title, author || '')
      if (olTitle) add(olTitle, 'Open Library')
      return new Response(JSON.stringify({ covers: covers.slice(0, 8) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (query && !title) {
      const items = await googleSearch(query, apiKey)
      return new Response(JSON.stringify({ books: items.map(itemToBook) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let items = await googleSearch(ca ? `intitle:${ct} inauthor:${ca}` : `intitle:${ct}`, apiKey)
    if (!items.length) items = await googleSearch(`intitle:${removeDiacritics(ct)}${ca ? ` inauthor:${removeDiacritics(ca)}` : ''}`, apiKey)
    if (!items.length) items = await googleSearch(removeDiacritics(ct), apiKey)

    const goodMatches = items.filter((item: any) => isGoodMatch(item, title, author || ''))
    let books = (goodMatches.length > 0 ? goodMatches : items).map(itemToBook)

    books = await Promise.all(books.map(async (book) => {
      if (book.coverUrl) return book
      const cover = await findBestCover(title, author || '', isbn, apiKey)
      return { ...book, coverUrl: cover }
    }))

    if (!books.some((b: any) => b.coverUrl)) {
      const cover = await findBestCover(title, author || '', isbn, apiKey)
      if (cover) {
        if (books.length > 0) books[0].coverUrl = cover
        else books.push({ title: ct || title, author: ca || author || '', coverUrl: cover, totalPages: 0, genre: null, description: null, language: null, isbn: isbn || null })
      }
    }

    if (!books.length) {
      const cover = await findBestCover(title, author || '', isbn, apiKey)
      if (cover) books.push({ title: ct || title, author: ca || author || '', coverUrl: cover, totalPages: 0, genre: null, description: null, language: null, isbn: isbn || null })
    }

    return new Response(JSON.stringify({ books }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
