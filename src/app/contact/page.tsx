'use client'

import React, { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, MessageSquare, AlertCircle, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.name || !formState.email || !formState.message) {
      alert('Vui lòng điền đầy đủ tất cả các trường thông tin.')
      return
    }
    setSubmitted(true)
    setTimeout(() => {
      setFormState({ name: '', email: '', message: '' })
    }, 1000)
  }

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Liên hệ Leanity",
    "description": "Trang liên hệ chính thức của Leanity Labs. Gửi phản hồi, yêu cầu hỗ trợ kỹ thuật hoặc hợp tác phát triển.",
    "url": "https://leanitylabs.com/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "Leanity",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@leanity.com",
        "contactType": "customer support"
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-[#5e6ad2]/20 selection:text-[#5e6ad2] font-sans overflow-x-hidden relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-150px] left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-[-100px] right-1/4 w-[400px] h-[400px] rounded-full bg-[#5e6ad2]/5 blur-[100px]" />
      </div>

      <Header />

      <main className="flex-1 py-16 px-6 max-w-[1200px] mx-auto w-full flex flex-col">
        
        {/* Title Header */}
        <header className="space-y-4 mb-16 text-center max-w-xl mx-auto animate-in fade-in duration-300">
          <span className="text-[13px] font-bold text-[#5e6ad2] uppercase tracking-widest">
            Liên hệ & Đóng góp
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
            Kết nối với chúng tôi
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed font-normal">
            Chúng tôi luôn lắng nghe mọi phản hồi, đề xuất tính năng mới và các câu hỏi hợp tác từ phía bạn để phát triển Leanity.
          </p>
        </header>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-12">
          
          {/* Left Column: Form (7 cols) */}
          <section className="lg:col-span-7 bg-white border border-zinc-200 p-8 rounded-2xl shadow-subtle relative overflow-hidden">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-6">Gửi tin nhắn trực tiếp</h2>
            
            {submitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900">Gửi tin nhắn thành công!</h3>
                  <p className="text-[12px] text-zinc-500 font-normal leading-relaxed max-w-sm">
                    Cảm ơn bạn đã đóng góp phản hồi. Đội ngũ Leanity Labs sẽ phản hồi bạn qua địa chỉ email đăng ký sớm nhất có thể.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-bold rounded shadow-sm transition-colors cursor-pointer"
                >
                  Gửi tin nhắn mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 font-normal">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Họ và tên</label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Nguyễn Văn A"
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-10 px-3 rounded border border-zinc-200 bg-white text-[13px] placeholder-zinc-405 focus:outline-none focus:border-[#5e6ad2] transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Địa chỉ Email</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="email@vidu.com"
                      value={formState.email}
                      onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full h-10 px-3 rounded border border-zinc-200 bg-white text-[13px] placeholder-zinc-405 focus:outline-none focus:border-[#5e6ad2] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nội dung tin nhắn</label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Hãy cho chúng tôi biết bạn cần hỗ trợ gì hoặc có ý tưởng cải tiến nào..."
                    value={formState.message}
                    onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full p-3 rounded border border-zinc-200 bg-white text-[13px] placeholder-zinc-405 focus:outline-none focus:border-[#5e6ad2] transition-colors resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-[13px] font-bold rounded shadow-subtle flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <span>Gửi tin nhắn</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </section>

          {/* Right Column: Info & Channels (5 cols) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Quick channels */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-subtle space-y-4">
              <h2 className="text-[14px] font-bold text-zinc-900">Kênh hỗ trợ trực tiếp</h2>
              
              <div className="space-y-3 font-normal">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[#5e6ad2]/5 flex items-center justify-center text-[#5e6ad2] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-zinc-900">Email Hỗ trợ</h3>
                    <p className="text-[12px] text-zinc-400 font-normal">support@leanity.com</p>
                    <p className="text-[12px] text-zinc-500 font-normal mt-0.5 leading-relaxed">Chúng tôi trả lời trong vòng 24 giờ làm việc.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="w-8 h-8 rounded bg-[#5e6ad2]/5 flex items-center justify-center text-[#5e6ad2] shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-zinc-900">Cộng đồng Discord</h3>
                    <p className="text-[12px] text-zinc-400 font-normal">discord.gg/leanity</p>
                    <p className="text-[12px] text-zinc-500 font-normal mt-0.5 leading-relaxed">Nơi trao đổi ý tưởng và nhận trợ giúp trực tiếp từ nhà phát triển.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Policy Notice */}
            <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl space-y-3 font-normal">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#5e6ad2]" />
                <span>Báo lỗi bảo mật?</span>
              </h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed font-normal">
                Nếu phát hiện bất kỳ lỗ hổng bảo mật nào trong hệ thống đồng bộ Supabase hoặc Local Cache, vui lòng gửi trực tiếp báo cáo chi tiết đến email bảo mật: <span className="text-[#5e6ad2] font-semibold">security@leanity.com</span>. Chúng tôi vô cùng trân trọng đóng góp của bạn.
              </p>
            </div>

          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
