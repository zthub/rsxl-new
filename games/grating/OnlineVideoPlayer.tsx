
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { ListVideo, Maximize2, Eye, EyeOff, Folder, FolderPlus, FileVideo, Plus, Trash2, Edit2, Download, Upload as UploadIcon, ChevronRight, ChevronDown } from 'lucide-react';

interface VideoSource {
    id: string;
    title: string;
    url: string;
}

// 自定义播放列表数据结构
interface CustomVideoItem {
    id: string;
    title: string;
    url: string;
}

interface CustomFolder {
    id: string;
    name: string;
    children: (CustomFolder | CustomVideoItem)[];
}

type CustomPlaylistNode = CustomFolder | CustomVideoItem;

// 判断是否为文件夹
const isFolder = (node: CustomPlaylistNode): node is CustomFolder => {
    return 'children' in node;
};

const VIDEO_LIST: VideoSource[] = [
    {
        id: 'donkey',
        title: '小毛驴儿歌',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=663702413&bvid=BV1ya4y1U7o1&cid=1340037362&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'english-songs',
        title: '英语启蒙歌曲 (15首)',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=115553779844782&bvid=BV1jJCyB8EmD&cid=34027145271&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'animal-kingdom',
        title: '动物王国大冒险',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=311657791&bvid=BV1uN411T7um&cid=1072609515&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'spring-where',
        title: '春天在哪里',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=94915347&bvid=BV1ZE411K7hG&cid=162033842&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'spring-where-en',
        title: '春天在哪里 (英文版)',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=1402657882&bvid=BV1jr421t7GD&cid=1489517027&p=1&high_quality=1&danmaku=0"
    }
];

const STORAGE_KEY = 'customVideoPlaylist';

export const OnlineVideoPlayer: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const [currentVideo, setCurrentVideo] = useState<VideoSource>(VIDEO_LIST[0]);
    const [showMenu, setShowMenu] = useState(false);
    const [showCustomPlaylist, setShowCustomPlaylist] = useState(false);
    
    // 自定义播放列表状态
    const [customPlaylist, setCustomPlaylist] = useState<CustomFolder[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [editingNode, setEditingNode] = useState<{ id: string; type: 'folder' | 'video'; parentPath: string[] } | null>(null);
    const [newNodeData, setNewNodeData] = useState<{ name: string; url?: string }>({ name: '', url: '' });
    
    // 视力类型：视觉刺激 / 立体视，从本地存储读取上次保存的值
    const [visionType, setVisionType] = useState<'visual' | 'stereo'>(() => {
        const saved = localStorage.getItem('gratingPlayerVisionType');
        if (saved === 'visual' || saved === 'stereo') {
            return saved;
        }
        return 'visual';
    });

    // 视频窗口大小状态
    const [videoSize, setVideoSize] = useState({ width: 480, height: 270 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{ x: number; y: number; startWidth: number; startHeight: number } | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    
    // 透明度状态（视觉刺激时：调视频整体透明度；立体视时：调红蓝遮罩透明度）
    const [opacity, setOpacity] = useState(1.0);
    const [showOpacityControl, setShowOpacityControl] = useState(false);

    // 当切换为立体视时，将遮罩默认透明度设置为 80%；切回视觉刺激则恢复为 100%
    useEffect(() => {
        if (visionType === 'stereo') {
            setOpacity(0.8);
        } else {
            setOpacity(1.0);
        }
    }, [visionType]);

    // 背景动画 / 静态背景循环
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (visionType === 'stereo') {
            // 立体视：使用简单静态背景（深灰渐变），不再使用动态视觉刺激背景
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#020617');
            gradient.addColorStop(1, '#111827');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            // 视觉刺激：保持原来的动态背景
            frameCountRef.current++;
            renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        }
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, visionType]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    // 从localStorage加载自定义播放列表
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setCustomPlaylist(Array.isArray(parsed) ? parsed : []);
            }
        } catch (err) {
            console.error('加载自定义播放列表失败:', err);
        }
    }, []);

    // 保存自定义播放列表到localStorage
    const saveCustomPlaylist = (playlist: CustomFolder[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
            setCustomPlaylist(playlist);
        } catch (err) {
            console.error('保存自定义播放列表失败:', err);
            alert('保存失败，数据可能过大');
        }
    };

    // 生成唯一ID
    const generateId = () => {
        return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // 根据路径查找节点
    const findNodeByPath = (path: string[], root: CustomFolder[]): CustomPlaylistNode | null => {
        if (path.length === 0) return null;
        let current: CustomPlaylistNode[] = root;
        for (let i = 0; i < path.length; i++) {
            const id = path[i];
            const node = current.find(n => n.id === id);
            if (!node) return null;
            if (i === path.length - 1) return node;
            if (isFolder(node)) {
                current = node.children;
            } else {
                return null;
            }
        }
        return null;
    };

    // 根据路径查找父节点
    const findParentByPath = (path: string[], root: CustomFolder[]): (CustomFolder | CustomVideoItem)[] | null => {
        if (path.length === 0) return root;
        let current: (CustomFolder | CustomVideoItem)[] = root;
        for (let i = 0; i < path.length - 1; i++) {
            const id = path[i];
            const node = current.find(n => n.id === id);
            if (!node || !isFolder(node)) return null;
            current = node.children;
        }
        return current;
    };

    // 添加文件夹
    const addFolder = (parentPath: string[]) => {
        const newFolder: CustomFolder = {
            id: generateId(),
            name: '新文件夹',
            children: []
        };
        const updated = [...customPlaylist];
        if (parentPath.length === 0) {
            updated.push(newFolder);
        } else {
            const parent = findNodeByPath(parentPath, updated);
            if (parent && isFolder(parent)) {
                parent.children.push(newFolder);
            }
        }
        saveCustomPlaylist(updated);
        setEditingNode({ id: newFolder.id, type: 'folder', parentPath });
        setNewNodeData({ name: '新文件夹' });
    };

    // 添加视频
    const addVideo = (parentPath: string[]) => {
        const newVideo: CustomVideoItem = {
            id: generateId(),
            title: '新视频',
            url: ''
        };
        const updated = [...customPlaylist];
        if (parentPath.length === 0) {
            // 不能直接在根目录添加视频，需要先创建文件夹
            return;
        } else {
            const parent = findNodeByPath(parentPath, updated);
            if (parent && isFolder(parent)) {
                parent.children.push(newVideo);
            }
        }
        saveCustomPlaylist(updated);
        setEditingNode({ id: newVideo.id, type: 'video', parentPath });
        setNewNodeData({ name: '新视频', url: '' });
    };

    // 删除节点
    const deleteNode = (path: string[]) => {
        if (!confirm('确定要删除吗？')) return;
        const updated = [...customPlaylist];
        if (path.length === 1) {
            const index = updated.findIndex(n => n.id === path[0]);
            if (index !== -1) {
                updated.splice(index, 1);
            }
        } else {
            const parent = findParentByPath(path, updated);
            if (parent) {
                const index = parent.findIndex(n => n.id === path[path.length - 1]);
                if (index !== -1) {
                    parent.splice(index, 1);
                }
            }
        }
        saveCustomPlaylist(updated);
    };

    // 更新节点
    const updateNode = (path: string[], updates: { name?: string; url?: string }) => {
        // 如果是视频节点且包含URL，验证是否为抖音链接
        if (updates.url !== undefined && updates.url.trim()) {
            if (isDouyinVideo(updates.url)) {
                alert('无法保存：抖音视频不支持iframe嵌入，请使用其他视频平台的链接（如B站等）');
                return;
            }
        }
        
        const updated = [...customPlaylist];
        const node = findNodeByPath(path, updated);
        if (node) {
            if (isFolder(node)) {
                if (updates.name !== undefined) {
                    node.name = updates.name;
                }
            } else {
                if (updates.name !== undefined) {
                    node.title = updates.name;
                }
                if (updates.url !== undefined) {
                    // 保存时提取URL（但保存原始输入，以便用户可以看到）
                    // 实际播放时会在selectVideo中处理
                    node.url = updates.url;
                }
            }
        }
        saveCustomPlaylist(updated);
        setEditingNode(null);
        setNewNodeData({ name: '', url: '' });
    };

    // 切换文件夹展开/收起
    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    // 检测是否为抖音视频链接
    const isDouyinVideo = (url: string): boolean => {
        if (!url || !url.trim()) return false;
        
        const trimmed = url.trim().toLowerCase();
        
        // 检查是否包含抖音域名
        // 抖音短链：v.douyin.com
        // 抖音完整链接：www.douyin.com 或 douyin.com
        // 抖音视频链接：douyin.com/video/
        if (trimmed.includes('v.douyin.com') || 
            trimmed.includes('douyin.com/video/') ||
            (trimmed.includes('douyin.com') && trimmed.includes('/video/'))) {
            return true;
        }
        
        // 检查iframe标签中的src是否包含抖音链接
        const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            const srcUrl = srcMatch[1].toLowerCase();
            if (srcUrl.includes('v.douyin.com') || 
                srcUrl.includes('douyin.com/video/') ||
                (srcUrl.includes('douyin.com') && srcUrl.includes('/video/'))) {
                return true;
            }
        }
        
        return false;
    };

    // 从iframe标签中提取src属性，并处理抖音链接
    const extractUrlFromIframe = (input: string): string => {
        if (!input || !input.trim()) return '';
        
        const trimmed = input.trim();
        
        // 尝试从iframe标签中提取src
        // 匹配 src="..." 或 src='...'
        const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
        let url = srcMatch && srcMatch[1] ? srcMatch[1] : trimmed;
        
        // 处理抖音短链和链接
        // 抖音短链格式：https://v.douyin.com/xxxxx/ 或 https://v.douyin.com/xxxxx
        if (url.includes('v.douyin.com/')) {
            // 提取短链中的ID部分
            const douyinShortMatch = url.match(/v\.douyin\.com\/([^\/\?]+)/);
            if (douyinShortMatch && douyinShortMatch[1]) {
                // 抖音短链需要跳转到真实页面获取视频ID，但我们可以尝试直接使用短链
                // 或者提示用户使用完整链接
                // 这里我们返回短链，让用户知道需要手动获取完整链接
                return url;
            }
        }
        
        // 处理抖音完整视频链接
        // 格式：https://www.douyin.com/video/视频ID
        if (url.includes('douyin.com/video/')) {
            // 提取视频ID
            const douyinVideoMatch = url.match(/douyin\.com\/video\/([^\/\?]+)/);
            if (douyinVideoMatch && douyinVideoMatch[1]) {
                // 返回可用于嵌入的链接（抖音可能不支持直接iframe，但先返回）
                return url;
            }
        }
        
        // 如果已经是URL格式（以http://或https://或//开头），直接返回
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            return url;
        }
        
        // 如果没有匹配到，返回原始值（可能是其他格式）
        return trimmed;
    };

    // 选择视频播放
    const selectVideo = (video: CustomVideoItem) => {
        // 提取并处理URL
        const processedUrl = extractUrlFromIframe(video.url);
        
        const videoSource: VideoSource = {
            id: video.id,
            title: video.title,
            url: processedUrl
        };
        setCurrentVideo(videoSource);
        setShowMenu(false);
        setShowCustomPlaylist(false);
    };

    // 导出播放列表
    const exportPlaylist = () => {
        try {
            const dataStr = JSON.stringify(customPlaylist, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `custom-playlist-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('导出失败:', err);
            alert('导出失败');
        }
    };

    // 导入播放列表
    const importPlaylist = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target?.result as string) as CustomFolder[];
                    if (!Array.isArray(imported)) {
                        alert('导入文件格式错误');
                        return;
                    }
                    // 合并播放列表
                    const merged = mergePlaylists(customPlaylist, imported);
                    saveCustomPlaylist(merged);
                    alert('导入成功！');
                } catch (err) {
                    console.error('导入失败:', err);
                    alert('导入失败，文件格式错误');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // 合并播放列表（自动合并相同层级的目录）
    const mergePlaylists = (existing: CustomFolder[], imported: CustomFolder[]): CustomFolder[] => {
        const result = [...existing];
        const existingMap = new Map<string, CustomFolder>();
        existing.forEach(folder => {
            existingMap.set(folder.name.toLowerCase(), folder);
        });

        imported.forEach(importedFolder => {
            const key = importedFolder.name.toLowerCase();
            const existingFolder = existingMap.get(key);
            if (existingFolder && isFolder(existingFolder)) {
                // 合并子节点
                existingFolder.children = mergeNodes(existingFolder.children, importedFolder.children) as (CustomFolder | CustomVideoItem)[];
            } else {
                // 添加新文件夹
                result.push(importedFolder);
            }
        });

        return result;
    };

    // 合并节点数组
    const mergeNodes = (existing: CustomPlaylistNode[], imported: CustomPlaylistNode[]): CustomPlaylistNode[] => {
        const result = [...existing];
        const existingMap = new Map<string, CustomPlaylistNode>();
        existing.forEach(node => {
            const key = isFolder(node) ? node.name.toLowerCase() : node.title.toLowerCase();
            existingMap.set(key, node);
        });

        imported.forEach(importedNode => {
            const key = isFolder(importedNode) ? importedNode.name.toLowerCase() : importedNode.title.toLowerCase();
            const existingNode = existingMap.get(key);
            if (existingNode) {
                if (isFolder(existingNode) && isFolder(importedNode)) {
                    // 合并文件夹
                    existingNode.children = mergeNodes(existingNode.children, importedNode.children) as (CustomFolder | CustomVideoItem)[];
                }
                // 如果是视频，跳过（不重复添加）
            } else {
                // 添加新节点
                result.push(importedNode);
            }
        });

        return result;
    };

    // 渲染播放列表树
    const renderPlaylistTree = (nodes: CustomPlaylistNode[], path: string[] = [], level: number = 0): React.ReactNode => {
        return nodes.map((node) => {
            const currentPath = [...path, node.id];
            const isExpanded = isFolder(node) && expandedFolders.has(node.id);
            const isEditing = editingNode?.id === node.id;

            if (isFolder(node)) {
                return (
                    <div key={node.id} className="select-none">
                        <div 
                            className={`flex items-center gap-2 px-2 py-1.5 rounded group ${
                                isEditing ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-100 cursor-pointer'
                            }`}
                            style={{ paddingLeft: `${level * 20 + 8}px` }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isEditing) {
                                        toggleFolder(node.id);
                                    }
                                }}
                                className="w-4 h-4 flex items-center justify-center"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-600" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                )}
                            </button>
                            <Folder className="w-4 h-4 text-blue-500" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={newNodeData.name}
                                    onChange={(e) => setNewNodeData({ ...newNodeData, name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onBlur={() => {
                                        if (newNodeData.name.trim()) {
                                            updateNode(currentPath, { name: newNodeData.name });
                                        } else {
                                            setEditingNode(null);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && newNodeData.name.trim()) {
                                            updateNode(currentPath, { name: newNodeData.name });
                                        } else if (e.key === 'Escape') {
                                            setEditingNode(null);
                                            setNewNodeData({ name: '', url: '' });
                                        }
                                    }}
                                    className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <span className="flex-1 text-sm text-slate-700">{node.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingNode({ id: node.id, type: 'folder', parentPath: path });
                                                setNewNodeData({ name: node.name });
                                            }}
                                            className="p-1 hover:bg-blue-100 rounded"
                                            title="重命名"
                                        >
                                            <Edit2 className="w-3 h-3 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => addFolder(currentPath)}
                                            className="p-1 hover:bg-green-100 rounded"
                                            title="添加子文件夹"
                                        >
                                            <FolderPlus className="w-3 h-3 text-green-600" />
                                        </button>
                                        <button
                                            onClick={() => addVideo(currentPath)}
                                            className="p-1 hover:bg-purple-100 rounded"
                                            title="添加视频"
                                        >
                                            <FileVideo className="w-3 h-3 text-purple-600" />
                                        </button>
                                        <button
                                            onClick={() => deleteNode(currentPath)}
                                            className="p-1 hover:bg-red-100 rounded"
                                            title="删除"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-600" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {isExpanded && (
                            <div>
                                {renderPlaylistTree(node.children, currentPath, level + 1)}
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div 
                        key={node.id} 
                        className={`flex items-center gap-2 px-2 py-1.5 rounded group ${
                            isEditing ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-100 cursor-pointer'
                        }`}
                        style={{ paddingLeft: `${level * 20 + 24}px` }}
                        onClick={(e) => {
                            // 编辑状态下不触发播放
                            if (!isEditing) {
                                selectVideo(node);
                            }
                        }}
                    >
                        <FileVideo className="w-4 h-4 text-purple-500" />
                        {isEditing ? (
                            <div 
                                className="flex-1 flex flex-col gap-1"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="text"
                                    placeholder="视频名称"
                                    value={newNodeData.name}
                                    onChange={(e) => setNewNodeData({ ...newNodeData, name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="px-2 py-1 border border-blue-500 rounded text-sm"
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="播放地址（B站链接或iframe标签）"
                                    value={newNodeData.url || ''}
                                    onChange={(e) => setNewNodeData({ ...newNodeData, url: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="px-2 py-1 border border-blue-500 rounded text-sm"
                                />
                                <div className="text-xs text-slate-500 px-1">
                                    支持：直接URL、B站iframe标签
                                </div>
                                <div className="text-xs text-red-500 px-1 mt-0.5">
                                    注意：抖音视频不支持iframe嵌入，无法保存
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (newNodeData.name.trim() && newNodeData.url?.trim()) {
                                                updateNode(currentPath, { name: newNodeData.name, url: newNodeData.url });
                                            }
                                        }}
                                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingNode(null);
                                            setNewNodeData({ name: '', url: '' });
                                        }}
                                        className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className={`flex-1 text-sm ${currentVideo.id === node.id ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                                    {node.title}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingNode({ id: node.id, type: 'video', parentPath: path });
                                            setNewNodeData({ name: node.title, url: node.url });
                                        }}
                                        className="p-1 hover:bg-blue-100 rounded"
                                        title="编辑"
                                    >
                                        <Edit2 className="w-3 h-3 text-blue-600" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNode(currentPath);
                                        }}
                                        className="p-1 hover:bg-red-100 rounded"
                                        title="删除"
                                    >
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            }
        });
    };

    // 拖拽调整大小处理
    const handleResizeStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoContainerRef.current) return;
        
        const rect = videoContainerRef.current.getBoundingClientRect();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startWidth: videoSize.width,
            startHeight: videoSize.height
        };
        
        // 设置全局指针捕获
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e: React.PointerEvent) => {
        if (!isResizing || !resizeStartRef.current) return;
        e.preventDefault();
        
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        
        // 计算新尺寸（保持16:9比例或自由调整）
        const newWidth = Math.max(240, Math.min(width * 0.9, resizeStartRef.current.startWidth + deltaX));
        const newHeight = Math.max(135, Math.min(height * 0.9, resizeStartRef.current.startHeight + deltaY));
        
        setVideoSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = (e: React.PointerEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        setIsResizing(false);
        resizeStartRef.current = null;
        
        // 释放指针捕获
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {
            // 忽略错误
        }
    };

    // 重置大小到默认值
    const resetSize = () => {
        setVideoSize({ width: 480, height: 270 });
    };
    
    // 重置透明度到默认值
    const resetOpacity = () => {
        setOpacity(1.0);
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* 1. 视觉刺激背景层 */}
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="absolute inset-0 block" 
            />

            {/* 2. 视频播放器层 & UI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-4">
                
                {/* 控制栏 - 放置在播放器上方右侧 */}
                <div 
                    className="flex justify-end mb-2 pointer-events-none gap-2"
                    style={{ width: '480px', maxWidth: '100%' }}
                >
                    <div className="pointer-events-auto relative flex gap-2 items-center">
                        {/* 视力类型选择 */}
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/90 rounded-lg shadow border border-slate-200 text-xs text-slate-700">
                            <span className="font-semibold whitespace-nowrap">视力类型</span>
                            <select
                                value={visionType}
                                onChange={(e) => {
                                    const newValue = e.target.value as 'visual' | 'stereo';
                                    setVisionType(newValue);
                                    // 保存到本地存储
                                    localStorage.setItem('gratingPlayerVisionType', newValue);
                                }}
                                className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="visual">视觉刺激</option>
                                <option value="stereo">立体视</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => {
                                setShowMenu(!showMenu);
                                setShowCustomPlaylist(false);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/90 text-slate-800 rounded-lg shadow-lg hover:bg-white transition-all font-bold text-sm backdrop-blur-md border border-slate-200"
                        >
                            <ListVideo className="w-4 h-4" />
                            默认视频
                        </button>
                        <button 
                            onClick={() => {
                                setShowCustomPlaylist(!showCustomPlaylist);
                                setShowMenu(false);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600 transition-all font-bold text-sm"
                        >
                            <Folder className="w-4 h-4" />
                            自定义列表
                        </button>

                        {/* 默认视频下拉菜单 */}
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in max-h-[60vh] overflow-y-auto z-50">
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                                    <span className="text-xs font-bold text-slate-600">默认视频列表</span>
                                </div>
                                {VIDEO_LIST.map(video => (
                                    <button
                                        key={video.id}
                                        onClick={() => {
                                            setCurrentVideo(video);
                                            setShowMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                                            currentVideo.id === video.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
                                        }`}
                                    >
                                        {video.title}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 自定义播放列表面板 */}
                        {showCustomPlaylist && (
                            <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-100 animate-fade-in z-50 flex flex-col max-h-[70vh]">
                                {/* 头部 */}
                                <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-between border-b border-purple-400">
                                    <div className="flex items-center gap-2">
                                        <Folder className="w-5 h-5" />
                                        <span className="font-bold">自定义播放列表</span>
                                    </div>
                                    <button
                                        onClick={() => setShowCustomPlaylist(false)}
                                        className="text-white/80 hover:text-white"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                {/* 工具栏 */}
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => addFolder([])}
                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600 flex items-center gap-1"
                                            title="添加文件夹"
                                        >
                                            <FolderPlus className="w-3 h-3" />
                                            文件夹
                                        </button>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={exportPlaylist}
                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 flex items-center gap-1"
                                            title="导出"
                                        >
                                            <Download className="w-3 h-3" />
                                            导出
                                        </button>
                                        <button
                                            onClick={importPlaylist}
                                            className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600 flex items-center gap-1"
                                            title="导入"
                                        >
                                            <UploadIcon className="w-3 h-3" />
                                            导入
                                        </button>
                                    </div>
                                </div>

                                {/* 播放列表树 */}
                                <div className="flex-1 overflow-y-auto p-2">
                                    {customPlaylist.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">还没有自定义列表</p>
                                            <p className="text-xs mt-1">点击上方"文件夹"按钮开始创建</p>
                                        </div>
                                    ) : (
                                        renderPlaylistTree(customPlaylist)
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 播放器容器 */}
                <div 
                    ref={videoContainerRef}
                    className="pointer-events-auto relative bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm group"
                    style={{
                        width: `${videoSize.width}px`,
                        height: `${videoSize.height}px`,
                        maxWidth: '90%',
                        maxHeight: '90%',
                        minWidth: '240px',
                        minHeight: '135px',
                        // 视觉刺激：调整体透明度；立体视：视频始终不透明
                        opacity: visionType === 'visual' ? opacity : 1
                    }}
                >
                    {isPlaying ? (
                        <>
                            {/* 判断是否为抖音链接，使用不同的嵌入方式 */}
                            {currentVideo.url.includes('douyin.com') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                                    <p className="text-white/80 text-sm mb-2">抖音视频播放</p>
                                    <a 
                                        href={currentVideo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
                                    >
                                        在新窗口打开抖音视频
                                    </a>
                                    <p className="text-white/50 text-xs mt-2 px-4 text-center">
                                        提示：抖音视频暂不支持直接嵌入，请点击按钮在新窗口打开
                                    </p>
                                </div>
                            ) : (
                                <iframe 
                                    key={currentVideo.id} // 确保切换视频时重新加载 iframe
                                    src={currentVideo.url}
                                    className="w-full h-full"
                                    scrolling="no" 
                                    frameBorder="0"
                                    allowFullScreen={true}
                                    referrerPolicy="no-referrer"
                                    title={currentVideo.title}
                                />
                            )}
                            {/* 控制按钮组 */}
                            <div className="absolute top-2 left-2 flex gap-2 z-20">
                                <button 
                                    onClick={resetSize}
                                    className="p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                                    title="重置窗口大小"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setShowOpacityControl(!showOpacityControl)}
                                    className="p-2 bg-purple-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 shadow-lg"
                                    title="调整透明度"
                                >
                                    {opacity < 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* 透明度控制面板 */}
                            {showOpacityControl && (
                                <div className="absolute top-12 left-2 bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-xl z-30 min-w-[200px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-800">
                                            {visionType === 'visual' ? '透明度' : '遮罩透明度'}
                                        </span>
                                        <button 
                                            onClick={resetOpacity}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            重置
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                                        <span>0%</span>
                                            <span className="font-bold text-purple-600">{Math.round(opacity * 100)}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            )}
                            {/* 拖拽调整大小手柄 */}
                            <div
                                className="absolute bottom-0 right-0 w-6 h-6 bg-white/80 rounded-tl-lg cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
                                onPointerDown={handleResizeStart}
                                onPointerMove={handleResizeMove}
                                onPointerUp={handleResizeEnd}
                                onPointerCancel={handleResizeEnd}
                                style={{
                                    cursor: isResizing ? 'nwse-resize' : 'nwse-resize'
                                }}
                            >
                                <div className="w-3 h-3 border-2 border-slate-600 rounded-sm"></div>
                            </div>
                            {/* 立体视遮罩：左红右蓝，透明度由 slider 控制 */}
                            {visionType === 'stereo' && (
                                <div className="pointer-events-none absolute inset-0 flex z-10">
                                    <div
                                        className="w-1/2 h-full"
                                        style={{
                                            backgroundColor: `rgba(255, 0, 0, ${opacity})`,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                    <div
                                        className="w-1/2 h-full"
                                        style={{
                                            backgroundColor: `rgba(0, 102, 255, ${opacity})`,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900 font-bold">
                            准备播放
                        </div>
                    )}
                </div>
            </div>

            {/* 底部提示 */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/80 font-bold text-xs md:text-sm bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
                    正在播放: {currentVideo.title} — 请保持注视屏幕中央
                </p>
            </div>
        </div>
    );
};
