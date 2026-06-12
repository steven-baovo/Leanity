import React from 'react'
import { 
  BookOpen, 
  Target, 
  FileText, 
  Timer, 
  ShieldCheck, 
  Keyboard, 
  Sparkles, 
  Compass, 
  Cpu
} from 'lucide-react'

export type SectionId = 
  | 'bat-dau-nhanh-voi-leanity' 
  | 'dong-bo-hoa-va-thiet-lap-tai-khoan' 
  | 'quan-ly-tasks-va-chu-ky-lam-viec' 
  | 'xay-dung-thu-vien-tri-thuc-second-brain' 
  | 'phuong-phap-tap-trung-sau-pomodoro' 
  | 'bang-tra-cuu-phim-tat-nhanh' 
  | 'bi-mat-kich-hoat-trang-thai-dong-chay-flow-state'
  | 'he-thong-node-va-graph-view'

export interface DocSubheading {
  id: string
  title: string
}

export interface DocArticle {
  id: SectionId
  category: string
  categoryLabel: string
  title: string
  icon: React.ComponentType<any>
  description: string
  subheadings: DocSubheading[]
  content: React.ReactNode
}

export const articles: DocArticle[] = [
  {
    id: 'bat-dau-nhanh-voi-leanity',
    category: 'tutorials',
    categoryLabel: 'Hướng dẫn cơ bản',
    title: 'Bắt đầu nhanh với Leanity',
    icon: BookOpen,
    description: 'Chào mừng bạn đến với hệ sinh thái năng suất tinh gọn được thiết kế để giải phóng tiềm năng tư duy của bạn.',
    subheadings: [
      { id: 'triet-ly', title: '1. Triết lý thiết kế tinh gọn (Lean)' },
      { id: 'ba-tru-cot', title: '2. Hợp nhất ba trụ cột năng suất' },
      { id: 'giao-dien-tinh-lang', title: '3. Không gian làm việc tĩnh lặng' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="triet-ly" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Triết lý thiết kế tinh gọn (Lean)</h3>
          <p className="text-[13px] font-normal">
            Hệ thống làm việc truyền thống thường cồng kềnh với hàng chục menu, hộp thoại xác nhận và biểu đồ rối mắt. <strong>Leanity</strong> được thiết kế theo hướng tiếp cận ngược lại hoàn toàn: <strong>Zero Friction (Không ma sát)</strong>. Chúng tôi tin rằng công cụ làm việc tốt nhất là công cụ biến mất hoàn toàn khi bạn đang sử dụng nó, để lại một không gian tĩnh lặng tuyệt đối cho sự sáng tạo.
          </p>
          <div className="p-4 bg-[#5e6ad2]/5 border border-[#5e6ad2]/10 rounded flex items-start space-x-3 font-normal">
            <span className="text-[13px] text-[#5e6ad2] select-none font-normal">💡</span>
            <p className="text-zinc-600 text-[13px] font-normal">
              Mỗi mili-giây tải trang, mỗi cú nhấp chuột dư thừa đều tiêu tốn năng lượng ý chí (willpower) của bạn. Bằng cách giảm thiểu tối đa ma sát nhận thức, bạn sẽ duy trì được trạng thái tập trung sâu lâu hơn.
            </p>
          </div>
        </section>

        <section id="ba-tru-cot" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Hợp nhất ba trụ cột năng suất</h3>
          <p className="text-[13px] font-normal">
            Thay vì chuyển đổi qua lại giữa một phần mềm quản lý công việc, một ứng dụng ghi chép tài liệu, và một chiếc đồng hồ bấm giờ trên điện thoại, Leanity tích hợp cả 3 trên một màn hình duy nhất:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-[13px] font-normal">
            <li className="text-[13px] font-normal"><strong>Nhiệm vụ (Tasks):</strong> Xác định rõ những gì bạn cần làm trong chu kỳ thời gian.</li>
            <li className="text-[13px] font-normal"><strong>Tài liệu (Library):</strong> Nơi bạn viết sâu, nghiên cứu và xây dựng bộ não thứ hai phi tuyến tính.</li>
            <li className="text-[13px] font-normal"><strong>Đồng hồ Pomodoro:</strong> Bảo vệ chu kỳ tập trung cao độ 25 phút không bị ngắt quãng.</li>
          </ul>
        </section>

        <section id="giao-dien-tinh-lang" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Không gian làm việc tĩnh lặng</h3>
          <p className="text-[13px] font-normal">
            Khi đăng nhập vào Leanity Workspace, bạn sẽ cảm nhận được sự tối giản cao cấp. Không có pop-up quảng cáo, không có thống kê đè nén tâm lý. Mọi chi tiết từ màu nền trắng canvas, đường viền xám nhạt Zinc siêu mỏng 1px, cho đến các góc bo mặc định đồng đều 8px đều phục vụ một mục đích duy nhất: <strong>sự trầm tĩnh sâu sắc của tâm trí bạn.</strong>
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'dong-bo-hoa-va-thiet-lap-tai-khoan',
    category: 'tutorials',
    categoryLabel: 'Hướng dẫn cơ bản',
    title: 'Đồng bộ hóa & Thiết lập Tài khoản',
    icon: ShieldCheck,
    description: 'Tìm hiểu kiến trúc Local-First siêu tốc của Leanity và cách dữ liệu của bạn được lưu trữ an toàn tuyệt đối.',
    subheadings: [
      { id: 'local-first', title: '1. Kiến trúc Local-First vận hành dưới 5ms' },
      { id: 'dong-bo-dam-may', title: '2. Đồng bộ ngầm với Supabase' },
      { id: 'an-toan-du-lieu', title: '3. Bảo mật & Sở hữu dữ liệu' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="local-first" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Kiến trúc Local-First vận hành dưới 5ms</h3>
          <p className="text-[13px] font-normal">
            Tất cả các thao tác của bạn trên Leanity (như thêm task, sửa chữ tài liệu, bắt đầu đồng hồ) đều phản hồi <strong>ngay lập tức (dưới 5 mili-giây)</strong>. Chúng tôi đạt được điều này thông qua kiến trúc **Local-First** - lưu trữ toàn bộ dữ liệu làm việc trực tiếp vào cơ sở dữ liệu IndexedDB tích hợp sẵn trong trình duyệt của bạn thay vì chờ đợi máy chủ đám mây phản hồi.
          </p>
        </section>

        <section id="dong-bo-dam-may" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Đồng bộ ngầm với Supabase</h3>
          <p className="text-[13px] font-normal">
            Dù chạy offline, dữ liệu của bạn vẫn an toàn tuyệt đối. Ngay khi thiết bị có kết nối mạng ổn định, Leanity Sync Engine sẽ âm thầm đồng bộ hóa tất cả các thay đổi từ IndexedDB lên đám mây bảo mật được vận hành bởi **Supabase** ở chế độ nền. Bạn hoàn toàn không cần nhấp bất kỳ nút lưu hay đồng bộ nào.
          </p>
        </section>

        <section id="an-toan-du-lieu" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Bảo mật & Sở hữu dữ liệu</h3>
          <p className="text-[13px] font-normal">
            Quyền sở hữu tài liệu và công việc thuộc về bạn. Chúng tôi mã hóa đường truyền kết nối và bảo mật thông tin tài khoản thông qua giao thức Supabase Auth tiêu chuẩn quân đội, ngăn chặn hoàn toàn việc rò rỉ hoặc thu thập dữ liệu bất hợp pháp.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'quan-ly-tasks-va-chu-ky-lam-viec',
    category: 'features',
    categoryLabel: 'Tính năng chi tiết',
    title: 'Quản lý Nhiệm vụ & Chu kỳ',
    icon: Target,
    description: 'Làm chủ dòng chảy nhiệm vụ tinh gọn bằng trạng thái phân cấp logic và chu kỳ tập trung năng suất.',
    subheadings: [
      { id: 'he-thong-trang-thai', title: '1. Hệ thống 5 Trạng thái Nhiệm vụ' },
      { id: 'chu-ky-cycles', title: '2. Lập kế hoạch theo Chu kỳ (Cycles)' },
      { id: 'van-toc-velocity', title: '3. Đo lường Vận tốc hoàn thành' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="he-thong-trang-thai" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Hệ thống 5 Trạng thái Nhiệm vụ</h3>
          <p className="text-[13px] font-normal">
            Để giảm bớt ma sát quyết định, Leanity phân chia công việc bắt buộc thành 5 trạng thái tinh gọn duy nhất:
          </p>
          <div className="space-y-2 font-normal">
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-200 rounded font-normal">
              <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 text-[13px] font-normal uppercase tracking-wider">Backlog</span>
              <span className="text-[13px] text-zinc-500 font-normal">Ý tưởng, đầu việc dự thảo chưa lên lịch thực hiện cụ thể.</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-200 rounded font-normal">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[13px] font-normal uppercase tracking-wider">Todo</span>
              <span className="text-[13px] text-zinc-500 font-normal">Nhiệm vụ đã được duyệt, sẵn sàng bắt tay vào làm bất kỳ lúc nào.</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-200 rounded font-normal">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[13px] font-normal uppercase tracking-wider">In Progress</span>
              <span className="text-[13px] text-zinc-500 font-normal">Đầu việc đang trực tiếp được xử lý lúc này. Hãy giữ trạng thái này cực kỳ giới hạn (WIP limit).</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-200 rounded font-normal">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[13px] font-normal uppercase tracking-wider">Done</span>
              <span className="text-[13px] text-zinc-500 font-normal">Nhiệm vụ hoàn thành xuất sắc và được lưu trữ lịch sử để tính năng suất.</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-200 rounded font-normal">
              <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-400 text-[13px] font-normal uppercase tracking-wider line-through">Canceled</span>
              <span className="text-[13px] text-zinc-500 font-normal">Nhiệm vụ bị hủy bỏ để danh sách công việc của bạn luôn được sạch sẽ nhất.</span>
            </div>
          </div>
        </section>

        <section id="chu-ky-cycles" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Lập kế hoạch theo Chu kỳ (Cycles)</h3>
          <p className="text-[13px] font-normal">
            Thay vì tạo ra các mốc hạn cuối (deadlines) đè nặng tâm lý, Leanity chia nhỏ thời gian làm việc theo từng **Chu kỳ (Cycles)** 1 hoặc 2 tuần. Bạn chọn một số lượng task nhất định cho chu kỳ này và cố gắng hoàn thành trong khoảng thời gian tĩnh lặng, các task chưa xong khi hết chu kỳ sẽ gối đầu sang chu kỳ sau hoặc quay về Backlog một cách tự nhiên.
          </p>
        </section>

        <section id="van-toc-velocity" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Đo lường Vận tốc hoàn thành</h3>
          <p className="text-[13px] font-normal">
            Khi mỗi chu kỳ khép lại, hệ thống ghi nhận số lượng nhiệm vụ bạn hoàn thành thực tế để tính toán chỉ số **Vận tốc (Velocity)**. Chỉ số này sẽ giúp bạn lên kế hoạch khối lượng công việc thực tế, chính xác hơn cho các chu kỳ tiếp theo mà không tự làm quá tải bản thân.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'xay-dung-thu-vien-tri-thuc-second-brain',
    category: 'features',
    categoryLabel: 'Tính năng chi tiết',
    title: 'Bộ não thứ hai & Thư viện',
    icon: FileText,
    description: 'Lưu trữ thông tin phi cấu trúc linh hoạt và kết nối các khối kiến thức tự nhiên như tư duy não bộ.',
    subheadings: [
      { id: 'lien-ket-hai-chieu', title: '1. Liên kết hai chiều (Bidirectional Links)' },
      { id: 'so-do-mang-luoi', title: '2. Bản đồ mạng lưới tư duy (Graph View)' },
      { id: 'bo-nao-thu-hai', title: '3. Triết lý tổ chức bộ não thứ hai' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="lien-ket-hai-chieu" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Liên kết hai chiều (Bidirectional Links)</h3>
          <p className="text-[13px] font-normal">
            Lấy cảm hứng từ Capacities và Obsidian, thư viện ghi chép của Leanity hoạt động không chỉ dựa trên cây thư mục phân cấp thông thường, mà còn có **Liên kết 2 chiều**. Khi bạn viết tài liệu A và liên kết đến tài liệu B bằng cách chèn tag hoặc liên kết trực tiếp, Leanity sẽ tự động tạo một đường liên kết ngược ở cuối tài liệu B (Backlinks). Việc này tạo ra dòng liên kết ý tưởng đa chiều, tự nhiên.
          </p>
        </section>

        <section id="so-do-mang-luoi" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Bản đồ mạng lưới tư duy (Graph View)</h3>
          <p className="text-[13px] font-normal">
            Tính năng **Graph View** trực quan hóa toàn bộ ghi chú và tài liệu trong không gian làm việc của bạn dưới dạng các nút liên kết mạng lưới (Nodes). Những chủ đề tài liệu được liên kết nhiều nhất sẽ phình to ra một cách tự nhiên, giúp bạn dễ dàng nhận diện đâu là tâm điểm của tri thức và khám phá các liên kết tiềm năng mới.
          </p>
        </section>

        <section id="bo-nao-thu-hai" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Triết lý tổ chức bộ não thứ hai</h3>
          <p className="text-[13px] font-normal">
            Bộ não con người cực kỳ giỏi trong việc sáng tạo ra các ý tưởng nhưng lại rất kém trong việc lưu trữ chúng một cách hoàn hảo. Bằng cách ghi lại mọi kiến thức, dự án, cuộc gọi vào thư viện Leanity, bạn đang chuyển tải bớt áp lực lưu trữ ra bên ngoài, giải phóng tài nguyên tư duy để bộ não của bạn tập trung 100% vào việc xử lý các thử thách hiện tại.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'phuong-phap-tap-trung-sau-pomodoro',
    category: 'features',
    categoryLabel: 'Tính năng chi tiết',
    title: 'Đồng hồ Pomodoro & Tập trung sâu',
    icon: Timer,
    description: 'Phương pháp phân bổ thời gian tập trung chuẩn khoa học để loại bỏ xao nhãng và khôi phục nhịp độ trầm tĩnh.',
    subheadings: [
      { id: 'chu-ky-pomo', title: '1. Khoa học đằng sau chu kỳ 25/5' },
      { id: 'chan-xao-nhang', title: '2. Loại bỏ hoàn toàn sự xao nhãng' },
      { id: 'thong-ke-nang-suat', title: '3. Thống kê năng suất trầm tĩnh' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="chu-ky-pomo" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Khoa học đằng sau chu kỳ 25/5</h3>
          <p className="text-[13px] font-normal">
            Nhịp sinh học của não bộ chỉ có thể duy trì sự tập trung tối đa trong khoảng 25-30 phút trước khi năng lực nhận thức bắt đầu suy giảm. Leanity áp dụng đồng hồ đếm ngược Pomodoro tiêu chuẩn: <strong>25 phút tập trung sâu</strong> tuyệt đối dành cho một nhiệm vụ duy nhất, sau đó là <strong>5 phút nghỉ ngắn</strong> để đứng dậy, uống nước hoặc vươn vai thư giãn mắt.
          </p>
        </section>

        <section id="chan-xao-nhang" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Loại bỏ hoàn toàn sự xao nhãng</h3>
          <p className="text-[13px] font-normal">
            Đồng hồ Pomodoro trên Leanity được thiết kế tối giản, yên tĩnh. Không có âm thanh rè rè, không có các quảng cáo chen ngang. Khi kích hoạt đồng hồ, bạn sẽ chọn một đầu việc cụ thể đang làm, giúp tâm trí neo giữ đúng mục tiêu đang xử lý và tránh xa cám dỗ chuyển đổi tab hoặc lướt điện thoại.
          </p>
        </section>

        <section id="thong-ke-nang-suat" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Thống kê năng suất trầm tĩnh</h3>
          <p className="text-[13px] font-normal">
            Mỗi chu kỳ tập trung hoàn thành sẽ được ghi nhận vào cơ sở dữ liệu IndexedDB. Leanity tự động tổng hợp để xây dựng biểu đồ phản ánh thời lượng làm việc hiệu quả nhất của bạn trong ngày, giúp bạn thấu hiểu nhịp sinh học và tối ưu hóa thời gian biểu cá nhân.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'bang-tra-cuu-phim-tat-nhanh',
    category: 'guides',
    categoryLabel: 'Mẹo & Hướng dẫn',
    title: 'Hệ thống Phím tắt nhanh',
    icon: Keyboard,
    description: 'Làm việc thần tốc như các lập trình viên chuyên nghiệp bằng cách loại bỏ việc di chuyển chuột.',
    subheadings: [
      { id: 'phim-tat-chung', title: '1. Phím tắt điều hướng chung' },
      { id: 'phim-tat-task', title: '2. Thao tác nhiệm vụ nhanh' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="phim-tat-chung" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Phím tắt điều hướng chung</h3>
          <p className="text-[13px] font-normal">
            Thao tác bàn phím luôn mang lại tốc độ vượt trội so với việc phải rời tay khỏi bàn phím để di chuột. Dưới đây là bảng phím tắt điều hướng cốt lõi:
          </p>
          <table className="w-full text-left border-collapse text-[13px] mt-2 border border-zinc-200 font-normal">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 font-normal">
                <th className="p-2 font-normal text-zinc-800">Tổ hợp phím</th>
                <th className="p-2 font-normal text-zinc-800">Hành động thực hiện</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">Ctrl + K / ⌘ + K</td>
                <td className="p-2 font-normal">Mở Command Palette tìm kiếm nhanh tài liệu</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">Alt + W</td>
                <td className="p-2 font-normal">Chuyển nhanh sang không gian Workspace chính</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">Alt + D</td>
                <td className="p-2 font-normal">Đến trang tài liệu hướng dẫn (Docs)</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">Alt + P</td>
                <td className="p-2 font-normal">Mở nhanh đồng hồ tập trung Pomodoro</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="phim-tat-task" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Thao tác nhiệm vụ nhanh</h3>
          <p className="text-[13px] font-normal">
            Khi ở trong màn hình Quản lý Nhiệm vụ, bạn có thể thực hiện nhanh các lệnh tạo mới hoặc gán thẻ mà không cần rê chuột:
          </p>
          <table className="w-full text-left border-collapse text-[13px] mt-2 border border-zinc-200 font-normal">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 font-normal">
                <th className="p-2 font-normal text-zinc-800">Tổ hợp phím</th>
                <th className="p-2 font-normal text-zinc-800">Hành động thực hiện</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">N</td>
                <td className="p-2 font-normal">Tạo một nhiệm vụ (Task) mới tức thì</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">P + 1</td>
                <td className="p-2 font-normal">Gán mức độ ưu tiên cao (High Priority)</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">P + 2</td>
                <td className="p-2 font-normal">Gán mức độ ưu tiên trung bình (Medium Priority)</td>
              </tr>
              <tr className="border-b border-zinc-150 font-normal">
                <td className="p-2 font-mono text-[#5e6ad2] bg-[#5e6ad2]/5 font-normal">D</td>
                <td className="p-2 font-normal">Chuyển trạng thái nhiệm vụ được chọn sang Done</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    )
  },
  {
    id: 'bi-mat-kich-hoat-trang-thai-dong-chay-flow-state',
    category: 'guides',
    categoryLabel: 'Mẹo & Hướng dẫn',
    title: 'Làm chủ Trạng thái Dòng chảy',
    icon: Sparkles,
    description: 'Khám phá bí mật tâm lý học đằng sau hiệu suất làm việc cao nhất và ngăn chặn sự phân rã nhận thức.',
    subheadings: [
      { id: 'dieu-kien-flow', title: '1. Điều kiện kích hoạt Trạng thái Dòng chảy' },
      { id: 'ngan-chuyen-canh', title: '2. Tác hại khủng khiếp của Context Switching' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="dieu-kien-flow" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Điều kiện kích hoạt Trạng thái Dòng chảy</h3>
          <p className="text-[13px] font-normal">
            <strong>Trạng thái Dòng chảy (Flow State)</strong> là đỉnh cao của sự tập trung, nơi cái tôi hoàn toàn biến mất và hiệu suất của bạn đạt mức tối đa. Theo giáo sư Mihaly Csikszentmihalyi, để kích hoạt trạng thái này bạn cần 3 điều kiện:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-[13px] font-normal">
            <li className="text-[13px] font-normal"><strong>Mục tiêu rõ ràng:</strong> Biết chính xác mình phải làm gì tiếp theo trong từng phút.</li>
            <li className="text-[13px] font-normal"><strong>Không bị đứt gãy tương tác:</strong> Công cụ làm việc phản hồi mượt mà không có độ trễ tải trang.</li>
            <li className="text-[13px] font-normal"><strong>Cân bằng thử thách:</strong> Nhiệm vụ đủ thử thách để tập trung cao độ nhưng không quá khó dẫn đến chán nản.</li>
          </ul>
        </section>

        <section id="ngan-chuyen-canh" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Tác hại khủng khiếp của Context Switching</h3>
          <p className="text-[13px] font-normal">
            Mỗi khi bạn chuyển tab sang mạng xã hội hoặc trả lời một email không liên quan, não bộ của bạn phải chịu ma sát chuyển đổi ngữ cảnh. Nghiên cứu khoa học chỉ ra phải mất trung bình <strong>23 phút 15 giây</strong> để bộ não quay lại trạng thái tập trung sâu ban đầu. Việc hợp nhất Tasks, Library và Pomodoro trong không gian Leanity sinh ra để triệt tiêu triệt để sự rò rỉ nhận thức này.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'he-thong-node-va-graph-view',
    category: 'features',
    categoryLabel: 'Tính năng chi tiết',
    title: 'Hệ thống Node & Graph View',
    icon: Compass,
    description: 'Tìm hiểu kiến trúc liên kết phi tuyến tính dựa trên các Node và cách tương tác trực quan qua Graph View trong Leanity.',
    subheadings: [
      { id: 'khai-niem-node', title: '1. Khái niệm Node trong Leanity' },
      { id: 'lien-ket-cac-node', title: '2. Cách thức liên kết các Node' },
      { id: 'su-dung-graph-view', title: '3. Hướng dẫn sử dụng Graph View' }
    ],
    content: (
      <div className="space-y-6 text-[13px] text-zinc-600 leading-relaxed font-normal">
        <section id="khai-niem-node" className="scroll-mt-20 space-y-3 font-normal">
          <h3 className="text-base font-bold text-zinc-950">1. Khái niệm Node trong Leanity</h3>
          <p className="text-[13px] font-normal">
            Trong Leanity, triết lý thiết kế hướng tới việc tổ chức thông tin phi tuyến tính và thống nhất. Do đó, <strong>tất cả các phần tử trong thư viện (library) của bạn đều là các Node</strong>. Bất kể đó là gì, chúng đều có chung một cấu trúc cơ bản và khả năng liên kết chéo mạnh mẽ:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-[13px] font-normal">
            <li className="text-[13px] font-normal"><strong>Folder (Thư mục):</strong> Node đóng vai trò là container cha dùng để sắp xếp phân cấp cây thư mục.</li>
            <li className="text-[13px] font-normal"><strong>Note (Ghi chú):</strong> Node chứa văn bản, ghi chép và các đoạn tài liệu chi tiết.</li>
            <li className="text-[13px] font-normal"><strong>Canvas (Bản đồ/Mindmap):</strong> Node dạng sơ đồ bảng tự do nơi bạn kết nối trực quan các ý tưởng.</li>
            <li className="text-[13px] font-normal"><strong>Link (Liên kết):</strong> Node lưu trữ các liên kết web ngoại vi hoặc bookmark tham chiếu nhanh.</li>
          </ul>
        </section>

        <section id="lien-ket-cac-node" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">2. Cách thức liên kết các Node</h3>
          <p className="text-[13px] font-normal">
            Để tạo dựng bộ não thứ hai liên kết chặt chẽ, bạn có thể thực hiện liên kết giữa các Node thông qua các cách sau:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-[13px] font-normal">
            <li className="text-[13px] font-normal">
              <strong>Add link trong Editor:</strong> Khi đang soạn thảo ghi chú, hãy bôi đen văn bản hoặc click chuột phải chọn <strong>Add link</strong>, hoặc gõ nhanh ký tự <code>[[</code> để tìm kiếm và chèn nhanh liên kết tới một node khác.
            </li>
            <li className="text-[13px] font-normal">
              <strong>Nút bấm kết nối:</strong> Bấm vào nút liên kết trực tiếp trên giao diện Workspace hoặc Sidebar để gán các Node liên quan với nhau.
            </li>
          </ul>
        </section>

        <section id="su-dung-graph-view" className="scroll-mt-20 space-y-3 pt-4 font-normal">
          <h3 className="text-base font-bold text-zinc-950">3. Hướng dẫn sử dụng Graph View</h3>
          <p className="text-[13px] font-normal">
            <strong>Graph View</strong> là bản đồ 2D tương tác trực quan hiển thị toàn bộ mối quan hệ chéo giữa các Node của bạn. Đây là nơi bạn nhìn thấy tri thức của mình phát triển và liên kết theo cách tự nhiên nhất:
          </p>
          <div className="p-4 bg-[#5e6ad2]/5 border border-[#5e6ad2]/10 rounded flex items-start space-x-3 font-normal">
            <span className="text-[13px] text-[#5e6ad2] select-none font-normal">✨</span>
            <div className="text-zinc-600 text-[13px] font-normal space-y-2">
              <p className="font-bold">Các tương tác chính trên Graph View:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Truy cập nhanh (Double Click):</strong> Nhấp đúp chuột vào bất kỳ Node nào trên sơ đồ để chuyển hướng truy cập trực tiếp vào chi tiết của Node đó. Việc dùng click đúp giúp bạn không bị chuyển trang đột ngột khi chỉ muốn nhấp chọn hoặc kéo sắp xếp node.</li>
                <li><strong>Kết nối siêu tốc (Shift + Drag):</strong> Giữ phím <code>Shift</code> và kéo chuột từ Node này thả vào Node kia để kết nối chúng ngay lập tức ngay trên sơ đồ mà không cần thông qua menu chỉnh sửa.</li>
                <li><strong>Chế độ Kết nối (Connect Mode):</strong> Bạn cũng có thể click vào nút <em>"Kết nối node"</em> ở góc trên bên phải sơ đồ để bật chế độ kết nối và thực hiện kéo thả liên kết mà không cần giữ phím Shift.</li>
                <li><strong>Zoom & Pan:</strong> Dùng con lăn chuột để thu phóng sơ đồ. Khi thu nhỏ ở khoảng cách xa, nhãn tên của node sẽ ẩn đi để tránh rối mắt, và tự động hiện lại khi bạn phóng to đến gần.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    )
  }
]
