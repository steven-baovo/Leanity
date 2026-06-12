import { 
  FileText, 
  Table, 
  Network, 
  Link as LinkIcon, 
  Folder, 
  Presentation,
  Globe,
  Video
} from 'lucide-react'

interface NodeIconData {
  icon: any // LucideIcon type
  color: string
}

/**
 * Hàm tự động nhận diện loại file và trả về Icon + Màu sắc phù hợp dựa trên URL và Type
 */
export function getNodeIconData(type: string, url?: string | null): NodeIconData {
  if (type === 'folder') return { icon: Folder, color: 'text-primary/70' }
  if (type === 'note') return { icon: FileText, color: 'text-secondary/70' }
  if (type === 'map') return { icon: Network, color: 'text-primary' }
  if (type === 'table') return { icon: Table, color: 'text-emerald-500' }
  
  if (!url) return { icon: LinkIcon, color: 'text-secondary/50' }

  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname

    if (hostname.includes('docs.google.com')) {
      if (url.includes('/document/')) {
        return { icon: FileText, color: 'text-blue-500' }
      }
      if (url.includes('/spreadsheets/')) {
        return { icon: Table, color: 'text-green-500' }
      }
      if (url.includes('/presentation/')) {
        return { icon: Presentation, color: 'text-orange-500' }
      }
    }
    
    // Nếu là YouTube, đổi sang dùng icon Video (vì icon Youtube bị lỗi export trong bản Lucide này)
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { icon: Video, color: 'text-red-500' }
    }

    return { icon: Globe, color: 'text-secondary/70' }
  } catch (e) {
    return { icon: LinkIcon, color: 'text-secondary/50' }
  }
}

export interface WorkspaceNode {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  type: 'folder' | 'note' | 'map' | 'link' | 'table'
  url?: string | null
  parent_id?: string | null
  order: number
  note_id?: string | null
  map_id?: string | null
  connected_node_ids?: string[] | null
}

export interface TreeNode extends WorkspaceNode {
  children: TreeNode[]
}

/**
 * Biến mảng phẳng từ Database thành cấu trúc cây
 */
export function buildTree(nodes: WorkspaceNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Khởi tạo map
  nodes.forEach(node => {
    map.set(node.id, { ...node, children: [] })
  })

  // Xây dựng cây
  nodes.forEach(node => {
    const treeNode = map.get(node.id)!
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  })

  // Sắp xếp thứ tự đa tầng ổn định chuẩn explorer (order -> folders first -> alphabetical)
  const sortNodes = (a: TreeNode, b: TreeNode) => {
    // 1. So sánh theo order (nếu order khác nhau)
    if (a.order !== b.order) {
      return a.order - b.order
    }

    // 2. Thư mục (folder) luôn xếp trên các loại file khác (note, map, link)
    const isAFolder = a.type === 'folder'
    const isBFolder = b.type === 'folder'
    if (isAFolder && !isBFolder) return -1
    if (!isAFolder && isBFolder) return 1

    // 3. Sắp xếp theo bảng chữ cái tiếng Việt (locale-aware, case-insensitive, hỗ trợ số tự nhiên)
    const titleA = a.title || ''
    const titleB = b.title || ''
    return titleA.localeCompare(titleB, 'vi', { sensitivity: 'base', numeric: true })
  }

  roots.sort(sortNodes)
  map.forEach(node => node.children.sort(sortNodes))

  return roots
}
