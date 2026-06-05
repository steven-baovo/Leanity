import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Thay thế bằng tên miền chính thức của bạn khi deploy (ví dụ: https://leanity.vn)
  const baseUrl = 'https://www.leanitylabs.com'
  const lastModified = new Date()

  // Các trang công khai (public routes) được hiển thị ra ngoài để Google lập chỉ mục
  const routes = [
    '',
    '/pomodoro',
    '/productivity',
    '/docs',
    '/blog',
    '/about',
    '/faq',
    '/privacy',
    '/contact',
  ]

  const staticEntries = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: lastModified,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // Truy vấn dữ liệu slug động từ Sanity CMS
  const sanityPosts = await client.fetch(`*[_type == "post"] { "slug": slug.current, publishedAt }`)

  const blogEntries = sanityPosts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...blogEntries]
}
