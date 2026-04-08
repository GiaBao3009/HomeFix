import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Button, Empty, Input, List, Modal, Select, Spin, Tag, message as antdMessage } from 'antd';
import {
    ArrowLeft,
    Bell,
    ChevronLeft,
    Circle,
    Image,
    MessageSquare,
    Moon,
    Paperclip,
    Reply,
    Search,
    Send,
    Sun,
    Users,
    X,
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_EMOJIS = ['👍', '🎉', '❤️', '😀', '🔥', '🙏', '😂', '👏', '💯', '✨'];
const MAX_GROUP_SEARCH_RESULTS = 20;

const normalizeText = (value) =>
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const sortConversations = (items) =>
    [...items].sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0) - new Date(a.lastMessageAt || a.createdAt || 0));

const sortMessages = (items) =>
    [...items].sort((a, b) => {
        const timeDiff = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (timeDiff !== 0) return timeDiff;
        return Number(a.id || 0) - Number(b.id || 0);
    });

const mergeMessages = (...groups) => {
    const byId = new Map();
    groups.flat().filter(Boolean).forEach((item) => {
        if (!item) return;
        byId.set(item.id, item);
    });
    return sortMessages(Array.from(byId.values()));
};

const dedupeById = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const getRoleLabel = (role) => {
    switch ((role || '').toUpperCase()) {
        case 'CUSTOMER':
            return 'Khách hàng';
        case 'TECHNICIAN':
            return 'Kỹ thuật viên';
        case 'ADMIN':
            return 'Quản trị viên';
        default:
            return role || 'Người dùng';
    }
};

const getConversationPreview = (message) => {
    if (message?.content?.trim()) return message.content.trim();
    if (Array.isArray(message?.attachments) && message.attachments.length > 0) return 'Đã gửi tệp đính kèm';
    return 'Tin nhắn mới';
};

const getDisplayMentionHandle = (fullName, duplicatedHandles) => {
    const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'nguoidung';
    const lastWord = words[words.length - 1];
    const normalizedLastWord = normalizeText(lastWord);
    if ((duplicatedHandles.get(normalizedLastWord) || 0) <= 1) {
        return lastWord;
    }
    return words.join('');
};

const buildMentionCandidates = (participants) => {
    const handleCounts = new Map();
    participants.forEach((participant) => {
        const words = (participant.fullName || '').trim().split(/\s+/).filter(Boolean);
        const baseHandle = words.length ? words[words.length - 1] : participant.email || 'nguoidung';
        const key = normalizeText(baseHandle);
        handleCounts.set(key, (handleCounts.get(key) || 0) + 1);
    });

    return participants.map((participant) => {
        const handle = getDisplayMentionHandle(participant.fullName, handleCounts);
        return {
            ...participant,
            mentionHandle: handle,
            mentionToken: `@${handle}`,
            searchText: normalizeText(`${participant.fullName || ''} ${participant.email || ''} ${handle}`),
        };
    });
};

const matchesUserQuery = (user, keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return true;
    return normalizeText(`${user.fullName || ''} ${user.email || ''} ${user.hint || ''} ${user.role || ''}`).includes(normalizedKeyword);
};

const renderMessageWithMentions = (content, mine, darkMode) => {
    const safeContent = content || '';
    const parts = safeContent.split(/(@[^\s]+)/g);

    return parts.map((part, index) => {
        if (!part) return null;
        if (!part.startsWith('@')) {
            return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
            <span
                key={`${part}-${index}`}
                className={`font-semibold ${mine ? 'text-white' : darkMode ? 'text-blue-300' : 'text-blue-600'}`}
            >
                {part}
            </span>
        );
    });
};

const createClientMessageId = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const buildOptimisticMessage = ({
    clientMessageId,
    conversationId,
    content,
    parentMessageId,
    parentMessagePreview,
    attachments,
    currentUser,
}) => ({
    id: `temp-${clientMessageId}`,
    clientMessageId,
    conversationId,
    senderId: currentUser?.id,
    senderName: currentUser?.fullName || 'Bạn',
    senderAvatarUrl: currentUser?.avatarUrl || null,
    content,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deleted: false,
    parentMessageId: parentMessageId || null,
    parentMessagePreview: parentMessagePreview || null,
    mentionedUserIds: [],
    attachments: attachments || [],
    optimistic: true,
});

const reconcileIncomingMessage = (currentMessages, incomingMessage) => {
    const clientMessageId = incomingMessage?.clientMessageId;
    let matched = false;

    const nextMessages = currentMessages.map((item) => {
        if (
            (clientMessageId && item.clientMessageId === clientMessageId) ||
            (incomingMessage?.id != null && item.id === incomingMessage.id)
        ) {
            matched = true;
            return { ...incomingMessage, optimistic: false };
        }
        return item;
    });

    if (matched) {
        return sortMessages(nextMessages);
    }

    if (incomingMessage?.id != null && currentMessages.some((item) => item.id === incomingMessage.id)) {
        return sortMessages(currentMessages);
    }

    return mergeMessages(currentMessages, [{ ...incomingMessage, optimistic: false }]);
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
    const [remoteUserSearchResults, setRemoteUserSearchResults] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userDirectory, setUserDirectory] = useState({});
    const [loadingUserSuggestions, setLoadingUserSuggestions] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [quickMentionValue, setQuickMentionValue] = useState(undefined);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [conversationFilter, setConversationFilter] = useState('');
    const [mentionDraft, setMentionDraft] = useState({
        open: false,
        query: '',
        start: -1,
        end: -1,
    });

    const listRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const composerRef = useRef(null);
    const selectedConversationIdRef = useRef(null);
    const conversationsRef = useRef([]);
    const userIdRef = useRef(null);
    const messageSubscriptionsRef = useRef(new Map());
    const activeConversationSubscriptionsRef = useRef([]);
    const mentionDraftRef = useRef(mentionDraft);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        userIdRef.current = user?.id || null;
    }, [user?.id]);

    useEffect(() => {
        mentionDraftRef.current = mentionDraft;
    }, [mentionDraft]);

    const selectedConversation = useMemo(
        () => conversations.find((item) => item.id === selectedConversationId) || null,
        [conversations, selectedConversationId],
    );

    const totalUnread = useMemo(
        () => conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
        [conversations],
    );

    const filteredConversations = useMemo(() => {
        if (!conversationFilter.trim()) return conversations;
        const keyword = normalizeText(conversationFilter);
        return conversations.filter(
            (conversation) =>
                normalizeText(conversation.title).includes(keyword) ||
                normalizeText(conversation.lastMessagePreview).includes(keyword) ||
                (conversation.participants || []).some((participant) =>
                    normalizeText(participant.fullName).includes(keyword),
                ),
        );
    }, [conversationFilter, conversations]);

    const visibleParticipants = useMemo(
        () => (selectedConversation?.participants || []).filter((participant) => participant.userId !== user?.id),
        [selectedConversation?.participants, user?.id],
    );

    const mentionCandidates = useMemo(() => buildMentionCandidates(visibleParticipants), [visibleParticipants]);

    const mentionSuggestions = useMemo(() => {
        if (!mentionDraft.open) return [];
        const keyword = normalizeText(mentionDraft.query);
        return mentionCandidates
            .filter((candidate) => !keyword || candidate.searchText.includes(keyword))
            .slice(0, 6);
    }, [mentionCandidates, mentionDraft.open, mentionDraft.query]);

    const onlineCount = useMemo(
        () => visibleParticipants.filter((participant) => participant.online).length,
        [visibleParticipants],
    );

    const localSuggestedMatches = useMemo(
        () => suggestedUsers.filter((candidate) => matchesUserQuery(candidate, userSearchKeyword)),
        [suggestedUsers, userSearchKeyword],
    );

    const createUserOptions = useMemo(() => {
        const merged = dedupeById([
            ...selectedUsers.map((userId) => userDirectory[userId]).filter(Boolean),
            ...localSuggestedMatches,
            ...remoteUserSearchResults,
        ]);

        return merged.slice(0, MAX_GROUP_SEARCH_RESULTS).map((option) => ({
            value: option.id,
            label: (
                <div className="flex min-w-0 items-start gap-3 py-1">
                    <Avatar
                        size={32}
                        src={option.avatarUrl}
                        className="shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400"
                    >
                        {option.fullName?.charAt(0)}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{option.fullName}</div>
                        <div className="truncate text-xs text-slate-500">{getRoleLabel(option.role)}</div>
                        {option.hint && <div className="mt-1 text-xs text-blue-600">{option.hint}</div>}
                    </div>
                </div>
            ),
        }));
    }, [localSuggestedMatches, remoteUserSearchResults, selectedUsers, userDirectory]);

    const quickMentionOptions = useMemo(
        () =>
            mentionCandidates.map((candidate) => ({
                value: candidate.userId,
                label: (
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="font-semibold text-blue-600">{candidate.mentionToken}</span>
                        <span className="truncate">{candidate.fullName}</span>
                    </div>
                ),
                searchText: normalizeText(`${candidate.mentionHandle} ${candidate.fullName || ''} ${candidate.email || ''}`),
            })),
        [mentionCandidates],
    );

    const scrollToBottom = useCallback(() => {
        if (!listRef.current) return;
        requestAnimationFrame(() => {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        });
    }, []);

    const mergeConversation = useCallback((current, next) => {
        const updated = current.some((item) => item.id === next.id)
            ? current.map((item) => (item.id === next.id ? { ...item, ...next } : item))
            : [next, ...current];
        return sortConversations(updated);
    }, []);

    const mergeUsersIntoDirectory = useCallback((users) => {
        if (!Array.isArray(users) || users.length === 0) return;
        setUserDirectory((current) => {
            const next = { ...current };
            users.forEach((item) => {
                if (item?.id != null) {
                    next[item.id] = { ...(current[item.id] || {}), ...item };
                }
            });
            return next;
        });
    }, []);

    const getComposerElement = useCallback(() => composerRef.current?.resizableTextArea?.textArea || composerRef.current, []);

    const focusComposer = useCallback(
        (cursorPosition) => {
            requestAnimationFrame(() => {
                const element = getComposerElement();
                element?.focus?.();
                if (typeof cursorPosition === 'number' && element?.setSelectionRange) {
                    element.setSelectionRange(cursorPosition, cursorPosition);
                }
            });
        },
        [getComposerElement],
    );

    const pruneMentionSelections = useCallback((text, mentionsToPrune) => {
        return mentionsToPrune.filter((mention) => text.includes(mention.mentionToken));
    }, []);

    const handleIncomingConversationMessage = useCallback(
        (payload) => {
            if (!payload?.conversationId) return;

            setConversations((current) => {
                const existing = current.find((item) => item.id === payload.conversationId);
                if (!existing) return current;

                const isSelectedConversation = payload.conversationId === selectedConversationIdRef.current;
                const nextSummary = {
                    ...existing,
                    lastMessageAt: payload.createdAt || existing.lastMessageAt,
                    lastMessagePreview: getConversationPreview(payload),
                    lastSenderId: payload.senderId,
                    lastSenderName: payload.senderName,
                    unreadCount:
                        payload.senderId === userIdRef.current || isSelectedConversation
                            ? 0
                            : (existing.unreadCount || 0) + 1,
                };

                return sortConversations(current.map((item) => (item.id === payload.conversationId ? nextSummary : item)));
            });

            if (payload.conversationId === selectedConversationIdRef.current) {
                setMessages((current) => reconcileIncomingMessage(current, payload));
                if (payload.senderId !== userIdRef.current) {
                    api.put(`/chat/conversations/${payload.conversationId}/read`).catch(() => {});
                }
                scrollToBottom();
            }

            if (
                payload.senderId !== userIdRef.current &&
                document.hidden &&
                window.Notification &&
                Notification.permission === 'granted'
            ) {
                new Notification(payload.senderName || 'Tin nhắn mới', {
                    body: getConversationPreview(payload),
                    icon: payload.senderAvatarUrl || undefined,
                });
            }
        },
        [scrollToBottom],
    );

    const clearMessageSubscriptions = useCallback(() => {
        messageSubscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
        messageSubscriptionsRef.current.clear();
    }, []);

    const clearActiveConversationSubscriptions = useCallback(() => {
        activeConversationSubscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
        activeConversationSubscriptionsRef.current = [];
    }, []);

    const syncMessageSubscriptions = useCallback(
        (conversationItems = conversationsRef.current) => {
            if (!socketRef.current?.connected) return;

            const nextIds = new Set((conversationItems || []).map((conversation) => conversation.id));

            Array.from(messageSubscriptionsRef.current.keys()).forEach((conversationId) => {
                if (!nextIds.has(conversationId)) {
                    messageSubscriptionsRef.current.get(conversationId)?.unsubscribe();
                    messageSubscriptionsRef.current.delete(conversationId);
                }
            });

            (conversationItems || []).forEach((conversation) => {
                if (messageSubscriptionsRef.current.has(conversation.id)) return;
                const subscription = socketRef.current.subscribe(
                    `/topic/chat/conversations/${conversation.id}`,
                    (frame) => handleIncomingConversationMessage(JSON.parse(frame.body)),
                );
                messageSubscriptionsRef.current.set(conversation.id, subscription);
            });
        },
        [handleIncomingConversationMessage],
    );

    const syncActiveConversationRealtime = useCallback((conversationId) => {
        clearActiveConversationSubscriptions();
        if (!socketRef.current?.connected || !conversationId) return;

        const typingSubscription = socketRef.current.subscribe(
            `/topic/chat/conversations/${conversationId}/typing`,
            (frame) => {
                const payload = JSON.parse(frame.body);
                if (payload.userId === userIdRef.current) return;
                setTypingUsers((current) => {
                    if (payload.typing) {
                        if (current.some((item) => item.userId === payload.userId)) return current;
                        return [...current, payload];
                    }
                    return current.filter((item) => item.userId !== payload.userId);
                });
            },
        );

        const presenceSubscription = socketRef.current.subscribe(
            `/topic/chat/conversations/${conversationId}/presence`,
            (frame) => {
                const payload = JSON.parse(frame.body);
                setConversations((current) =>
                    current.map((conversation) => {
                        if (conversation.id !== conversationId) return conversation;
                        return {
                            ...conversation,
                            participants: (conversation.participants || []).map((participant) =>
                                participant.userId === payload.userId
                                    ? { ...participant, online: payload.online }
                                    : participant,
                            ),
                        };
                    }),
                );
            },
        );

        activeConversationSubscriptionsRef.current = [typingSubscription, presenceSubscription];
    }, [clearActiveConversationSubscriptions]);

    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const response = await api.get('/chat/conversations');
            const items = response.data || [];
            setConversations(items);

            if (!selectedConversationIdRef.current && items.length > 0) {
                setSelectedConversationId(items[0].id);
            } else if (
                selectedConversationIdRef.current &&
                !items.some((item) => item.id === selectedConversationIdRef.current)
            ) {
                setSelectedConversationId(items[0]?.id || null);
            }
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tải danh sách chat');
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    const fetchMessages = useCallback(
        async (conversationId, page = 0, appendOlder = false) => {
            setLoadingMessages(true);
            try {
                const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
                    params: { page, size: 30 },
                });
                const payload = response.data;
                setMessagePage({
                    page: payload.page,
                    hasNext: payload.hasNext,
                    totalElements: payload.totalElements,
                });
                setMessages((current) => {
                    if (appendOlder) return mergeMessages(payload.items || [], current);
                    const pendingMessages = current.filter(
                        (item) => item.optimistic && item.conversationId === conversationId,
                    );
                    return mergeMessages(payload.items || [], pendingMessages);
                });
                if (!appendOlder) {
                    setTimeout(scrollToBottom, 80);
                }
            } catch (error) {
                console.error(error);
                antdMessage.error(error.response?.data?.message || 'Không thể tải lịch sử chat');
            } finally {
                setLoadingMessages(false);
            }
        },
        [scrollToBottom],
    );

    const markAsRead = useCallback(async (conversationId) => {
        try {
            await api.put(`/chat/conversations/${conversationId}/read`);
            setConversations((current) =>
                current.map((conversation) =>
                    conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
                ),
            );
        } catch (error) {
            console.error(error);
        }
    }, []);

    const sendTyping = useCallback(
        (typing) => {
            if (!socketRef.current?.connected || !selectedConversationIdRef.current) return;
            socketRef.current.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({ conversationId: selectedConversationIdRef.current, typing }),
            });
        },
        [],
    );

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const client = new Client({
            brokerURL: `${wsProtocol}://${window.location.host}/ws-chat`,
            reconnectDelay: 5000,
            connectHeaders: { Authorization: `Bearer ${token}` },
            debug: () => {},
        });

        client.onConnect = () => {
            client.subscribe('/user/queue/chat/conversations', (frame) => {
                const payload = JSON.parse(frame.body);
                setConversations((current) => mergeConversation(current, payload));
                syncMessageSubscriptions();
            });

            client.subscribe('/user/queue/notifications', () => {
                fetchConversations();
            });

            syncMessageSubscriptions();
            syncActiveConversationRealtime(selectedConversationIdRef.current);
        };

        client.onStompError = (frame) => {
            antdMessage.error(frame.headers?.message || 'Không thể kết nối chat realtime');
        };

        client.activate();
        socketRef.current = client;
    }, [fetchConversations, mergeConversation, syncActiveConversationRealtime, syncMessageSubscriptions]);

    const fetchSuggestedUsers = useCallback(async () => {
        setLoadingUserSuggestions(true);
        try {
            const response = await api.get('/chat/users/suggestions');
            const items = response.data || [];
            setSuggestedUsers(items);
            mergeUsersIntoDirectory(items);
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tải gợi ý tạo nhóm');
        } finally {
            setLoadingUserSuggestions(false);
        }
    }, [mergeUsersIntoDirectory]);

    useEffect(() => {
        fetchConversations();
        connectSocket();
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            clearMessageSubscriptions();
            clearActiveConversationSubscriptions();
            if (socketRef.current) {
                socketRef.current.deactivate();
            }
        };
    }, [clearActiveConversationSubscriptions, clearMessageSubscriptions, connectSocket, fetchConversations]);

    useEffect(() => {
        syncMessageSubscriptions(conversations);
    }, [conversations, syncMessageSubscriptions]);

    useEffect(() => {
        syncActiveConversationRealtime(selectedConversationId);
    }, [selectedConversationId, syncActiveConversationRealtime]);

    useEffect(() => {
        setTypingUsers([]);
        setMessages([]);
        setComposer('');
        setAttachments([]);
        setSelectedMentions([]);
        setQuickMentionValue(undefined);
        setMentionDraft({ open: false, query: '', start: -1, end: -1 });
        setReplyTarget(null);

        if (selectedConversationId) {
            fetchMessages(selectedConversationId, 0, false);
            markAsRead(selectedConversationId);
            setShowMobileChat(true);
        } else {
            setMessages([]);
        }
    }, [fetchMessages, markAsRead, selectedConversationId]);

    useEffect(() => {
        if (!createOpen) return;
        fetchSuggestedUsers();
    }, [createOpen, fetchSuggestedUsers]);

    useEffect(() => {
        if (!createOpen) return undefined;

        const keyword = userSearchKeyword.trim();
        if (keyword.length < 2) {
            setRemoteUserSearchResults([]);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await api.get('/chat/users', { params: { keyword } });
                const items = response.data || [];
                setRemoteUserSearchResults(items);
                mergeUsersIntoDirectory(items);
            } catch (error) {
                console.error(error);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [createOpen, mergeUsersIntoDirectory, userSearchKeyword]);

    const handleComposerChange = (event) => {
        const nextValue = event.target.value;
        const cursorPosition = event.target.selectionStart ?? nextValue.length;

        setComposer(nextValue);
        setSelectedMentions((current) => pruneMentionSelections(nextValue, current));

        const beforeCursor = nextValue.slice(0, cursorPosition);
        const mentionMatch = beforeCursor.match(/(^|\s)@([^\s@]*)$/);
        if (mentionMatch) {
            const mentionQuery = mentionMatch[2] || '';
            const start = cursorPosition - mentionQuery.length - 1;
            setMentionDraft({
                open: true,
                query: mentionQuery,
                start,
                end: cursorPosition,
            });
        } else {
            setMentionDraft({ open: false, query: '', start: -1, end: -1 });
        }

        sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1200);
    };

    const handleInsertMention = useCallback(
        (candidate) => {
            if (!candidate) return;

            const currentDraft = mentionDraftRef.current;
            const mentionToken = `${candidate.mentionToken} `;
            let nextValue = composer;
            let nextCursorPosition = composer.length + mentionToken.length;

            if (currentDraft.open && currentDraft.start >= 0 && currentDraft.end >= currentDraft.start) {
                nextValue =
                    composer.slice(0, currentDraft.start) +
                    mentionToken +
                    composer.slice(currentDraft.end);
                nextCursorPosition = currentDraft.start + mentionToken.length;
            } else {
                const prefix = composer && !composer.endsWith(' ') ? ' ' : '';
                nextValue = `${composer}${prefix}${mentionToken}`;
                nextCursorPosition = nextValue.length;
            }

            const normalizedCandidate = {
                ...candidate,
                id: candidate.userId || candidate.id,
                userId: candidate.userId || candidate.id,
            };
            setComposer(nextValue);
            setSelectedMentions((current) =>
                pruneMentionSelections(
                    nextValue,
                    dedupeById(
                        [...current, normalizedCandidate].map((item) => ({
                            ...item,
                            id: item.userId || item.id,
                            userId: item.userId || item.id,
                        })),
                    ),
                ),
            );
            setMentionDraft({ open: false, query: '', start: -1, end: -1 });
            setQuickMentionValue(undefined);
            focusComposer(nextCursorPosition);
        },
        [composer, focusComposer, pruneMentionSelections],
    );

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
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploaded.push({
                    fileName: file.name,
                    fileUrl: response.data.fileUrl,
                    contentType: file.type || 'application/octet-stream',
                    sizeBytes: file.size,
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

    const handleSendMessage = async () => {
        if (!selectedConversationId || (!composer.trim() && attachments.length === 0)) return;

        const content = composer.trim();
        const clientMessageId = createClientMessageId();
        const mentionedUserIds = selectedMentions
            .filter((mention) => composer.includes(mention.mentionToken))
            .map((mention) => mention.userId || mention.id);

        const payload = {
            conversationId: selectedConversationId,
            content,
            parentMessageId: replyTarget?.id || null,
            clientMessageId,
            mentionedUserIds,
            attachments,
        };

        const optimisticMessage = buildOptimisticMessage({
            clientMessageId,
            conversationId: selectedConversationId,
            content: content || '[Đã gửi tệp đính kèm]',
            parentMessageId: replyTarget?.id || null,
            parentMessagePreview: replyTarget?.content || null,
            attachments,
            currentUser: user,
        });

        try {
            setSending(true);
            setMessages((current) => mergeMessages(current, [optimisticMessage]));
            setConversations((current) =>
                sortConversations(
                    current.map((conversation) =>
                        conversation.id === selectedConversationId
                            ? {
                                  ...conversation,
                                  lastMessageAt: optimisticMessage.createdAt,
                                  lastMessagePreview: getConversationPreview(optimisticMessage),
                                  lastSenderId: user?.id,
                                  lastSenderName: user?.fullName || 'Bạn',
                                  unreadCount: 0,
                              }
                            : conversation,
                    ),
                ),
            );
            const response = await api.post('/chat/messages', payload);
            setMessages((current) => reconcileIncomingMessage(current, response.data));
            setConversations((current) =>
                sortConversations(
                    current.map((conversation) =>
                        conversation.id === selectedConversationId
                            ? {
                                  ...conversation,
                                  lastMessageAt: response.data?.createdAt || optimisticMessage.createdAt,
                                  lastMessagePreview: getConversationPreview(response.data || optimisticMessage),
                                  lastSenderId: response.data?.senderId || user?.id,
                                  lastSenderName: response.data?.senderName || user?.fullName || 'Bạn',
                                  unreadCount: 0,
                              }
                            : conversation,
                    ),
                ),
            );

            setComposer('');
            setAttachments([]);
            setSelectedMentions([]);
            setReplyTarget(null);
            setMentionDraft({ open: false, query: '', start: -1, end: -1 });
            setQuickMentionValue(undefined);
            sendTyping(false);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            setMessages((current) => current.filter((item) => item.clientMessageId !== clientMessageId));
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Gửi tin nhắn thất bại');
        } finally {
            setSending(false);
        }
    };

    const handleSearchMessages = async () => {
        if (!searchKeyword.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchingMessages(true);
        try {
            const response = await api.get('/chat/messages/search', {
                params: { keyword: searchKeyword.trim(), page: 0, size: 20 },
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
                participantIds: selectedUsers,
            });

            const created = response.data;
            setConversations((current) => mergeConversation(current, created));
            setSelectedConversationId(created.id);
            setCreateOpen(false);
            setCreateTitle('');
            setSelectedUsers([]);
            setUserSearchKeyword('');
            setRemoteUserSearchResults([]);
            antdMessage.success('Tạo cuộc trò chuyện thành công');
        } catch (error) {
            console.error(error);
            antdMessage.error(error.response?.data?.message || 'Không thể tạo cuộc trò chuyện');
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            <div
                className={`sticky top-16 z-30 px-4 py-4 ${
                    darkMode ? 'bg-slate-950/90 backdrop-blur-lg' : 'bg-slate-100/90 backdrop-blur-lg'
                }`}
            >
                <div className="mx-auto max-w-7xl">
                    <div className={`rounded-2xl p-5 shadow-xl ${darkMode ? 'border border-slate-800 bg-slate-900' : 'bg-white'}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
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
                                        <div
                                            className={`badge-shimmer flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                                                darkMode ? 'bg-slate-800 text-slate-200' : 'bg-red-50 text-red-600'
                                            }`}
                                        >
                                            <Bell size={15} />
                                            {totalUnread} chưa đọc
                                        </div>
                                    </Badge>
                                )}
                                <Button
                                    className={`rounded-xl ${darkMode ? '!border-slate-700 !bg-slate-800 !text-slate-200' : ''}`}
                                    icon={darkMode ? <Sun size={15} /> : <Moon size={15} />}
                                    onClick={toggleDarkMode}
                                >
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

            <div className="mx-auto max-w-7xl px-4 pb-6">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
                    <div
                        className={`overflow-hidden rounded-2xl shadow-lg ${
                            showMobileChat ? 'hidden xl:block' : ''
                        } ${darkMode ? 'border border-slate-800 bg-slate-900' : 'bg-white'}`}
                    >
                        <div className={`border-b p-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <Input
                                prefix={<Search size={15} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />}
                                placeholder="Tìm cuộc trò chuyện..."
                                value={conversationFilter}
                                onChange={(event) => setConversationFilter(event.target.value)}
                                allowClear
                                className="rounded-xl"
                            />
                        </div>
                        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                            {loadingConversations ? (
                                <div className="flex justify-center p-8">
                                    <Spin />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <Empty className="py-10" description={conversationFilter ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'} />
                            ) : (
                                <List
                                    dataSource={filteredConversations}
                                    renderItem={(conversation) => {
                                        const peers = (conversation.participants || []).filter((participant) => participant.userId !== user?.id);
                                        const isActive = selectedConversationId === conversation.id;
                                        const hasUnread = conversation.unreadCount > 0;

                                        return (
                                            <List.Item
                                                className={`!border-none !px-4 !py-3 transition-all duration-200 ${
                                                    isActive
                                                        ? darkMode
                                                            ? '!border-l-2 !border-l-blue-500 !bg-blue-950/40'
                                                            : '!border-l-2 !border-l-blue-500 !bg-blue-50'
                                                        : darkMode
                                                          ? 'hover:!bg-slate-800'
                                                          : 'hover:!bg-slate-50'
                                                } cursor-pointer`}
                                                onClick={() => setSelectedConversationId(conversation.id)}
                                            >
                                                <div className="flex w-full gap-3">
                                                    <Badge dot={peers.some((participant) => participant.online)} color="green" offset={[-4, 36]}>
                                                        <Avatar
                                                            size={44}
                                                            src={peers[0]?.avatarUrl}
                                                            className="shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400"
                                                        >
                                                            {(conversation.title || 'C').charAt(0)}
                                                        </Avatar>
                                                    </Badge>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className={`truncate text-sm ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                                                                {conversation.title}
                                                            </div>
                                                            {hasUnread && <Badge count={conversation.unreadCount} size="small" />}
                                                        </div>
                                                        <div
                                                            className={`mt-0.5 truncate text-xs ${
                                                                hasUnread
                                                                    ? darkMode
                                                                        ? 'font-medium text-slate-200'
                                                                        : 'font-medium text-slate-800'
                                                                    : darkMode
                                                                      ? 'text-slate-400'
                                                                      : 'text-slate-500'
                                                            }`}
                                                        >
                                                            {conversation.lastSenderName ? `${conversation.lastSenderName}: ` : ''}
                                                            {conversation.lastMessagePreview || 'Chưa có tin nhắn'}
                                                        </div>
                                                        <div className={`mt-1 text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
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

                    <div
                        className={`min-h-[calc(100vh-280px)] rounded-2xl shadow-lg ${
                            !showMobileChat ? 'hidden xl:flex xl:flex-col' : 'flex flex-col'
                        } ${darkMode ? 'border border-slate-800 bg-slate-900' : 'bg-white'}`}
                    >
                        {!selectedConversation ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20">
                                    <MessageSquare size={40} className="text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <div className="mb-1 text-lg font-bold">Chọn cuộc trò chuyện</div>
                                    <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Chọn từ danh sách bên trái hoặc tạo cuộc trò chuyện mới
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`flex items-center justify-between gap-3 border-b p-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <button
                                            type="button"
                                            className={`rounded-xl p-2 transition-colors xl:hidden ${
                                                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                            }`}
                                            onClick={() => setShowMobileChat(false)}
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="min-w-0">
                                            <div className="truncate text-lg font-bold">{selectedConversation.title}</div>
                                            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {onlineCount > 0 && (
                                                    <>
                                                        <Circle size={8} className="presence-pulse fill-green-500 text-green-500" />
                                                        <span>{onlineCount} đang online</span>
                                                        <span className="mx-1">•</span>
                                                    </>
                                                )}
                                                <span>{visibleParticipants.length} thành viên</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {messagePage.hasNext && (
                                            <Button
                                                size="small"
                                                className="rounded-lg"
                                                icon={<ChevronLeft size={14} />}
                                                onClick={() => fetchMessages(selectedConversation.id, messagePage.page + 1, true)}
                                            >
                                                <span className="hidden sm:inline">Tải cũ hơn</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                                    {loadingMessages ? (
                                        <div className="flex justify-center py-12">
                                            <Spin />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-3 py-16">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-500/10">
                                                <MessageSquare size={28} className="text-blue-400" />
                                            </div>
                                            <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Chưa có tin nhắn. Hãy gửi lời chào.
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((item) => {
                                            const mine = item.senderId === user?.id;
                                            return (
                                                <div key={item.id} className={`message-enter flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="flex max-w-[80%] items-end gap-2">
                                                        {!mine && (
                                                            <Avatar
                                                                size={32}
                                                                src={item.senderAvatarUrl}
                                                                className="mb-1 shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400"
                                                            >
                                                                {item.senderName?.charAt(0)}
                                                            </Avatar>
                                                        )}
                                                        <div
                                                            className={`rounded-2xl px-4 py-3 ${
                                                                mine
                                                                    ? 'rounded-br-md bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                                                    : darkMode
                                                                      ? 'rounded-bl-md bg-slate-800 text-slate-100'
                                                                      : 'rounded-bl-md bg-slate-100 text-slate-900'
                                                            }`}
                                                        >
                                                            <div className="mb-1.5 flex items-center gap-2">
                                                                <div
                                                                    className={`text-[11px] font-medium ${
                                                                        mine ? 'text-white/70' : darkMode ? 'text-slate-400' : 'text-slate-500'
                                                                    }`}
                                                                >
                                                                    {mine ? 'Bạn' : item.senderName} • {dayjs(item.createdAt).format('HH:mm')}
                                                                </div>
                                                                {item.optimistic && (
                                                                    <span
                                                                        className={`text-[10px] ${
                                                                            mine ? 'text-white/60' : darkMode ? 'text-slate-500' : 'text-slate-400'
                                                                        }`}
                                                                    >
                                                                        (đang gửi)
                                                                    </span>
                                                                )}
                                                                {item.editedAt && (
                                                                    <span
                                                                        className={`text-[10px] ${
                                                                            mine ? 'text-white/50' : darkMode ? 'text-slate-500' : 'text-slate-400'
                                                                        }`}
                                                                    >
                                                                        (đã sửa)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.parentMessagePreview && (
                                                                <div
                                                                    className={`mb-2 rounded-lg border-l-2 p-2 text-xs ${
                                                                        mine
                                                                            ? 'border-white/30 bg-white/15'
                                                                            : darkMode
                                                                              ? 'border-slate-500 bg-slate-700'
                                                                              : 'border-slate-300 bg-white'
                                                                    }`}
                                                                >
                                                                    <Reply size={10} className="mr-1 inline opacity-60" />
                                                                    {item.parentMessagePreview}
                                                                </div>
                                                            )}
                                                            <div className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                                                                {renderMessageWithMentions(item.content, mine, darkMode)}
                                                            </div>
                                                            {item.attachments?.length > 0 && (
                                                                <div className="mt-2 space-y-1.5">
                                                                    {item.attachments.map((attachment) => (
                                                                        <a
                                                                            key={`${item.id}-${attachment.fileUrl}`}
                                                                            href={attachment.fileUrl}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                                                                                mine
                                                                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                                                                    : darkMode
                                                                                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                                                      : 'bg-white text-slate-700 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            {attachment.contentType?.startsWith('image/') ? <Image size={14} /> : <Paperclip size={14} />}
                                                                            <span className="truncate">{attachment.fileName}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="mt-1.5 flex items-center justify-end">
                                                                <button
                                                                    title="Reply"
                                                                    className={`rounded-md p-1 transition-colors ${
                                                                        mine
                                                                            ? 'hover:bg-white/20'
                                                                            : darkMode
                                                                              ? 'hover:bg-slate-700'
                                                                              : 'hover:bg-slate-200'
                                                                    }`}
                                                                    onClick={() => {
                                                                        setReplyTarget(item);
                                                                        focusComposer();
                                                                    }}
                                                                >
                                                                    <Reply size={13} className="opacity-60" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className={`flex min-h-[28px] items-center px-4 text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {typingUsers.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="typing-dot" />
                                            <span className="typing-dot" />
                                            <span className="typing-dot" />
                                            <span className="ml-1 text-xs font-medium">
                                                {typingUsers.map((typingUser) => typingUser.fullName).join(', ')} đang nhập...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={`space-y-3 border-t p-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    {replyTarget && (
                                        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                                            <div className="mr-2 min-w-0 text-sm">
                                                <div className="text-xs font-semibold text-blue-500">
                                                    <Reply size={12} className="mr-1 inline" />
                                                    Reply {replyTarget.senderName}
                                                </div>
                                                <div className={`mt-0.5 truncate text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {replyTarget.content}
                                                </div>
                                            </div>
                                            <Button type="text" size="small" icon={<X size={14} />} onClick={() => setReplyTarget(null)} />
                                        </div>
                                    )}

                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {attachments.map((attachment, index) => (
                                                <Tag
                                                    key={`${attachment.fileUrl}-${index}`}
                                                    closable
                                                    className="rounded-lg"
                                                    onClose={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                                >
                                                    <Paperclip size={12} className="mr-1 inline" />
                                                    {attachment.fileName}
                                                </Tag>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div className="flex gap-1">
                                            {QUICK_EMOJIS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all hover:scale-110 ${
                                                        darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                                    }`}
                                                    onClick={() => setComposer((current) => `${current}${emoji}`)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        {mentionCandidates.length > 0 && (
                                            <Select
                                                allowClear
                                                showSearch
                                                placeholder="@mention"
                                                className="min-w-[180px] rounded-lg"
                                                size="small"
                                                value={quickMentionValue}
                                                onClear={() => setQuickMentionValue(undefined)}
                                                onSelect={(value) => {
                                                    const candidate = mentionCandidates.find((item) => item.userId === value);
                                                    handleInsertMention(candidate);
                                                }}
                                                filterOption={(input, option) =>
                                                    normalizeText(option?.searchText || '').includes(normalizeText(input))
                                                }
                                                options={quickMentionOptions}
                                            />
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            {mentionDraft.open && (
                                                <div
                                                    className={`absolute bottom-full left-0 z-20 mb-2 w-full max-w-sm overflow-hidden rounded-2xl border shadow-xl ${
                                                        darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                                                    }`}
                                                >
                                                    {mentionSuggestions.length === 0 ? (
                                                        <div className={`px-4 py-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            Không tìm thấy thành viên phù hợp
                                                        </div>
                                                    ) : (
                                                        mentionSuggestions.map((candidate) => (
                                                            <button
                                                                key={candidate.userId}
                                                                type="button"
                                                                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                                                                    darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                                                                }`}
                                                                onMouseDown={(event) => event.preventDefault()}
                                                                onClick={() => handleInsertMention(candidate)}
                                                            >
                                                                <Avatar
                                                                    size={32}
                                                                    src={candidate.avatarUrl}
                                                                    className="shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400"
                                                                >
                                                                    {candidate.fullName?.charAt(0)}
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                        {candidate.fullName}
                                                                    </div>
                                                                    <div className="truncate text-xs text-blue-600">{candidate.mentionToken}</div>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            <Input.TextArea
                                                ref={composerRef}
                                                rows={2}
                                                placeholder="Nhập tin nhắn..."
                                                value={composer}
                                                onChange={handleComposerChange}
                                                onKeyDown={(event) => {
                                                    if (!event.shiftKey && event.key === 'Enter' && mentionDraft.open && mentionSuggestions.length > 0) {
                                                        event.preventDefault();
                                                        handleInsertMention(mentionSuggestions[0]);
                                                        return;
                                                    }

                                                    if (event.key === 'Escape' && mentionDraft.open) {
                                                        event.preventDefault();
                                                        setMentionDraft({ open: false, query: '', start: -1, end: -1 });
                                                        return;
                                                    }

                                                    if (!event.shiftKey && event.key === 'Enter') {
                                                        event.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                className="!rounded-xl"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                className={`flex cursor-pointer items-center justify-center rounded-xl p-2.5 transition-colors ${
                                                    darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                                                }`}
                                            >
                                                {uploading ? <Spin size="small" /> : <Paperclip size={16} />}
                                                <input type="file" multiple className="hidden" onChange={handleUploadFiles} />
                                            </label>
                                            <Button
                                                type="primary"
                                                className="!h-auto !rounded-xl !p-2.5"
                                                icon={<Send size={16} />}
                                                loading={sending}
                                                onClick={handleSendMessage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={`hidden rounded-2xl shadow-lg xl:block ${darkMode ? 'border border-slate-800 bg-slate-900' : 'bg-white'}`}>
                        <div className={`border-b p-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="mb-3 text-sm font-bold">Tìm kiếm tin nhắn</div>
                            <div className="flex gap-2">
                                <Input
                                    prefix={<Search size={14} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />}
                                    placeholder="Nhập từ khóa..."
                                    size="small"
                                    className="rounded-lg"
                                    value={searchKeyword}
                                    onChange={(event) => setSearchKeyword(event.target.value)}
                                    onPressEnter={handleSearchMessages}
                                />
                                <Button size="small" className="rounded-lg" onClick={handleSearchMessages} loading={searchingMessages}>
                                    Tìm
                                </Button>
                            </div>
                        </div>
                        <div className="max-h-[calc(100vh-480px)] overflow-y-auto p-4">
                            {searchResults.length === 0 ? (
                                <Empty description="Chưa có kết quả" styles={{ image: { height: 60 } }} />
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((item) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            className={`w-full rounded-xl p-2.5 text-left transition ${
                                                darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-blue-50'
                                            }`}
                                            onClick={() => {
                                                setSelectedConversationId(item.conversationId);
                                                setTimeout(() => setReplyTarget(item), 150);
                                            }}
                                        >
                                            <div className="text-xs font-semibold">{item.senderName}</div>
                                            <div className={`mt-0.5 line-clamp-2 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {item.content}
                                            </div>
                                            <div className={`mt-1 text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedConversation && (
                                <div className="mt-5">
                                    <div className="mb-3 text-sm font-bold">Thành viên ({visibleParticipants.length})</div>
                                    <div className="space-y-2">
                                        {visibleParticipants.map((participant) => (
                                            <div
                                                key={participant.userId}
                                                className={`flex items-center gap-2.5 rounded-xl p-2.5 ${
                                                    darkMode ? 'bg-slate-800' : 'bg-slate-50'
                                                }`}
                                            >
                                                <Badge dot={participant.online} color="green" offset={[-2, 28]}>
                                                    <Avatar
                                                        size={32}
                                                        src={participant.avatarUrl}
                                                        className="bg-gradient-to-br from-blue-500 to-cyan-400"
                                                    >
                                                        {participant.fullName?.charAt(0)}
                                                    </Avatar>
                                                </Badge>
                                                <div className="min-w-0">
                                                    <div className="truncate text-xs font-medium">{participant.fullName}</div>
                                                    <div
                                                        className={`flex items-center gap-1 text-[10px] ${
                                                            participant.online ? 'text-green-500' : darkMode ? 'text-slate-500' : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {participant.online ? (
                                                            <>
                                                                <Circle size={6} className="presence-pulse fill-green-500" />
                                                                Online
                                                            </>
                                                        ) : (
                                                            'Offline'
                                                        )}
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

            <Modal
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={handleCreateConversation}
                okText="Tạo"
                title="Tạo cuộc trò chuyện mới"
            >
                <div className="space-y-4 py-2">
                    <div>
                        <label className={`mb-1.5 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Tên cuộc trò chuyện
                        </label>
                        <Input
                            value={createTitle}
                            onChange={(event) => setCreateTitle(event.target.value)}
                            placeholder="VD: Nhóm hỗ trợ đơn hàng, Hỗ trợ kỹ thuật..."
                            className="rounded-xl"
                        />
                    </div>
                    <div>
                        <label className={`mb-1.5 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Chọn người tham gia
                        </label>
                        <Select
                            mode="multiple"
                            className="w-full"
                            placeholder="Gõ tên hoặc email để tìm..."
                            showSearch
                            value={selectedUsers}
                            onSearch={setUserSearchKeyword}
                            onChange={setSelectedUsers}
                            filterOption={false}
                            notFoundContent={
                                loadingUserSuggestions ? (
                                    <div className="py-4 text-center">
                                        <Spin size="small" />
                                    </div>
                                ) : userSearchKeyword.trim() ? (
                                    'Không tìm thấy người phù hợp'
                                ) : (
                                    'Chưa có gợi ý từ đơn hàng. Bạn vẫn có thể gõ để tìm.'
                                )
                            }
                            options={createUserOptions}
                        />
                        <div className={`mt-2 text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Gợi ý ưu tiên hiển thị người có liên quan tới booking của bạn, nên khách sẽ thấy thợ phù hợp và thợ sẽ thấy khách hoặc đồng đội cùng đơn.
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MessagesPage;
