import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { client, urlFor } from '@/lib/sanity'
import { BookOpen, Calendar, Clock, ArrowRight, Sparkles, Cpu } from 'lucide-react'
export const revalidate = 60

interface SanityPost {
  _id: string
  title: string
  slug: string
  subtitle?: string
  summary?: string
  publishedAt: string
  readTime?: string
  category?: string
  author?: {
    name: string
  }
  mainImage?: any
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

export default async function BlogPage() {
  // Fetch posts from Sanity CMS
  const blogPosts: SanityPost[] = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      subtitle,
      summary,
      publishedAt,
      readTime,
      "category": category->title,
      author->{name},
      mainImage
    } | order(publishedAt desc)
  `)

  // Schema.org Structured Data for Blog
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Leanity Blog",
    "description": "Nơi chia sẻ các bài viết khoa học về sự tập trung sâu, cách kích hoạt trạng thái dòng chảy (Flow State) và triết lý sản phẩm không ma sát (Zero Friction) cùng Leanity.",
    "url": "https://leanitylabs.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Leanity",
      "logo": {
        "@type": "ImageObject",
        "url": "https://leanitylabs.com/logo.png"
      }
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.summary,
      "datePublished": post.publishedAt,
      "author": {
        "@type": "Person",
        "name": post.author?.name || 'Ban Biên Tập Leanity'
      },
      "url": `https://leanitylabs.com/blog/${post.slug}`
    }))
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <Header />

      <div className="flex-1 flex w-full bg-background">
        <div className="max-w-[1200px] mx-auto w-full flex relative px-6">
          <main className="flex-1 py-16 max-w-5xl mx-auto w-full">
            
            <div className="space-y-12 animate-in fade-in duration-300">
              
              <header className="space-y-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-subtle">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="text-[13px] font-normal uppercase tracking-widest text-[#5e6ad2]">
                    Blog & Kiến thức
                  </h2>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Chia sẻ về năng suất & thiết kế
                </h1>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
                  Nơi chúng tôi chia sẻ các phương pháp làm việc khoa học, chiều sâu tâm lý của sự tập trung và những triết lý đằng sau quá trình xây dựng Leanity Workspace nhằm triệt tiêu ma sát công việc.
                </p>
              </header>

              {blogPosts.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <p className="text-zinc-500 dark:text-zinc-400 text-[13px]">Hiện tại chưa có bài viết nào được đăng tải.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogPosts.map((post) => {
                    const PostIcon = getIconForCategory(post.category || '')
                    const imageUrl = urlFor(post.mainImage)
                    return (
                      <article
                        key={post._id}
                        className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-350 dark:hover:border-zinc-700 p-8 rounded-lg shadow-subtle flex flex-col justify-between group hover:scale-[1.008] transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">
                              {post.category || 'Tin tức'}
                            </span>
                            <div className="flex items-center space-x-3 text-[12px] text-zinc-400 dark:text-zinc-500 font-normal">
                              <span className="flex items-center gap-1.5 font-normal">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt)}
                              </span>
                            </div>
                          </div>

                          <Link href={`/blog/${post.slug}`} className="block group-hover:text-primary transition-colors duration-200">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/40 dark:border-zinc-750 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-primary dark:group-hover:text-primary transition-colors mt-0.5 shrink-0">
                                <PostIcon className="w-3 h-3" />
                              </span>
                              <span>{post.title}</span>
                            </h3>
                          </Link>
                          
                          {/* Display main image if exists */}
                          {imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded border border-zinc-200/40 dark:border-zinc-800/40 my-3">
                              <Image
                                src={imageUrl}
                                alt={post.title}
                                fill
                                sizes="(max-w-768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                              />
                            </div>
                          )}

                          <p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed line-clamp-3 font-normal">
                            {post.summary}
                          </p>

                          <div className="flex items-center justify-end select-none font-normal">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-[13px] font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1 cursor-pointer select-none"
                            >
                              <span className="font-normal text-[13px]">Đọc tiếp</span>
                              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

            </div>

          </main>
        </div>
      </div>
    </div>
  )
}
