import { createBrowserClient } from '@supabase/ssr'

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'local-user@leanity.dev',
  user_metadata: {
    full_name: 'Local User'
  }
}

export function createClient() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return {
      auth: {
        getUser: async () => {
          const hasSession = typeof document !== 'undefined' && document.cookie.includes('sb-mock-session=true')
          return { data: { user: hasSession ? mockUser : null }, error: null }
        },
        signInWithPassword: async (data: any) => {
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-mock-session=true; path=/; max-age=31536000'
          }
          return { data: { user: mockUser }, error: null }
        },
        signUp: async (data: any) => {
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-mock-session=true; path=/; max-age=31536000'
          }
          return { data: { user: mockUser }, error: null }
        },
        signOut: async () => {
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
          return { error: null }
        },
        signInWithOAuth: async (options: any) => {
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-mock-session=true; path=/; max-age=31536000'
          }
          const redirectTo = options?.options?.redirectTo || '/workspace'
          window.location.href = redirectTo
          return { error: null }
        }
      },
      from: (_table: string) => {
        // Chainable mock query builder — hỗ trợ toàn bộ chuỗi gọi của Supabase như:
        // .from('x').select('y').eq('id', z).single()
        // .from('x').upsert({...}, { onConflict: 'id' })
        // .from('x').select('*').order('created_at').limit(10)
        const EMPTY = { data: null, error: null }
        const EMPTY_ARRAY = { data: [], error: null }
        const builder: any = {
          // Filter / modifier — tất cả trả về chính builder để tiếp tục chain
          select:      (_cols?: any) => builder,
          eq:          (_col: any, _val: any) => builder,
          neq:         (_col: any, _val: any) => builder,
          gt:          (_col: any, _val: any) => builder,
          lt:          (_col: any, _val: any) => builder,
          gte:         (_col: any, _val: any) => builder,
          lte:         (_col: any, _val: any) => builder,
          like:        (_col: any, _val: any) => builder,
          ilike:       (_col: any, _val: any) => builder,
          in:          (_col: any, _val: any) => builder,
          is:          (_col: any, _val: any) => builder,
          not:         (_col: any, _op: any, _val: any) => builder,
          filter:      (_col: any, _op: any, _val: any) => builder,
          or:          (_filters: any) => builder,
          order:       (_col: any, _opts?: any) => builder,
          limit:       (_n: any) => builder,
          range:       (_from: any, _to: any) => builder,
          match:       (_obj: any) => builder,
          contains:    (_col: any, _val: any) => builder,
          // Terminal methods — có thể await để lấy kết quả
          single:      () => Promise.resolve(EMPTY),
          maybeSingle: () => Promise.resolve(EMPTY),
          csv:         () => Promise.resolve({ data: '', error: null }),
          // Mutation methods — cũng trả về builder để hỗ trợ .select() sau upsert
          insert:      (_rows: any, _opts?: any) => builder,
          upsert:      (_rows: any, _opts?: any) => builder,
          update:      (_vals: any, _opts?: any) => builder,
          delete:      () => builder,
          // Cho phép await trực tiếp trên builder (không dùng .single())
          then:        (resolve: any) => Promise.resolve(EMPTY_ARRAY).then(resolve),
        }
        return builder
      }
    } as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

