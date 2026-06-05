import React from 'react'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Sparkles, Shield, Zap, Heart, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | Leanity Workspace',
  description: 'Khám phá triết lý phát triển Leanity - không gian làm việc số tối giản, an toàn và tối đa tập trung dựa trên nguyên lý Local-first.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Giới thiệu về Leanity",
    "description": "Leanity là nền tảng quản lý năng suất cá nhân và làm việc nhóm theo triết lý tinh gọn (Lean), kết hợp Local-First và bảo mật dữ liệu tuyệt đối.",
    "publisher": {
      "@type": "Organization",
      "name": "Leanity Labs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://leanitylabs.com/logo.png"
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-[#5e6ad2]/20 selection:text-[#5e6ad2] font-sans overflow-x-hidden relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-150px] left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-[-100px] right-1/4 w-[400px] h-[400px] rounded-full bg-[#5e6ad2]/5 blur-[100px]" />
      </div>

      <Header />

      <main className="flex-1 py-16 px-6 max-w-[1200px] mx-auto w-full flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-6 mb-16 animate-in fade-in duration-300">
          <span className="text-[13px] font-bold text-[#5e6ad2] uppercase tracking-widest">
            Về chúng tôi
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 leading-tight">
            Chúng tôi kiến tạo không gian làm việc số tĩnh lặng
          </h1>
          <p className="text-[14px] text-zinc-500 leading-relaxed font-normal">
            Leanity ra đời với một sứ mệnh duy nhất: Giúp bạn lấy lại sự tập trung cao độ trong kỷ nguyên số đầy xao nhãng. Chúng tôi tin rằng công cụ làm việc tốt nhất là công cụ không gây trở ngại cho suy nghĩ của bạn.
          </p>
        </section>

        {/* Philosophy Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-20">
          
          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-subtle flex flex-col justify-between hover:border-zinc-350 transition-all duration-350">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg text-violet-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Triết lý tối giản (Lean)</h3>
              <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
                Mỗi nút nhấn, mỗi dòng code trong Leanity đều được tối ưu hóa để loại bỏ ma sát (Zero Friction UX). Chúng tôi không bổ sung tính năng thừa thãi, chỉ giữ lại những gì thực sự tạo nên hiệu suất công việc.
              </p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-subtle flex flex-col justify-between hover:border-zinc-350 transition-all duration-350">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg text-emerald-500">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Quyền sở hữu dữ liệu</h3>
              <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
                Chúng tôi tin rằng ghi chú và tài liệu là tài sản trí tuệ trọn đời của bạn. Với cơ chế Local-first và mã hóa đầu cuối thông qua tài khoản Google Drive cá nhân, dữ liệu của bạn mãi là của bạn.
              </p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-subtle flex flex-col justify-between hover:border-zinc-350 transition-all duration-350">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg text-blue-500">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Tốc độ siêu việt</h3>
              <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
                Hoạt động trực tiếp trên bộ nhớ cục bộ máy tính của bạn giúp ứng dụng phản hồi ngay lập tức (&lt; 5ms) bất chấp tốc độ mạng Internet. Năng suất tăng cao khi bạn không phải chờ đợi vòng lặp máy chủ tải dữ liệu.
              </p>
            </div>
          </div>

        </section>

        {/* Detailed Story Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center border-t border-zinc-200 pt-20 mb-20">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Câu chuyện của chúng tôi
            </h2>
            <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
              Đội ngũ sáng lập Leanity là những kỹ sư phần mềm và nhà thiết kế sản phẩm có chung niềm đam mê với việc tối ưu hóa năng suất. Nhận thấy các công cụ hiện nay đang ngày càng cồng kềnh và đè nặng lên tâm trí người sử dụng bởi các luồng thông báo, tính năng phức tạp, chúng tôi quyết định xây dựng một giải pháp khác biệt.
            </p>
            <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
              Leanity lấy cảm hứng từ sự mượt mà của Linear, cấu trúc kết nối tri thức bền vững của Capacities và triết lý làm việc tĩnh lặng để tạo ra hệ sinh thái ba trụ cột: Quản lý Tasks trực quan, Lưu trữ tài liệu khoa học và Đồng hồ Pomodoro nâng tầm tập trung.
            </p>
          </div>
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/55 border border-zinc-200 rounded-2xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5e6ad2]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>Giá trị cốt lõi</span>
            </h3>
            <ul className="space-y-4 text-[13px] text-zinc-650 font-normal">
              <li className="flex items-start gap-2">
                <span className="text-[#5e6ad2] font-extrabold">01.</span>
                <span><strong>Đơn giản là tối thượng:</strong> Chỉ thêm tính năng khi nó mang lại giá trị gia tăng rõ rệt cho việc tập trung.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5e6ad2] font-extrabold">02.</span>
                <span><strong>Bảo mật từ thiết kế:</strong> Dữ liệu được ưu tiên lưu trữ nội bộ (Local Cache) trước khi đồng bộ đám mây.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5e6ad2] font-extrabold">03.</span>
                <span><strong>Tôn trọng tâm trí:</strong> Giao diện không có quảng cáo, không có thông báo giật gân, trả lại sự yên tĩnh để tư duy.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Sustainability Section */}
        <section id="sustainability" className="w-full bg-[#5e6ad2]/5 border border-[#5e6ad2]/10 rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5e6ad2]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-8 h-8 rounded-full bg-[#5e6ad2]/10 flex items-center justify-center text-[#5e6ad2] mx-auto mb-2">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950">Phát triển bền vững cùng cộng đồng</h2>
            <p className="text-zinc-500 text-[13px] leading-relaxed font-normal">
              Chúng tôi cam kết duy trì Leanity là một sản phẩm hoạt động lâu dài thông qua mô hình tài trợ và cung cấp các gói lưu trữ mở rộng không bắt buộc. Mọi quyết định phát triển tính năng mới đều được thảo luận công khai cùng cộng đồng người dùng trên Discord và GitHub.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
