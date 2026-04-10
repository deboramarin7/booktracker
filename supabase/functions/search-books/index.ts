const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const OL_HEADERS = {
  'User-Agent': 'MyBookTracker/1.0 (mybooktracker.net; deboramarin94@gmail.com)'
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
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
  if (parts.length > 1) return `${parts[1].trim()} ${parts[0].trim()}`
  return author.replace(/\b[A-Z]\.\s*/g, '').replace(/\s+/g, ' ').trim()
}

function lastNameOnly(author: string): string {
  const parts = cleanAuthor(author).split(' ')
  return parts[parts.length - 1]
}

// ─── Open Library: búsqueda ────────────────────────────────────────────────────

async function olSearch(query: string, author?: string): Promise<any[]> {
  try {
    const fields = 'key,title,author_name,cover_i,isbn,number_of_pages_median,subject,language,series,first_publish_year,editions,editions.title,editions.cover_i,editions.isbn,editions.number_of_pages,editions.language,editions.series'

    const requests: Promise<Response>[] = [
      fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&lang=es&fields=${fields}&limit=15`, { headers: OL_HEADERS }),
      fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&language=spa&fields=${fields}&limit=10`, { headers: OL_HEADERS }),
    ]

    if (author) {
      requests.push(
        fetch(`https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&title=${encodeURIComponent(query)}&lang=es&fields=${fields}&limit=10`, { headers: OL_HEADERS })
      )
    }

    const responses = await Promise.all(requests)
    const allDocs = await Promise.all(responses.map(r => r.ok ? r.json().then((d: any) => d.docs || []) : []))

    const seen = new Set<string>()
    return allDocs.flat().filter((doc: any) => {
      if (seen.has(doc.key)) return false
      seen.add(doc.key)
      return true
    })
  } catch { return [] }
}

function olDocToBook(doc: any) {
  const spanishEd = doc.editions?.docs?.find((e: any) =>
    (e.language || []).some((l: string) => ['spa', 'es'].includes(l.toLowerCase()))
  )

  const langs: string[] = doc.language || []
  const isSpanish = !!spanishEd || langs.some((l: string) => ['spa', 'es', 'spanish'].includes(l.toLowerCase()))

  const isbn = (spanishEd?.isbn || doc.isbn || []).find((i: string) => i.length === 13) || null

  const coverId = spanishEd?.cover_i || doc.cover_i
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    : null

  const seriesRaw = spanishEd?.series || doc.series || []
  const seriesText = (seriesRaw[0] || '').trim()
  // Matches: "Empireo 1", "Empireo, 1", "Empireo #1", "Empireo, #1.5", "Empireo vol. 2", "Empireo (Book 1)"
  const seriesMatch = seriesText.match(/^(.+?)[\s,]+(?:vol\.?\s*|book\s*|tome\s*|#)?(\d+\.?\d*)\s*$/i)
  const sagaName = seriesMatch ? seriesMatch[1].trim() : seriesText
  const sagaOrder = seriesMatch ? seriesMatch[2] : ''

  return {
    title: spanishEd?.title || doc.title || '',
    author: (doc.author_name || []).join(', '),
    coverUrl,
    totalPages: spanishEd?.number_of_pages || doc.number_of_pages_median || 0,
    genre: (doc.subject || [])[0] || null,
    description: null,
    language: isSpanish ? 'es' : (langs[0] || null),
    isbn,
    sagaName,
    sagaOrder,
    _isSpanish: isSpanish,
    _coverId: coverId || null,
  }
}

// Búsqueda por ISBN en Open Library
async function olByISBN(isbn: string): Promise<any | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, { headers: OL_HEADERS })
    if (!res.ok) return null
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null
    return {
      title: book.title || '',
      author: (book.authors || []).map((a: any) => a.name).join(', '),
      coverUrl: book.cover?.large || book.cover?.medium || book.cover?.small || null,
      totalPages: book.number_of_pages || 0,
      genre: (book.subjects || [])[0]?.name || null,
      description: book.excerpts?.[0]?.text || null,
      language: null,
      isbn,
    }
  } catch { return null }
}

// Portada directa por ISBN de Open Library
async function olCoverByISBN(isbn: string): Promise<string | null> {
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    const res = await fetch(url, { method: 'HEAD', headers: OL_HEADERS })
    if (res.ok && res.headers.get('content-type')?.startsWith('image/jpeg')) {
      const size = parseInt(res.headers.get('content-length') || '0')
      if (size > 2000) return url // Evitar placeholders pequeños
    }
  } catch { }
  return null
}

// Amazon como fallback de portadas
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

// Puntuación para ordenar resultados (español y con portada primero)
function scoreBook(book: any, normQuery: string): number {
  const t = normalize(book.title || '')
  const qWords = normQuery.split(' ').filter((w: string) => w.length > 2)
  const isSpanish = book._isSpanish || book.language === 'es' ? 30 : 0
  const hasCover = book.coverUrl ? 20 : 0
  const hasPages = book.totalPages > 0 ? 5 : 0

  let titleScore = 0
  if (t === normQuery) titleScore = 100
  else if (t.includes(normQuery) || normQuery.includes(t)) titleScore = 60
  else if (qWords.length > 0) {
    const matched = qWords.filter((w: string) => t.includes(w)).length
    titleScore = (matched / qWords.length) * 50
  }

  return titleScore + isSpanish + hasCover + hasPages
}

// ─── Handler principal ────────────────────────────────────────────────────────

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

    // ── Modo coversOnly: múltiples opciones para CoverSearch ──
    if (coversOnly && title) {
      const covers: { url: string; source: string }[] = []
      const seen = new Set<string>()
      const add = (url: string, source: string) => {
        if (!seen.has(url)) { seen.add(url); covers.push({ url, source }) }
      }

      const ct = cleanTitle(title)
      const ca = author ? cleanAuthor(author) : ''
      const docs = await olSearch(ct, ca || undefined)

      for (const doc of docs) {
        const book = olDocToBook(doc)
        if (book.coverUrl) add(book.coverUrl, 'Open Library')
        if (covers.length >= 8) break
      }

      if (isbn) {
        const cover = await olCoverByISBN(isbn)
        if (cover) add(cover, 'Open Library (ISBN)')
        const amz = await amazonCover(isbn)
        if (amz) add(amz, 'Amazon')
      }

      return new Response(JSON.stringify({ covers: covers.slice(0, 8) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Modo búsqueda por ISBN ──
    if (isbn && !title) {
      const book = await olByISBN(isbn)
      if (book) {
        return new Response(JSON.stringify({ books: [book] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ── Modo búsqueda libre o por título+autor ──
    const searchTerm = title ? cleanTitle(title) : query
    const searchAuthor = author ? cleanAuthor(author) : undefined

    // Detectar ISBN en query
    const isISBN = /^(97[89])?\d{9}[\dX]$/i.test((query || '').replace(/-/g, ''))
    if (isISBN) {
      const cleanIsbn = (query || '').replace(/-/g, '')
      const book = await olByISBN(cleanIsbn)
      if (book) {
        return new Response(JSON.stringify({ books: [book] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const docs = await olSearch(searchTerm, searchAuthor)
    let books = docs.map(olDocToBook)

    // Enriquecer portadas faltantes con Amazon
    books = await Promise.all(books.map(async (book) => {
      if (book.coverUrl) return book
      if (book.isbn) {
        const amz = await amazonCover(book.isbn)
        if (amz) return { ...book, coverUrl: amz }
      }
      return book
    }))

    // Ordenar: español con portada primero
    const normQ = normalize(searchTerm)
    books.sort((a, b) => scoreBook(b, normQ) - scoreBook(a, normQ))

    // Limpiar campos internos
    const result = books.map(({ _isSpanish, _coverId, ...b }: any) => b)

    return new Response(JSON.stringify({ books: result.slice(0, 15) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})