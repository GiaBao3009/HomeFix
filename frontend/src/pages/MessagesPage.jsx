import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Avatar, Badge, Button, Empty, Input, List, Modal, Select, Spin, Tag, message as antdMessage } from 'antd';
import {
    Bell,
    ChevronLeft,
    Image,
    MessageSquare,
    Moon,
    Paperclip,
    Reply,
    Search,
    Send,
    Smile,
    Sun,
    Users,
    X,
    ArrowLeft,
    Circle
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_EMOJIS = ['👍', '🎉', '❤️', '😀', '🔥', '🙏', '😂', '👏', '💯', '✨'];

const OPTIMISTIC_PREFIX = 'local-msg-';

const createClientMessageId = () =>
    `${OPTIMISTIC_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeMessage = (message) => ({
    ...message,
    optimistic: Boolean(message?.optimistic),
    failed: Boolean(message?.failed),
    sending: Boolean(message?.sending),
});

const mergeIncomingMessage = (current, incoming) => {
    const normalizedIncoming = normalizeMessage(incoming);
    const matchIndex = current.findIndex((item) =>
        (normalizedIncoming.id != null && item.id === normalizedIncoming.id) ||
        (normalizedIncoming.clientMessageId && item.clientMessageId === normalizedIncoming.clientMessageId)
    );

    if (matchIndex >= 0) {
        const next = [...current];
        next[matchIndex] = {
            ...next[matchIndex],
            ...normalizedIncoming,
            optimistic: false,
            failed: false,
            sending: false,
        };
        return next;
    }

    return [...current, normalizedIncoming];
};

const MessagesPage = () => {
    const { user } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagePage, setMessagePage] = useState({ page: 0, hasNext: false, totalElements: 0 });
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [composer, setComposer] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [replyTarget, setReplyTarget] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingMessages, setSearchingMessages] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [userSearchKeyword, setUserSearchKeyword] = useState('');
    const [userSearchOptions, setUserSearchOptions] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [mentionIds, setMentionIds] = useState([]);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [conversationFilter, setConversationFilter] = useState('');
    const listRef = useRef(null);
    const socketRef = useRef(null);
    const conversationSubscriptions = useRef([]);
    const typingTimeoutRef = useRef(null);
    const composerRef = useRef(null);
    const selectedConversationIdRef = useRef(null);

    const selectedConversation = useMemo(
        () => conversations.find((item) => item.id === selectedConversationId) || null,
        [conversations, selectedConversationId]
    );

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    const totalUnread = useMemo(
        () => conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
        [conversations]
    );

    const filteredConversations = useMemo(() => {
        if (!conversationFilter.trim()) return conversations;
        const keyword = conversationFilter.toLowerCase();
        return conversations.filter(c =>
            c.title?.toLowerCase().includes(keyword) ||
            c.lastMessagePreview?.toLowerCase().includes(keyword) ||
            c.participants?.some(p => p.fullName?.toLowerCase().includes(keyword))
        );
    }, [conversations, conversationFilter]);

    const scrollToBottom = useCallback(() => {
        if (listRef.current) {
            requestAnimationFrame(() => {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            });
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        connectSocket();
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.deactivate();
            }
        };
    }, []);

    useEffect(() => {
        if (selectedConversationId) {
            fetchMessages(selectedConversationId, 0, false);
            subscribeToConversation(selectedConversationId);
            markAsRead(selectedConversationId);
            setShowMobileChat(true);
        }
        return () => {
            clearConversationSubscriptions();
        };
    }, [selectedConversationId]);

    useEffect(() => {
        if (!userSearchKeyword || userSearchKeyword.trim().length < 2) {
            setUserSearchOptions([]);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const response = await api.get('/chat/users', { params: { keyword: userSearchKeyword.trim() } });
                setUserSearchOptions(response.data || []);
            } catch (error) {
                console.error(error);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [userSearchKeyword]);

    const connectSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const client = new Client({
            brokerURL: `${wsProtocol}://${window.location.host}/ws-chat`,
            reconnectDelay: 5000,
            connectHeaders: { Authorization: `Bearer ${token}` },
            debug: () => {}
        });

        client.onConnect = () => {
            client.subscribe('/user/queue/chat/conversations', (frame) => {
                const payload = JSON.parse(frame.body);
                setConversations((current) => mergeConversation(current, payload));
            });
            client.subscribe('/user/queue/notifications', () => {
                fetchConversations();
            });
            if (selectedConversationIdRef.current) {
                subscribeToConversation(selectedConversationIdRef.current);
            }
        };

        client.onStompError = (frame) => {
            antdMessage.error(frame.headers?.message || 'Không thể kết nối chat realtime');
        };

        client.activate();
        socketRef.current = client;
    };

    const clearConversationSubscriptions = () => {
        conversationSubscriptions.current.forEach((s) => s.unsubscribe());
        conversationSubscriptions.current = [];
    };

    const subscribeToConversation = (conversationId) => {
        clearConversationSubscriptions();
        if (!socketRef.current?.connected) return;

        conversationSubscriptions.current = [
            socketRef.current.subscribe(`/topic/chat/conversations/${conversationId}`, (frame) => {
                const payload = JSON.parse(frame.body);
                setMessages((current) => mergeIncomingMessage(current, payload));
                scrollToBottom();
                if (payload.senderId !== user?.id && document.hidden && window.Notification && Notification.permission === 'granted') {
                    new Notification(payload.senderName || 'Tin nhắn mới', {
                        body: payload.content,
                        icon: payload.senderAvatarUrl || undefined
                    });
                }
            }),
            socketRef.current.subscribe(`/topic/chat/conversations/${conversationId}/typing`, (frame) => {
                const payload = JSON.parse(frame.body);
                if (payload.userId === user?.id) return;
                setTypingUsers((current) => {
                    if (payload.typing) {
                        if (current.some((item) => item.userId === payload.userId)) return current;
                        return [...current, payload];
                    }
                    return current.filter((item) => item.userId !== payload.userId);
                });
            }),
            socketRef.current.subscribe(`/topic/chat/conversations/${conversationId}/presence`, (frame) => {
                const payload = JSON.parse(frame.body);
                setConversations((current) => current.map((conversation) => {
                    if (conversation.id !== conversationId) return conversation;
                    return {
                        ...conversation,
                        participants: conversation.participants?.map((p) =>
                            p.userId === payload.userId ? { ...p, online: payload.online } : p
                        )
                    };
                }));
            })
        ];
    };

    const fetchConversations = async () => {
        setLoadingConversations(true);
        try {
            const response = await api.get('/chat/conversations');
            const items = response.data || [];
            setConversations(items);
            if (!selectedConversationId && items.length) {
                setSelectedConversationId(items[0].id);
            } else if (selectedConversationId && !items.some((item) => item.id === selectedConversationId) && items.length) {
                setSelectedConversationId(items[0].id);
            }
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tải danh sách chat');
        } finally {
            setLoadingConversations(false);
        }
    };

    const fetchMessages = async (conversationId, page = 0, appendOlder = false) => {
        setLoadingMessages(true);
        try {
            const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
                params: { page, size: 30 }
            });
            const payload = response.data;
            setMessagePage({ page: payload.page, hasNext: payload.hasNext, totalElements: payload.totalElements });
            setMessages((current) => {
                const normalizedItems = (payload.items || []).map(normalizeMessage);
                if (appendOlder) {
                    return [...normalizedItems, ...current];
                }

                const pendingCurrent = current.filter(
                    (item) => item.conversationId === conversationId && (item.optimistic || item.failed || item.sending)
                );
                return pendingCurrent.reduce((acc, item) => mergeIncomingMessage(acc, item), normalizedItems);
            });
            if (!appendOlder) setTimeout(scrollToBottom, 80);
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tải lịch sử chat');
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (conversationId) => {
        try {
            await api.put(`/chat/conversations/${conversationId}/read`);
            setConversations((current) => current.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) { console.error(error); }
    };

    const sendTyping = (typing) => {
        if (!socketRef.current?.connected || !selectedConversationId) return;
        socketRef.current.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({ conversationId: selectedConversationId, typing })
        });
    };

    const handleComposerChange = (event) => {
        setComposer(event.target.value);
        sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1200);
    };

    const handleUploadFiles = async (event) => {
        const fileList = Array.from(event.target.files || []);
        if (!fileList.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of fileList) {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploaded.push({
                    fileName: file.name,
                    fileUrl: response.data.fileUrl,
                    contentType: file.type || 'application/octet-stream',
                    sizeBytes: file.size
                });
            }
            setAttachments((current) => [...current, ...uploaded].slice(0, 5));
            antdMessage.success('Đã tải tệp lên');
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Tải tệp thất bại');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const buildOptimisticMessage = (payload, clientMessageId) => ({
        id: clientMessageId,
        clientMessageId,
        conversationId: payload.conversationId,
        senderId: user?.id,
        senderName: user?.fullName || 'Ban',
        senderAvatarUrl: user?.avatarUrl || null,
        content: payload.content?.trim() ? payload.content : '[Da gui tep dinh kem]',
        createdAt: new Date().toISOString(),
        editedAt: null,
        deleted: false,
        parentMessageId: replyTarget?.id || null,
        parentMessagePreview: replyTarget?.content || null,
        mentionedUserIds: [...mentionIds],
        attachments: [...attachments],
        optimistic: true,
        sending: true,
        failed: false,
    });

    const sendMessagePayload = async (payload) => {
        if (socketRef.current?.connected) {
            socketRef.current.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
            return null;
        }
        return api.post('/chat/messages', payload);
    };

    const markMessageFailed = (clientMessageId) => {
        setMessages((current) =>
            current.map((item) =>
                item.clientMessageId === clientMessageId
                    ? { ...item, sending: false, failed: true, optimistic: false }
                    : item
            )
        );
    };

    const retryMessage = async (messageItem) => {
        const payload = {
            conversationId: messageItem.conversationId,
            clientMessageId: messageItem.clientMessageId || createClientMessageId(),
            content: messageItem.content === '[Da gui tep dinh kem]' ? '' : messageItem.content,
            parentMessageId: messageItem.parentMessageId || null,
            mentionedUserIds: messageItem.mentionedUserIds || [],
            attachments: messageItem.attachments || [],
        };

        setMessages((current) =>
            current.map((item) =>
                item.clientMessageId === messageItem.clientMessageId
                    ? { ...item, sending: true, failed: false, optimistic: true }
                    : item
            )
        );

        try {
            const response = await sendMessagePayload(payload);
            if (response?.data) {
                setMessages((current) => mergeIncomingMessage(current, response.data));
            }
            scrollToBottom();
        } catch (error) {
            console.error(error);
            markMessageFailed(payload.clientMessageId);
            antdMessage.error(error.response?.data?.message || 'Gui lai tin nhan that bai');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConversationId || (!composer.trim() && attachments.length === 0)) return;
        const clientMessageId = createClientMessageId();
        const payload = {
            conversationId: selectedConversationId,
            content: composer,
            clientMessageId,
            parentMessageId: replyTarget?.id || null,
            mentionedUserIds: mentionIds,
            attachments
        };
        const optimisticMessage = buildOptimisticMessage(payload, clientMessageId);
        try {
            setSending(true);
            setMessages((current) => mergeIncomingMessage(current, optimisticMessage));
            setConversations((current) =>
                current.map((conversation) =>
                    conversation.id === selectedConversationId
                        ? {
                              ...conversation,
                              lastMessagePreview: optimisticMessage.content,
                              lastMessageAt: optimisticMessage.createdAt,
                              lastSenderId: user?.id,
                              lastSenderName: user?.fullName || 'Ban',
                          }
                        : conversation
                )
            );
            const response = await sendMessagePayload(payload);
            if (response?.data) {
                setMessages((current) => mergeIncomingMessage(current, response.data));
            }
            setComposer('');
            setAttachments([]);
            setMentionIds([]);
            setReplyTarget(null);
            sendTyping(false);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Gửi tin nhắn thất bại');
            markMessageFailed(clientMessageId);
        } finally {
            setSending(false);
        }
    };

    const handleSearchMessages = async () => {
        if (!searchKeyword.trim()) { setSearchResults([]); return; }
        setSearchingMessages(true);
        try {
            const response = await api.get('/chat/messages/search', {
                params: { keyword: searchKeyword.trim(), page: 0, size: 20 }
            });
            setSearchResults(response.data.items || []);
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tìm kiếm tin nhắn');
        } finally {
            setSearchingMessages(false);
        }
    };

    const handleCreateConversation = async () => {
        if (!createTitle.trim() || selectedUsers.length === 0) {
            antdMessage.warning('Vui lòng nhập tên nhóm và chọn người tham gia');
            return;
        }
        try {
            const response = await api.post('/chat/conversations', {
                title: createTitle.trim(),
                participantIds: selectedUsers
            });
            const created = response.data;
            setConversations((current) => mergeConversation(current, created));
            setSelectedConversationId(created.id);
            setCreateOpen(false);
            setCreateTitle('');
            setSelectedUsers([]);
            setUserSearchOptions([]);
            setUserSearchKeyword('');
            antdMessage.success('Tạo cuộc trò chuyện thành công');
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tạo cuộc trò chuyện');
        }
    };

    const mergeConversation = (current, next) => {
        const existing = current.find((item) => item.id === next.id);
        const merged = existing
            ? current.map((item) => item.id === next.id ? { ...item, ...next } : item)
            : [next, ...current];
        return [...merged].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
    };

    const visibleParticipants = (selectedConversation?.participants || []).filter((p) => p.userId !== user?.id);
    const onlineCount = visibleParticipants.filter(p => p.online).length;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            {/* ── Header ── */}
            <div className={`sticky top-16 z-30 px-4 py-4 ${darkMode ? 'bg-slate-950/90 backdrop-blur-lg' : 'bg-slate-100/90 backdrop-blur-lg'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className={`rounded-2xl p-5 shadow-xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-tight">Tin nhắn</div>
                                    <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Chat realtime • {conversations.length} cuộc trò chuyện
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {totalUnread > 0 && (
                                    <Badge count={totalUnread} overflowCount={99}>
                                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium badge-shimmer ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-red-50 text-red-600'}`}>
                                            <Bell size={15} />
                                            {totalUnread} chưa đọc
                                        </div>
                                    </Badge>
                                )}
                                <Button className={`rounded-xl ${darkMode ? '!bg-slate-800 !border-slate-700 !text-slate-200' : ''}`}
                                    icon={darkMode ? <Sun size={15} /> : <Moon size={15} />} onClick={toggleDarkMode}>
                                    {darkMode ? 'Sáng' : 'Tối'}
                                </Button>
                                <Button type="primary" className="rounded-xl" icon={<Users size={15} />} onClick={() => setCreateOpen(true)}>
                                    Tạo nhóm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main 3-Column Layout ── */}
            <div className="max-w-7xl mx-auto px-4 pb-6">
                <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)_300px] gap-4">

                    {/* ── LEFT: Conversation List ── */}
                    <div className={`rounded-2xl shadow-lg overflow-hidden ${showMobileChat ? 'hidden xl:block' : ''} ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                        <div className={`p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <Input
                                prefix={<Search size={15} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />}
                                placeholder="Tìm cuộc trò chuyện..."
                                value={conversationFilter}
                                onChange={(e) => setConversationFilter(e.target.value)}
                                allowClear
                                className="rounded-xl"
                            />
                        </div>
                        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                            {loadingConversations ? (
                                <div className="p-8 flex justify-center"><Spin /></div>
                            ) : filteredConversations.length === 0 ? (
                                <Empty className="py-10" description={conversationFilter ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'} />
                            ) : (
                                <List
                                    dataSource={filteredConversations}
                                    renderItem={(conversation) => {
                                        const peers = (conversation.participants || []).filter((p) => p.userId !== user?.id);
                                        const isActive = selectedConversationId === conversation.id;
                                        const hasUnread = conversation.unreadCount > 0;
                                        return (
                                            <List.Item
                                                className={`!px-4 !py-3 cursor-pointer transition-all duration-200 !border-none ${
                                                    isActive
                                                        ? darkMode ? '!bg-blue-950/40 border-l-2 !border-l-blue-500' : '!bg-blue-50 border-l-2 !border-l-blue-500'
                                                        : darkMode ? 'hover:!bg-slate-800' : 'hover:!bg-slate-50'
                                                }`}
                                                onClick={() => setSelectedConversationId(conversation.id)}
                                            >
                                                <div className="w-full flex gap-3">
                                                    <Badge dot={peers.some((p) => p.online)} color="green" offset={[-4, 36]}>
                                                        <Avatar size={44} src={peers[0]?.avatarUrl}
                                                            className="bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0">
                                                            {(conversation.title || 'C').charAt(0)}
                                                        </Avatar>
                                                    </Badge>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className={`font-semibold truncate text-sm ${hasUnread ? 'font-bold' : ''}`}>
                                                                {conversation.title}
                                                            </div>
                                                            {hasUnread && <Badge count={conversation.unreadCount} size="small" />}
                                                        </div>
                                                        <div className={`text-xs truncate mt-0.5 ${
                                                            hasUnread
                                                                ? darkMode ? 'text-slate-200 font-medium' : 'text-slate-800 font-medium'
                                                                : darkMode ? 'text-slate-400' : 'text-slate-500'
                                                        }`}>
                                                            {conversation.lastSenderName ? `${conversation.lastSenderName}: ` : ''}{conversation.lastMessagePreview || 'Chưa có tin nhắn'}
                                                        </div>
                                                        <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            {conversation.lastMessageAt ? dayjs(conversation.lastMessageAt).format('DD/MM HH:mm') : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── CENTER: Chat Area ── */}
                    <div className={`rounded-2xl shadow-lg min-h-[calc(100vh-280px)] ${!showMobileChat ? 'hidden xl:flex xl:flex-col' : 'flex flex-col'} ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                        {!selectedConversation ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center">
                                    <MessageSquare size={40} className="text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold mb-1">Chọn cuộc trò chuyện</div>
                                    <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Chọn từ danh sách bên trái hoặc tạo cuộc trò chuyện mới
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className={`p-4 border-b flex items-center justify-between gap-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button type="button" className={`xl:hidden p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                                            onClick={() => setShowMobileChat(false)}>
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="min-w-0">
                                            <div className="text-lg font-bold truncate">{selectedConversation.title}</div>
                                            <div className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {onlineCount > 0 && (
                                                    <>
                                                        <Circle size={8} className="text-green-500 fill-green-500 presence-pulse" />
                                                        <span>{onlineCount} đang online</span>
                                                        <span className="mx-1">•</span>
                                                    </>
                                                )}
                                                <span>{visibleParticipants.length} thành viên</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {messagePage.hasNext && (
                                            <Button size="small" className="rounded-lg" icon={<ChevronLeft size={14} />}
                                                onClick={() => fetchMessages(selectedConversation.id, messagePage.page + 1, true)}>
                                                <span className="hidden sm:inline">Tải cũ hơn</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {loadingMessages ? (
                                        <div className="py-12 flex justify-center"><Spin /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-500/10 flex items-center justify-center">
                                                <MessageSquare size={28} className="text-blue-400" />
                                            </div>
                                            <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chưa có tin nhắn. Hãy gửi lời chào! 👋</div>
                                        </div>
                                    ) : messages.map((item) => {
                                        const mine = item.senderId === user?.id;
                                        return (
                                            <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} message-enter`}>
                                                <div className="flex items-end gap-2 max-w-[80%]">
                                                    {!mine && (
                                                        <Avatar size={32} src={item.senderAvatarUrl}
                                                            className="bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0 mb-1">
                                                            {item.senderName?.charAt(0)}
                                                        </Avatar>
                                                    )}
                                                    <div className={`rounded-2xl px-4 py-3 ${mine
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-br-md'
                                                        : darkMode ? 'bg-slate-800 text-slate-100 rounded-bl-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'
                                                    }`}>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className={`text-[11px] font-medium ${mine ? 'text-white/70' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {mine ? 'Bạn' : item.senderName} • {dayjs(item.createdAt).format('HH:mm')}
                                                            </div>
                                                            {item.editedAt && (
                                                                <span className={`text-[10px] ${mine ? 'text-white/50' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>(đã sửa)</span>
                                                            )}
                                                        </div>
                                                        {item.parentMessagePreview && (
                                                            <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                                                                mine ? 'bg-white/15 border-white/30' : darkMode ? 'bg-slate-700 border-slate-500' : 'bg-white border-slate-300'
                                                            }`}>
                                                                <Reply size={10} className="inline mr-1 opacity-60" />
                                                                {item.parentMessagePreview}
                                                            </div>
                                                        )}
                                                        <div className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{item.content}</div>
                                                        {item.attachments?.length > 0 && (
                                                            <div className="mt-2 space-y-1.5">
                                                                {item.attachments.map((att) => (
                                                                    <a key={`${item.id}-${att.fileUrl}`} href={att.fileUrl} target="_blank" rel="noreferrer"
                                                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                                                                            mine ? 'bg-white/10 text-white hover:bg-white/20' : darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white text-slate-700 hover:bg-slate-50'
                                                                        }`}>
                                                                        {att.contentType?.startsWith('image/') ? <Image size={14} /> : <Paperclip size={14} />}
                                                                        <span className="truncate">{att.fileName}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="mt-1.5 flex items-center justify-end">
                                                            <button title="Reply"
                                                                className={`p-1 rounded-md transition-colors ${mine ? 'hover:bg-white/20' : darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                                                onClick={() => { setReplyTarget(item); composerRef.current?.focus(); }}>
                                                                <Reply size={13} className="opacity-60" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Typing Indicator with animated dots */}
                                <div className={`px-4 min-h-[28px] flex items-center text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {typingUsers.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="typing-dot" />
                                            <span className="typing-dot" />
                                            <span className="typing-dot" />
                                            <span className="ml-1 text-xs font-medium">
                                                {typingUsers.map((t) => t.fullName).join(', ')} đang nhập...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Composer */}
                                <div className={`p-4 border-t space-y-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    {replyTarget && (
                                        <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                                            <div className="text-sm min-w-0 mr-2">
                                                <div className="font-semibold text-blue-500 text-xs">
                                                    <Reply size={12} className="inline mr-1" /> Reply {replyTarget.senderName}
                                                </div>
                                                <div className={`truncate text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{replyTarget.content}</div>
                                            </div>
                                            <Button type="text" size="small" icon={<X size={14} />} onClick={() => setReplyTarget(null)} />
                                        </div>
                                    )}

                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {attachments.map((att, idx) => (
                                                <Tag key={`${att.fileUrl}-${idx}`} closable className="rounded-lg"
                                                    onClose={() => setAttachments((c) => c.filter((_, i) => i !== idx))}>
                                                    <Paperclip size={12} className="inline mr-1" />{att.fileName}
                                                </Tag>
                                            ))}
                                        </div>
                                    )}

                                    {/* Emoji & Mention Bar */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div className="flex gap-1">
                                            {QUICK_EMOJIS.map((emoji) => (
                                                <button key={emoji} type="button"
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110 ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                                                    onClick={() => setComposer((c) => `${c}${emoji}`)}>
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        {visibleParticipants.length > 0 && (
                                            <Select mode="multiple" allowClear placeholder="@mention" className="min-w-[160px] rounded-lg"
                                                size="small" value={mentionIds} onChange={setMentionIds}
                                                options={visibleParticipants.map((p) => ({ value: p.userId, label: p.fullName }))} />
                                        )}
                                    </div>

                                    {/* Input + Send */}
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input.TextArea ref={composerRef} rows={2} placeholder="Nhập tin nhắn..."
                                                value={composer} onChange={handleComposerChange} className="!rounded-xl"
                                                onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className={`cursor-pointer rounded-xl p-2.5 flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                                {uploading ? <Spin size="small" /> : <Paperclip size={16} />}
                                                <input type="file" multiple className="hidden" onChange={handleUploadFiles} />
                                            </label>
                                            <Button type="primary" className="!rounded-xl !p-2.5 !h-auto" icon={<Send size={16} />}
                                                loading={sending} onClick={handleSendMessage} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── RIGHT: Search & Members ── */}
                    <div className={`rounded-2xl shadow-lg hidden xl:block ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                        <div className={`p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="font-bold text-sm mb-3">🔍 Tìm kiếm tin nhắn</div>
                            <div className="flex gap-2">
                                <Input prefix={<Search size={14} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />}
                                    placeholder="Nhập từ khóa..." size="small" className="rounded-lg"
                                    value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                                    onPressEnter={handleSearchMessages} />
                                <Button size="small" className="rounded-lg" onClick={handleSearchMessages}
                                    loading={searchingMessages}>Tìm</Button>
                            </div>
                        </div>
                        <div className="p-4 max-h-[calc(100vh-480px)] overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <Empty description="Chưa có kết quả" imageStyle={{ height: 60 }} />
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((item) => (
                                        <button type="button" key={item.id}
                                            className={`w-full text-left rounded-xl p-2.5 transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-blue-50'}`}
                                            onClick={() => { setSelectedConversationId(item.conversationId); setTimeout(() => setReplyTarget(item), 150); }}>
                                            <div className="font-semibold text-xs">{item.senderName}</div>
                                            <div className={`text-xs line-clamp-2 mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.content}</div>
                                            <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedConversation && (
                                <div className="mt-5">
                                    <div className="font-bold text-sm mb-3">👥 Thành viên ({visibleParticipants.length})</div>
                                    <div className="space-y-2">
                                        {visibleParticipants.map((p) => (
                                            <div key={p.userId} className={`rounded-xl p-2.5 flex items-center gap-2.5 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                                <Badge dot={p.online} color="green" offset={[-2, 28]}>
                                                    <Avatar size={32} src={p.avatarUrl} className="bg-gradient-to-br from-blue-500 to-cyan-400">
                                                        {p.fullName?.charAt(0)}
                                                    </Avatar>
                                                </Badge>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-xs truncate">{p.fullName}</div>
                                                    <div className={`text-[10px] flex items-center gap-1 ${p.online ? 'text-green-500' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {p.online ? (<><Circle size={6} className="fill-green-500 presence-pulse" /> Online</>) : 'Offline'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Create Conversation Modal ── */}
            <Modal open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreateConversation} okText="Tạo" title="Tạo cuộc trò chuyện mới">
                <div className="space-y-4 py-2">
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tên cuộc trò chuyện</label>
                        <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)}
                            placeholder="VD: Nhóm dự án, Hỗ trợ kỹ thuật..." className="rounded-xl" />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Chọn người tham gia</label>
                        <Select mode="multiple" className="w-full" placeholder="Gõ tên hoặc email để tìm..." showSearch
                            value={selectedUsers} onSearch={setUserSearchKeyword} onChange={setSelectedUsers} filterOption={false}
                            options={userSearchOptions.map((o) => ({ value: o.id, label: `${o.fullName} (${o.role})` }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MessagesPage;
