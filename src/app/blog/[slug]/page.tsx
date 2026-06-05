import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client, urlFor } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import Header from '@/components/Header'
import BlogFeedback from './BlogFeedback'
import { ChevronRight, ArrowLeft, Calendar, Clock, Sparkles, Cpu, BookOpen } from 'lucide-react'
export const revalidate = 60

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

interface SanityPost {
  _id: string
  title: string
  slug: string
  subtitle?: string
  summary?: string
  publishedAt: string
  readTime?: string
  category?: string
  categoryId?: string
  author?: {
    name: string
  }
  mainImage?: any
  tags?: string[]
  body: any[]
}

function getIconForCategory(category: string) {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('năng suất') || cat.includes('productivity')) return Sparkles
  if (cat.includes('triết lý') || cat.includes('thiết kế') || cat.includes('design') || cat.includes('product') || cat.includes('friction')) return Cpu
  return BookOpen
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Extract headings dynamically from Sanity Block Content for Table of Contents
function extractHeadings(body: any[]) {
  if (!body || !Array.isArray(body)) return []
  return body
    .filter((block: any) => block._type === 'block' && /^h[234]$/.test(block.style))
    .map((block: any) => {
      const title = block.children?.map((c: any) => c.text).join('') || ''
      const id = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove Vietnamese diacritics
        .replace(/[^a-z0-9]+/g, '-') // convert spaces/special chars to hyphens
        .replace(/(^-|-$)+/g, '') // strip trailing hyphens
      return { id, title, style: block.style }
    })
}

// Dynamic heading components that inject matching IDs for Table of Contents anchors
const portableTextComponents = {
  block: {
    h2: ({ value, children }: any) => {
      const text = value.children?.map((c: any) => c.text).join('') || ''
      const id = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      return <h2 id={id} className="scroll-mt-20 text-[18px] font-bold text-zinc-950 dark:text-zinc-50 pt-6 mt-4">{children}</h2>
    },
    h3: ({ value, children }: any) => {
      const text = value.children?.map((c: any) => c.text).join('') || ''
      const id = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      return <h3 id={id} className="scroll-mt-20 text-[15px] font-bold text-zinc-900 dark:text-zinc-100 pt-4 mt-2">{children}</h3>
    },
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 py-1.5 my-6 italic text-zinc-950 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-r text-[13px] font-normal leading-relaxed">
        {children}
      </blockquote>
    )
  },
  types: {
    image: ({ value }: any) => {
      const imageUrl = urlFor(value)
      if (!imageUrl) return null
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded border border-zinc-200/40 dark:border-zinc-800/40 my-6 shadow-subtle">
          <Image
            src={imageUrl}
            alt={value.alt || 'Hình ảnh từ bài viết'}
            fill
            sizes="(max-w-768px) 100vw, 80vw"
            className="object-cover"
          />
        </div>
      )
    }
  }
}

// 1. Static Parameter Generation (Pre-renders all blog post paths at build time)
export async function generateStaticParams() {
  const posts = await client.fetch(`*[_type == "post"] { "slug": slug.current }`)
  return posts.map((post: any) => ({
    slug: post.slug,
  }))
}

// 2. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug })
  if (!post) {
    return {
      title: 'Bài viết không tìm thấy | Leanity Blog',
    }
  }

  const url = `https://leanitylabs.com/blog/${slug}`

  return {
    title: `${post.title} | Leanity Blog`,
    description: post.summary,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: url,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author?.name || 'Ban Biên Tập Leanity'],
      tags: post.tags,
      images: [
        {
          url: urlFor(post.mainImage) || '/logo.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [urlFor(post.mainImage) || '/logo.png'],
    },
  }
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = await params
  
  // Fetch specific post from Sanity
  const post: SanityPost = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      subtitle,
      summary,
      publishedAt,
      readTime,
      "category": category->title,
      "categoryId": category->_id,
      author->{name},
      mainImage,
      tags,
      body
    }
  `, { slug })

  if (!post) {
    notFound()
  }

  // Fetch related posts in the same category (or newest if no category)
  const categoryFilter = post.categoryId ? '&& category._ref == $categoryId' : ''
  const relatedPosts: SanityPost[] = await client.fetch(`
    *[_type == "post" && _id != $currentId ${categoryFilter}] | order(publishedAt desc)[0...3] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      "category": category->title,
      mainImage
    }
  `, { categoryId: post.categoryId || '', currentId: post._id })

  // Fetch adjacent posts for bottom navigation links
  const allPosts = await client.fetch(`*[_type == "post"] | order(publishedAt desc) { "slug": slug.current, title }`)
  const activeIndex = allPosts.findIndex((p: any) => p.slug === slug)
  const prevPost = activeIndex > 0 ? allPosts[activeIndex - 1] : null
  const nextPost = activeIndex < allPosts.length - 1 ? allPosts[activeIndex + 1] : null

  const PostIcon = getIconForCategory(post.category || '')
  const imageUrl = urlFor(post.mainImage)
  const headings = extractHeadings(post.body || [])

  // Schema.org Structured Data
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "datePublished": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author?.name || 'Ban Biên Tập Leanity'
    },
    "publisher": {
      "@type": "Organization",
      "name": "Leanity",
      "logo": {
        "@type": "ImageObject",
        "url": "https://leanitylabs.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://leanitylabs.com/blog/${post.slug}`
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Header />

      <div className="flex-1 flex w-full bg-background">
        <div className="max-w-[1200px] mx-auto w-full flex relative px-6 gap-8 py-12">
          
          <main className="flex-1 min-w-0 max-w-[720px] mx-auto w-full">
            
            <article className="space-y-8 animate-in fade-in duration-300">
              
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors shadow-subtle cursor-pointer select-none font-normal"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-normal text-[12px]">Quay lại danh sách</span>
              </Link>

              <nav className="flex items-center space-x-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-normal uppercase tracking-wider select-none">
                <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors font-normal text-[11px]">
                  Leanity
                </Link>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700" />
                <Link href="/blog" className="hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors font-normal text-[11px]">
                  Blog
                </Link>
                <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700" />
                <span className="font-normal text-[11px] text-zinc-400 dark:text-zinc-500 max-w-[200px] truncate">{post.category || 'Tin tức'}</span>
              </nav>

              <header className="space-y-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">
                    {post.category || 'Tin tức'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 dark:text-zinc-500 font-normal">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight flex items-start gap-3">
                  <span className="w-9 h-9 rounded bg-[#5e6ad2]/5 dark:bg-[#5e6ad2]/10 border border-[#5e6ad2]/15 flex items-center justify-center text-[#5e6ad2] shrink-0 mt-1">
                    <PostIcon className="w-4.5 h-4.5" />
                  </span>
                  <span>{post.title}</span>
                </h1>
                
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal font-sans">
                  {post.subtitle}
                </p>
              </header>

              {/* Display Main Image if present */}
              {imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 my-6 shadow-subtle">
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-w-768px) 100vw, 80vw"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Dynamic Portable Text Content */}
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[13px] font-normal leading-relaxed">
                <PortableText value={post.body} components={portableTextComponents} />
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 select-none">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-[11px] font-normal text-zinc-500 dark:text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Related Posts Section */}
              {relatedPosts && relatedPosts.length > 0 && (
                <section className="pt-10 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-widest flex items-center space-x-2">
                    <span className="w-1 h-3 rounded-full bg-[#5e6ad2]" />
                    <span>Bài viết liên quan</span>
                  </h3>
                  <ul className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-md overflow-hidden bg-white dark:bg-zinc-900/10">
                    {relatedPosts.map((related) => (
                      <li key={related._id}>
                        <Link
                          href={`/blog/${related.slug}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-[13px] font-normal text-zinc-600 dark:text-zinc-400 hover:text-[#5e6ad2] dark:hover:text-[#5e6ad2] transition-colors group"
                        >
                          <span className="truncate pr-4 leading-normal">{related.title}</span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 font-normal">
                            {formatDate(related.publishedAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <BlogFeedback postId={post.slug} postTitle={post.title} />

              <footer className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-normal">
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.slug}`}
                      className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 p-5 rounded-lg text-left group shadow-subtle hover:scale-[1.005] transition-all cursor-pointer font-normal block"
                    >
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest block">
                        Bài viết trước
                      </span>
                      <span className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 text-left mt-2 truncate group-hover:text-primary transition-colors">
                        {prevPost.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  {nextPost ? (
                    <Link
                      href={`/blog/${nextPost.slug}`}
                      className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 p-5 rounded-lg text-right group shadow-subtle hover:scale-[1.005] transition-all cursor-pointer block ml-auto w-full font-normal"
                    >
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest block">
                        Bài tiếp theo
                      </span>
                      <span className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 text-right mt-2 truncate group-hover:text-primary transition-colors">
                        {nextPost.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
              </footer>

            </article>
          </main>

          {/* TABLE OF CONTENTS - Dynamic headings extracted from Portable Text */}
          {headings.length > 0 && (
            <aside className="hidden xl:block w-60 shrink-0 pl-8 select-none font-normal">
              <div className="sticky top-20 space-y-4">
                <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest px-2.5">
                  Nội dung bài viết
                </h3>
                <nav className="space-y-1 font-normal">
                  {headings.map((sub) => (
                    <a
                      key={sub.id}
                      href={`#${sub.id}`}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-100/65 dark:hover:bg-zinc-800/40 text-[13px] font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors truncate block"
                    >
                      {sub.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  )
}
