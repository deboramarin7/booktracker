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

async function searchOpenLibraryByTitle(title: string, author: string): Promise<{ url: string; source: string }[]> {
  const results: { url: string; source: string }[] = []
  try {
    const queries = [
      author ? `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}` : null,
      `title=${encodeURIComponent(title)}&author=${encodeURIComponent(lastNameOnly(author))}`,
      `title=${encodeURIComponent(cleanTitle(title))}&author=${encodeURIComponent(lastNameOnly(author))}`,
      `title=${encodeURIComponent(title)}`,
    ].filter(Boolean) as string[]

    const seen = new Set<string>()

    for (const q of queries) {
      if (results.length >= 4) break
      const url = `https://openlibrary.org/search.json?${q}&fields=key,cover_i,isbn,title,author_name&limit=10`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const docs = data.docs || []

      for (const doc of docs) {
        if (results.length >= 4) break
        const docTitle = normalize(doc.title || '')
        const docAuthors: string[] = (doc.author_name || []).map((a: string) => normalize(a))
        const normTitle = normalize(cleanTitle(title))
        const normLastName = normalize(lastNameOnly(author))

        const titleOk = docTitle.includes(normTitle) || normTitle.includes(docTitle) ||
          normTitle.split(' ').filter((w: string) => w.length > 3).some((w: string) => docTitle.includes(w))
        const authorOk = !author || docAuthors.some((a: string) => a.includes(normLastName) || normLastName.includes(a))

        if (!titleOk || !authorOk) continue

        if (doc.cover_i) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          if (!seen.has(coverUrl)) {
            seen.add(coverUrl)
            results.push({ url: coverUrl, source: 'Open Library' })
          }
        }

        const isbns: string[] = doc.isbn || []
        for (const isbn of isbns.slice(0, 3)) {
          if (results.length >= 4) break
          const directUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
          if (seen.has(directUrl)) continue
          const check = await fetch(directUrl, { method: 'HEAD' })
          if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) {
            seen.add(directUrl)
            results.push({ url: directUrl, source: 'Open Library (ISBN)' })
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return results
}

async function searchAmazonCover(isbn: string): Promise<string | null> {
  function isbn13ToIsbn10(isbn13: string): string | null {
    if (isbn13.length !== 13 || !isbn13.startsWith('978')) return null
    const core = isbn13.slice(3, 12)
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(core[i]) * (10 - i)
    }
    const check = (11 - (sum % 11)) % 11
    return core + (check === 10 ? 'X' : String(check))
  }

  async function isRealCover(url: string): Promise<boolean> {
    try {
      const headRes = await fetch(url, { method: 'HEAD' })
      console.log(`[Amazon HEAD] ${url} -> status=${headRes.status} content-type=${headRes.headers.get('content-type')} content-length=${headRes.headers.get('content-length')}`)
      if (!headRes.ok) return false
      if (!headRes.headers.get('content-type')?.startsWith('image/jpeg')) return false
      const size = parseInt(headRes.headers.get('content-length') || '0')
      if (size > 15000) return true
      if (size > 0 && size <= 15000) return false
      const getRes = await fetch(url, { headers: { Range: 'bytes=0-32767' } })
      console.log(`[Amazon GET] ${url} -> status=${getRes.status} content-length=${getRes.headers.get('content-length')}`)
      if (!getRes.ok) return false
      const buf = await getRes.arrayBuffer()
      console.log(`[Amazon GET buf] byteLength=${buf.byteLength}`)
      return buf.byteLength > 15000
    } catch (e) {
      console.log(`[Amazon ERROR] ${url} -> ${e}`)
      return false
    }
  }

  try {
    const isbn10 = isbn13ToIsbn10(isbn) || isbn
    console.log(`[Amazon] isbn=${isbn} isbn10=${isbn10}`)
    const urls = [
      `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SX300_.jpg`,
    ]
    for (const url of urls) {
      if (await isRealCover(url)) return url
    }
  } catch (e) {
    console.log(`[Amazon OUTER ERROR] ${e}`)
  }
  return null
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

    const amazonCover = await searchAmazonCover(isbn)
    if (amazonCover) return amazonCover
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

  const olCovers = await searchOpenLibraryByTitle(title, author)
  if (olCovers.length > 0) return olCovers[0].url

  if (isbn) {
    const amazonCover = await searchAmazonCover(isbn)
    if (amazonCover) return amazonCover
  }

  return null
}

async function findAllCovers(title: string, author: string, isbn?: string, apiKey?: string): Promise<{ url: string; source: string }[]> {
  const results: { url: string; source: string }[] = []
  const seen = new Set<string>()

  const ct = cleanTitle(title)
  const ca = cleanAuthor(author)
  const ln = lastNameOnly(author)

  const addCover = (url: string, source: string) => {
    if (!seen.has(url)) {
      seen.add(url)
      results.push({ url, source })
    }
  }

  if (isbn) {
    const googleByIsbn = await searchGoogleByISBN(isbn, apiKey)
    for (const item of googleByIsbn) {
      const cover = extractCoverFromGoogleItem(item)
      if (cover) addCover(cover, 'Google Books (ISBN)')
    }

    const isbnDirect = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    const check = await fetch(isbnDirect, { method: 'HEAD' })
    if (check.ok && check.headers.get('content-type')?.startsWith('image/jpeg')) {
      addCover(isbnDirect, 'Open Library (ISBN)')
    }

    const olByIsbn = await searchOpenLibraryByISBN(isbn)
    if (olByIsbn) addCover(olByIsbn, 'Open Library')

    const amazonCover = await searchAmazonCover(isbn)
    if (amazonCover) addCover(amazonCover, 'Amazon')
  }

  const googleStrategies = [
    `intitle:"${ct}" inauthor:"${ca}"`,
    `intitle:"${ct}" inauthor:"${ln}"`,
    `intitle:${removeDiacritics(ct)} inauthor:${removeDiacritics(ln)}`,
    `intitle:${removeDiacritics(ct)}`,
  ]

  for (const q of googleStrategies) {
    if (results.length >= 6) break
    const items = await searchGoogleBooks(q, apiKey)
    for (const item of items) {
      if (results.length >= 6) break
      if (!isGoodMatch(item, title, author)) continue
      const cover = extractCoverFromGoogleItem(item)
      if (cover) addCover(cover, 'Google Books')
    }
  }

  const olCovers = await searchOpenLibraryByTitle(title, author)
  for (const c of olCovers) {
    addCover(c.url, c.source)
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
