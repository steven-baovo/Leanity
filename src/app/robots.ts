import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Thay thế bằng tên miền chính thức của bạn khi deploy (ví dụ: https://leanity.vn)
  const baseUrl = 'https://www.leanitylabs.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', 
        '/workspace/', // Chặn bot truy cập vào không gian làm việc cá nhân của người dùng
        '/tasks/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
