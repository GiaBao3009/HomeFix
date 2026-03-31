import { useState, useEffect, useRef } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Alert, Form, Input, InputNumber, Switch, Row, Col, Statistic, Rate, List, Tabs } from 'antd';
import { Clock, MapPin, User, Wrench, RefreshCw, Star, Trophy, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const TechnicianDashboard = () => {
    const { user, refreshUserProfile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [openBookings, setOpenBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [dashboard, setDashboard] = useState({});
    const [advancedAnalytics, setAdvancedAnalytics] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [autoReport, setAutoReport] = useState({});
    const [categories, setCategories] = useState([]);
    const [mainTechnicians, setMainTechnicians] = useState([]);
    const [chatBookingId, setChatBookingId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [ticketForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const [profileForm] = Form.useForm();
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [assistantModalVisible, setAssistantModalVisible] = useState(false);
    const [assistantBooking, setAssistantBooking] = useState(null);
    const [assistantCandidates, setAssistantCandidates] = useState([]);
    const [selectedAssistantId, setSelectedAssistantId] = useState(null);
    const [assistantLoading, setAssistantLoading] = useState(false);
    const assignedIdsRef = useRef(new Set());
    const selectedTechnicianType = Form.useWatch('technicianType', profileForm);

    const fetchBookings = async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        const [bookingsRes, openBookingsRes, dashboardRes, reviewsRes, leaderboardRes, analyticsRes, ticketsRes, alertsRes, interactionsRes, reportRes] = await Promise.allSettled([
            api.get('/users/technician/history'),
            api.get('/bookings/available'),
            api.get('/users/technician/dashboard'),
            api.get('/users/technician/reviews'),
            api.get('/technician/leaderboard'),
            api.get('/technician/analytics'),
            api.get('/technician/tickets'),
            api.get('/technician/alerts'),
            api.get('/technician/interactions'),
            api.get('/technician/report')
        ]);
        try {
            let bookingData = [];
            if (bookingsRes.status === 'fulfilled') {
                bookingData = bookingsRes.value.data || [];
            } else {
                const backendMessage = bookingsRes.reason?.response?.data?.message || '';
                const isBlockedMessage = backendMessage.includes('hoàn tất hồ sơ trước khi nhận việc');
                if (!isBlockedMessage && !silent) {
                    message.error('Không thể tải lịch sử công việc kỹ thuật viên');
                }
            }
            const assignedIds = new Set(bookingData.filter(item => item.status === 'ASSIGNED').map(item => item.id));
            if (assignedIdsRef.current.size > 0) {
                assignedIds.forEach((id) => {
                    if (!assignedIdsRef.current.has(id)) {
                        message.info(`Bạn vừa nhận booking mới #${id}`);
                    }
                });
            }
            assignedIdsRef.current = assignedIds;
            setBookings(bookingData);
            setOpenBookings(openBookingsRes.status === 'fulfilled' ? (openBookingsRes.value.data || []) : []);
            setDashboard(dashboardRes.status === 'fulfilled' ? (dashboardRes.value.data || {}) : {});
            setReviews(reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data || []) : []);
            setLeaderboard(leaderboardRes.status === 'fulfilled' ? (leaderboardRes.value.data || []) : []);
            setAdvancedAnalytics(analyticsRes.status === 'fulfilled' ? (analyticsRes.value.data || {}) : {});
            setTickets(ticketsRes.status === 'fulfilled' ? (ticketsRes.value.data || []) : []);
            setAlerts(alertsRes.status === 'fulfilled' ? (alertsRes.value.data || []) : []);
            setInteractions(interactionsRes.status === 'fulfilled' ? (interactionsRes.value.data || []) : []);
            setAutoReport(reportRes.status === 'fulfilled' ? (reportRes.value.data || {}) : {});
        } catch (error) {
            console.error(error);
            if (!silent) {
                message.error('Không thể tải dữ liệu kỹ thuật viên');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const fetchTechnicianProfile = async () => {
        setProfileLoading(true);
        try {
            const [profileRes, categoriesRes, techniciansRes] = await Promise.all([
                api.get('/users/technician/profile'),
                api.get('/categories'),
                api.get('/users/technicians')
            ]);
            const profile = profileRes.data || {};
            setCategories(categoriesRes.data || []);
            setMainTechnicians((techniciansRes.data || []).filter((tech) => tech.technicianType === 'MAIN' && tech.id !== profile.id));
            setTechnicianProfile(profile);
            if (!profile.technicianProfileCompleted) {
                setProfileModalOpen(true);
            }
        } catch (error) {
            console.error(error);
            message.error('Không thể tải hồ sơ kỹ thuật viên');
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicianProfile();
        fetchBookings();
        const interval = setInterval(() => fetchBookings(true), 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (technicianProfile) {
            profileForm.setFieldsValue({
                specialty: technicianProfile.specialty,
                experienceYears: technicianProfile.experienceYears,
                workDescription: technicianProfile.workDescription,
                citizenId: technicianProfile.citizenId,
                technicianType: technicianProfile.technicianType || 'ASSISTANT',
                supervisingTechnicianId: technicianProfile.supervisingTechnicianId || undefined,
                categoryIds: technicianProfile.categoryIds || [],
                baseLocation: technicianProfile.baseLocation,
                availableFrom: technicianProfile.availableFrom,
                availableTo: technicianProfile.availableTo,
                availableForAutoAssign: technicianProfile.availableForAutoAssign ?? true
            });
        }
    }, [technicianProfile, profileForm]);

    const handleTechnicianResponse = async (bookingId, accepted, reason = '') => {
        try {
            await api.post(`/bookings/${bookingId}/technician-response?accepted=${accepted}&reason=${reason}`);
            message.success(accepted ? 'Đã nhận việc thành công' : 'Đã gửi từ chối, hệ thống sẽ tự điều phối lại');
            setRejectionModalVisible(false);
            setRejectionReason('');
            fetchBookings();
        } catch (error) {
            console.error(error);
            message.error('Thao tác thất bại: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleClaimBooking = async (bookingId) => {
        try {
            await api.post(`/bookings/${bookingId}/claim`);
            message.success('Da nhan don thanh cong');
            fetchBookings();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Nhan don that bai');
        }
    };

    const openRejectionModal = (bookingId) => {
        setSelectedBookingId(bookingId);
        setRejectionModalVisible(true);
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.patch(`/bookings/${bookingId}/status?status=${newStatus}`);
            message.success('Cập nhật trạng thái thành công');
            fetchBookings();
        } catch (error) {
            console.error(error);
            message.error('Cập nhật trạng thái thất bại');
        }
    };

    const openAssistantModal = async (booking) => {
        setAssistantBooking(booking);
        setSelectedAssistantId(null);
        setAssistantModalVisible(true);
        setAssistantLoading(true);
        try {
            const res = await api.get(`/users/technician/assistant-candidates?bookingId=${booking.id}`);
            setAssistantCandidates(res.data || []);
        } catch (error) {
            message.error(error.response?.data?.message || 'Khong the tai danh sach tho phu');
        } finally {
            setAssistantLoading(false);
        }
    };

    const handleAddAssistant = async () => {
        if (!assistantBooking || !selectedAssistantId) {
            message.warning('Vui long chon tho phu');
            return;
        }
        try {
            await api.post(`/bookings/${assistantBooking.id}/assistants?assistantId=${selectedAssistantId}`);
            message.success('Da them tho phu vao booking');
            setAssistantModalVisible(false);
            setAssistantCandidates([]);
            setAssistantBooking(null);
            setSelectedAssistantId(null);
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Them tho phu that bai');
        }
    };

    const createTicket = async (values) => {
        try {
            const payload = {
                ...values,
                bookingId: values.bookingId ? Number(values.bookingId) : null,
                customerId: Number(values.customerId)
            };
            await api.post('/technician/tickets', payload);
            message.success('Đã tạo ticket hỗ trợ');
            ticketForm.resetFields();
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tạo ticket');
        }
    };

    const updateTicketStatus = async (ticketId, status) => {
        try {
            await api.patch(`/technician/tickets/${ticketId}/status?status=${status}`);
            message.success('Đã cập nhật ticket');
            fetchBookings(true);
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật ticket thất bại');
        }
    };

    const openChat = async (bookingId) => {
        setChatBookingId(bookingId);
        try {
            const res = await api.get(`/technician/chat/${bookingId}/messages`);
            setChatMessages(res.data || []);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không tải được đoạn chat');
        }
    };

    const sendChat = async () => {
        if (!chatBookingId || !chatInput.trim()) {
            return;
        }
        try {
            await api.post(`/technician/chat/${chatBookingId}/messages`, { content: chatInput.trim() });
            setChatInput('');
            const res = await api.get(`/technician/chat/${chatBookingId}/messages`);
            setChatMessages(res.data || []);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không gửi được tin nhắn');
        }
    };

    const submitTechnicianProfile = async (values) => {
        setSavingProfile(true);
        try {
            const normalizedTime = (value) => {
                if (!value) return null;
                if (/^\d{2}:\d{2}$/.test(value)) {
                    return `${value}:00`;
                }
                return value;
            };
            const payload = {
                ...values,
                baseLocation: values.baseLocation?.trim(),
                availableFrom: normalizedTime(values.availableFrom),
                availableTo: normalizedTime(values.availableTo),
                supervisingTechnicianId: values.technicianType === 'ASSISTANT'
                    ? Number(values.supervisingTechnicianId)
                    : null,
                categoryIds: (Array.isArray(values.categoryIds) ? values.categoryIds : [values.categoryIds])
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            };
            if (!payload.categoryIds.length) {
                message.error('Vui lòng chọn ít nhất 1 chuyên mục kỹ thuật');
                return;
            }
            if (values.technicianType === 'ASSISTANT' && !payload.supervisingTechnicianId) {
                message.error('Vui long chon tho chinh phu trach');
                return;
            }
            await api.put('/users/technician/profile', payload);
            message.success('Cập nhật hồ sơ kỹ thuật viên thành công');
            setProfileModalOpen(false);
            await refreshUserProfile();
            fetchTechnicianProfile();
            fetchBookings();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Cập nhật hồ sơ thất bại');
        } finally {
            setSavingProfile(false);
        }
    };

    const isBlockedByProfile = !technicianProfile?.technicianProfileCompleted;
    const isMainPending = technicianProfile?.technicianType === 'MAIN' && technicianProfile?.technicianApprovalStatus === 'PENDING';
    const isMainRejected = technicianProfile?.technicianType === 'MAIN' && technicianProfile?.technicianApprovalStatus === 'REJECTED';
    const isAssistantMissingSupervisor = technicianProfile?.technicianType === 'ASSISTANT' && !technicianProfile?.supervisingTechnicianId;
    const cannotWork = isBlockedByProfile || isMainPending || isMainRejected || isAssistantMissingSupervisor;

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text strong>#{text}</Text>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text) => (
                <div className="flex gap-2 items-center">
                    <User size={16} className="text-blue-500" />
                    <span>{text}</span>
                </div>
            ),
        },
        {
            title: 'Dịch vụ',
            dataIndex: 'serviceName',
            key: 'serviceName',
            render: (text) => (
                <div className="flex gap-2 items-center">
                    <Wrench size={16} className="text-orange-500" />
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: 'Thời gian & Địa điểm',
            key: 'info',
            render: (_, record) => (
                <div className="space-y-1">
                    <div className="flex gap-2 items-center text-slate-600">
                        <Clock size={14} />
                        {dayjs(record.bookingTime).format('HH:mm DD/MM/YYYY')}
                    </div>
                    <div className="flex gap-2 items-center text-slate-600">
                        <MapPin size={14} />
                        {record.address}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                let text = status;
                switch (status) {
                    case 'PENDING': color = 'orange'; text = 'Chờ xử lý'; break;
                    case 'ASSIGNED': color = 'blue'; text = 'Chờ xác nhận'; break;
                    case 'ARRIVED': color = 'geekblue'; text = 'Đã đến nơi'; break;
                    case 'WORKING': color = 'purple'; text = 'Đang làm việc'; break;
                    case 'IN_PROGRESS': color = 'processing'; text = 'Đang thực hiện'; break;
                    case 'COMPLETED': color = 'success'; text = 'Hoàn thành'; break;
                    case 'CANCELLED': color = 'error'; text = 'Đã hủy'; break;
                    case 'DECLINED': color = 'error'; text = 'Đã từ chối'; break;
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'ASSIGNED' && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => handleTechnicianResponse(record.id, true)}
                                className="bg-blue-600"
                                disabled={cannotWork}
                            >
                                Nhận việc
                            </Button>
                            <Button
                                danger
                                size="small"
                                onClick={() => openRejectionModal(record.id)}
                                disabled={cannotWork}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}
                    {record.status === 'IN_PROGRESS' && (
                        <Button type="primary" size="small" onClick={() => handleStatusUpdate(record.id, 'ARRIVED')} disabled={cannotWork}>
                            Đã đến nơi
                        </Button>
                    )}
                    {record.status === 'ARRIVED' && (
                        <Button type="primary" size="small" className="bg-purple-600" onClick={() => handleStatusUpdate(record.id, 'WORKING')} disabled={cannotWork}>
                            Bắt đầu làm việc
                        </Button>
                    )}
                    {record.status === 'WORKING' && (
                        <Button type="primary" size="small" className="bg-green-600" onClick={() => handleStatusUpdate(record.id, 'COMPLETED')} disabled={cannotWork}>
                            Hoàn thành
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const renderStatusTag = (status) => {
        let color = 'default';
        let text = status;
        switch (status) {
            case 'PENDING': color = 'orange'; text = 'Chờ xử lý'; break;
            case 'CONFIRMED': color = 'gold'; text = 'Đang mở'; break;
            case 'ASSIGNED': color = 'blue'; text = 'Đã nhận'; break;
            case 'ARRIVED': color = 'geekblue'; text = 'Đã đến nơi'; break;
            case 'WORKING': color = 'purple'; text = 'Đang làm việc'; break;
            case 'IN_PROGRESS': color = 'processing'; text = 'Đang thực hiện'; break;
            case 'COMPLETED': color = 'success'; text = 'Hoàn thành'; break;
            case 'CANCELLED': color = 'error'; text = 'Đã hủy'; break;
            case 'DECLINED': color = 'error'; text = 'Da tu choi'; break;
            default: break;
        }
        return <Tag color={color}>{text}</Tag>;
    };

    const openColumns = [
        {
            title: 'Ma don',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text strong>#{text}</Text>,
        },
        {
            title: 'Dich vu',
            dataIndex: 'serviceName',
            key: 'serviceName',
        },
        {
            title: 'Thong tin',
            key: 'openInfo',
            render: (_, record) => (
                <div className="space-y-1">
                    <div className="flex gap-2 items-center text-slate-600">
                        <Clock size={14} />
                        {dayjs(record.bookingTime).format('HH:mm DD/MM/YYYY')}
                    </div>
                    <div className="flex gap-2 items-center text-slate-600">
                        <MapPin size={14} />
                        {record.address}
                    </div>
                    {record.dispatchBlockReason && (
                        <div className="text-amber-600 text-xs">
                            {record.dispatchBlockReason}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Trang thai',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    {renderStatusTag(record.status)}
                    <Tag color={record.dispatchEligible ? 'green' : 'orange'}>
                        {record.dispatchEligible ? 'Co the nhan' : 'Tam thoi chua nhan duoc'}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Hanh dong',
            key: 'openAction',
            render: (_, record) => (
                <div className="space-y-2">
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleClaimBooking(record.id)}
                        disabled={cannotWork || !record.dispatchEligible}
                    >
                        Nhan don
                    </Button>
                    {!record.dispatchEligible && record.dispatchBlockReason && (
                        <div className="text-xs text-slate-500 max-w-40">
                            {record.dispatchBlockReason}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    const bookingColumns = [
        {
            title: 'Ma don',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text strong>#{text}</Text>,
        },
        {
            title: 'Khach hang',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text) => (
                <div className="flex gap-2 items-center">
                    <User size={16} className="text-blue-500" />
                    <span>{text}</span>
                </div>
            ),
        },
        {
            title: 'Dich vu',
            dataIndex: 'serviceName',
            key: 'serviceName',
        },
        {
            title: 'Thong tin',
            key: 'info',
            render: (_, record) => (
                <div className="space-y-1">
                    <div className="flex gap-2 items-center text-slate-600">
                        <Clock size={14} />
                        {dayjs(record.bookingTime).format('HH:mm DD/MM/YYYY')}
                    </div>
                    <div className="flex gap-2 items-center text-slate-600">
                        <MapPin size={14} />
                        {record.address}
                    </div>
                </div>
            ),
        },
        {
            title: 'To doi',
            key: 'team',
            render: (_, record) => (
                <div className="space-y-1">
                    <div className="text-slate-700">Chinh: {record.technicianName || 'Chua co'}</div>
                    <div className="flex flex-wrap gap-1">
                        {(record.assistantTechnicianNames || []).length
                            ? record.assistantTechnicianNames.map((name) => <Tag key={`${record.id}-${name}`}>{name}</Tag>)
                            : <Text type="secondary">Chua co tho phu</Text>}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trang thai',
            dataIndex: 'status',
            key: 'status',
            render: renderStatusTag,
        },
        {
            title: 'Hanh dong',
            key: 'action',
            render: (_, record) => {
                const isOwner = record.technicianId === user?.id;
                const isAssistantOnBooking = (record.assistantTechnicianIds || []).includes(user?.id);
                const canManageAssistants = isOwner && technicianProfile?.technicianType === 'MAIN';

                return (
                    <Space wrap>
                        {record.status === 'ASSIGNED' && isOwner && (
                            <>
                                <Button type="primary" size="small" onClick={() => handleTechnicianResponse(record.id, true)} disabled={cannotWork}>
                                    Bat dau
                                </Button>
                                <Button danger size="small" onClick={() => openRejectionModal(record.id)} disabled={cannotWork}>
                                    Tu choi
                                </Button>
                            </>
                        )}
                        {record.status === 'ASSIGNED' && isAssistantOnBooking && !isOwner && (
                            <Button type="primary" size="small" onClick={() => handleStatusUpdate(record.id, 'IN_PROGRESS')} disabled={cannotWork}>
                                Bắt đầu hỗ trợ
                            </Button>
                        )}
                        {record.status === 'IN_PROGRESS' && (isOwner || isAssistantOnBooking) && (
                            <Button type="primary" size="small" onClick={() => handleStatusUpdate(record.id, 'ARRIVED')} disabled={cannotWork}>
                                Đã đến nơi
                            </Button>
                        )}
                        {record.status === 'ARRIVED' && (isOwner || isAssistantOnBooking) && (
                            <Button type="primary" size="small" className="bg-purple-600" onClick={() => handleStatusUpdate(record.id, 'WORKING')} disabled={cannotWork}>
                                Bắt đầu làm việc
                            </Button>
                        )}
                        {record.status === 'WORKING' && (isOwner || isAssistantOnBooking) && (
                            <Button type="primary" size="small" className="bg-green-600" onClick={() => handleStatusUpdate(record.id, 'COMPLETED')} disabled={cannotWork}>
                                Hoàn thành
                            </Button>
                        )}
                        {canManageAssistants && ['ASSIGNED', 'IN_PROGRESS', 'ARRIVED', 'WORKING'].includes(record.status) && (
                            <Button size="small" onClick={() => openAssistantModal(record)} disabled={cannotWork}>
                                Them tho phu
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-6 mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2}>Bảng công việc kỹ thuật viên</Title>
                    <Text type="secondary">Luồng mới: hệ thống tự động điều phối công việc theo chuyên mục</Text>
                </div>
                <Button icon={<RefreshCw size={16} />} onClick={() => { fetchTechnicianProfile(); fetchBookings(); }}>
                    Làm mới
                </Button>
            </div>

            {isBlockedByProfile && (
                <Alert
                    type="warning"
                    className="mb-4"
                    message="Bạn cần hoàn tất hồ sơ kỹ thuật viên trước khi nhận việc."
                    action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Hoàn tất hồ sơ</Button>}
                />
            )}
            {isMainPending && (
                <Alert
                    type="info"
                    className="mb-4"
                    message="Thợ chính đang chờ admin duyệt kỹ năng. Bạn chưa thể nhận việc."
                />
            )}
            {isMainRejected && (
                <Alert
                    type="error"
                    className="mb-4"
                    message="Hồ sơ thợ chính chưa được duyệt. Vui lòng cập nhật lại hồ sơ."
                    action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Cập nhật hồ sơ</Button>}
                />
            )}

            {isAssistantMissingSupervisor && (
                <Alert
                    type="warning"
                    className="mb-4"
                    message="Tho phu can duoc gan voi mot tho chinh truoc khi nhan viec."
                    action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Cap nhat ho so</Button>}
                />
            )}
            {technicianProfile?.technicianType === 'ASSISTANT' && technicianProfile?.supervisingTechnicianName && (
                <Alert
                    type="info"
                    className="mb-4"
                    message={`Ban dang la tho phu cua ${technicianProfile.supervisingTechnicianName}. ${technicianProfile.assistantPromoteAt ? `He thong se tu len tho chinh vao ${dayjs(technicianProfile.assistantPromoteAt).format('DD/MM/YYYY HH:mm')}.` : ''}`}
                />
            )}

            <Row gutter={16} className="mb-4">
                <Col xs={24} md={8}>
                    <Card bordered={false}>
                        <Statistic title="Đơn chờ nhận" value={dashboard.pendingJobs || 0} prefix={<MessageSquare size={16} />} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false}>
                        <Statistic title="Đơn đang làm" value={dashboard.inProgressJobs || 0} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false}>
                        <Statistic title="Đơn hoàn thành" value={dashboard.completedJobs || 0} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} className="mb-4">
                <Col xs={24} md={12}>
                    <Card bordered={false}>
                        <div className="flex justify-between items-center">
                            <div>
                                <Text strong>Điểm đánh giá trung bình</Text>
                                <div className="text-xl font-semibold mt-1">{dashboard.averageRating || 0}/5</div>
                            </div>
                            <div className="text-right">
                                <Rate disabled allowHalf value={dashboard.averageRating || 0} />
                                <div className="text-slate-500 text-sm mt-1">{dashboard.totalReviews || 0} đánh giá</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card bordered={false}>
                        <Statistic title="Số dư ví" value={dashboard.walletBalance || 0} suffix="VND" />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} className="mb-4">
                <Col xs={24} md={6}>
                    <Card bordered={false}>
                        <Statistic title="Tỉ lệ hoàn thành" value={advancedAnalytics.completionRate || 0} suffix="%" />
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}>
                        <Statistic title="Ticket quá hạn" value={advancedAnalytics.overdueTickets || 0} />
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}>
                        <Statistic title="Đơn hủy" value={advancedAnalytics.cancelled || 0} />
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}>
                        <Statistic title="Đơn từ chối" value={advancedAnalytics.declined || 0} />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm mb-4">
                <Title level={4}>Don phu hop dang mo</Title>
                <Table
                    columns={openColumns}
                    dataSource={openBookings}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    loading={loading || profileLoading}
                    locale={{ emptyText: 'Chua co don mo phu hop' }}
                />
            </Card>

            <Card bordered={false} className="shadow-sm mb-4">
                <Title level={4}>Don cua ban</Title>
                <Table
                    columns={bookingColumns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading || profileLoading}
                />
            </Card>

            <Modal
                title="Them tho phu vao booking"
                open={assistantModalVisible}
                onOk={handleAddAssistant}
                okText="Them"
                cancelText="Dong"
                confirmLoading={assistantLoading}
                onCancel={() => {
                    setAssistantModalVisible(false);
                    setAssistantBooking(null);
                    setAssistantCandidates([]);
                    setSelectedAssistantId(null);
                }}
            >
                <div className="space-y-4">
                    <div className="text-slate-600">
                        Booking #{assistantBooking?.id} - {assistantBooking?.serviceName}
                    </div>
                    <Select
                        className="w-full"
                        placeholder="Chon tho phu"
                        loading={assistantLoading}
                        value={selectedAssistantId}
                        onChange={setSelectedAssistantId}
                        options={assistantCandidates.map((candidate) => ({
                            value: candidate.id,
                            label: `${candidate.fullName} - ${candidate.categoryNames?.join(', ') || 'Khong co category'}`
                        }))}
                    />
                    {!assistantLoading && !assistantCandidates.length && (
                        <Text type="secondary">Khong co tho phu ranh trong khung gio nay.</Text>
                    )}
                </div>
            </Modal>

            <Tabs
                className="mb-4"
                items={[
                    {
                        key: 'ranking',
                        label: 'Xếp hạng kỹ thuật viên',
                        children: (
                            <Card bordered={false}>
                                <List
                                    dataSource={leaderboard}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <Space className="w-full justify-between">
                                                <Space>
                                                    <Trophy size={16} className="text-amber-500" />
                                                    <Text strong>#{item.rank} {item.technicianName}</Text>
                                                </Space>
                                                <Space>
                                                    <Tag color="blue">Rating: {item.averageRating}</Tag>
                                                    <Tag color="green">Đơn xong: {item.completedJobs}</Tag>
                                                    <Tag>{item.totalReviews} review</Tag>
                                                </Space>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )
                    },
                    {
                        key: 'tickets',
                        label: 'Ticketing nâng cao',
                        children: (
                            <Card bordered={false}>
                                <Form form={ticketForm} layout="vertical" onFinish={createTicket}>
                                    <Row gutter={12}>
                                        <Col xs={24} md={6}><Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input /></Form.Item></Col>
                                        <Col xs={24} md={6}><Form.Item name="customerId" label="ID khách hàng" rules={[{ required: true, message: 'Nhập customerId' }]}><Input /></Form.Item></Col>
                                        <Col xs={24} md={4}><Form.Item name="bookingId" label="ID đơn (tuỳ chọn)"><Input /></Form.Item></Col>
                                        <Col xs={24} md={4}><Form.Item name="category" label="Loại ticket" rules={[{ required: true, message: 'Chọn loại' }]}><Select options={[{ value: 'SERVICE_ISSUE', label: 'Service' }, { value: 'PAYMENT_ISSUE', label: 'Payment' }, { value: 'SCHEDULE_CHANGE', label: 'Schedule' }, { value: 'CUSTOMER_COMPLAINT', label: 'Complaint' }, { value: 'TECHNICAL_SUPPORT', label: 'Technical' }]} /></Form.Item></Col>
                                        <Col xs={24} md={4}><Form.Item name="priority" label="Ưu tiên" rules={[{ required: true, message: 'Chọn ưu tiên' }]}><Select options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' }]} /></Form.Item></Col>
                                    </Row>
                                    <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả' }]}><Input.TextArea rows={2} /></Form.Item>
                                    <Button type="primary" htmlType="submit">Tạo ticket</Button>
                                </Form>
                                <div className="mt-4">
                                    <List
                                        dataSource={tickets}
                                        renderItem={(item) => (
                                            <List.Item
                                                actions={[
                                                    <Button key="progress" size="small" onClick={() => updateTicketStatus(item.id, 'IN_PROGRESS')}>In Progress</Button>,
                                                    <Button key="resolve" size="small" type="primary" onClick={() => updateTicketStatus(item.id, 'RESOLVED')}>Resolve</Button>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    title={`#${item.id} - ${item.title}`}
                                                    description={`${item.customerName} | ${item.priority} | ${item.status}`}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            </Card>
                        )
                    },
                    {
                        key: 'alerts',
                        label: 'Cảnh báo thông minh',
                        children: (
                            <Card bordered={false}>
                                <List
                                    dataSource={alerts}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <Space>
                                                <AlertTriangle size={16} className="text-amber-500" />
                                                <Tag color={item.severity === 'HIGH' ? 'red' : item.severity === 'MEDIUM' ? 'orange' : 'green'}>{item.severity}</Tag>
                                                <Text>{item.message}</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                                <div className="mt-4">
                                    <Text strong>Báo cáo tự động</Text>
                                    <div className="text-slate-600 mt-1">Khuyến nghị: {autoReport.recommendation || 'Chưa có dữ liệu'}</div>
                                </div>
                            </Card>
                        )
                    },
                    {
                        key: 'interactions',
                        label: 'Lịch sử tương tác',
                        children: (
                            <Card bordered={false}>
                                <List
                                    dataSource={interactions}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <Space className="w-full justify-between">
                                                <div>
                                                    <Text strong>{item.interactionType}</Text>
                                                    <div className="text-slate-600">{item.detail}</div>
                                                </div>
                                                <Text type="secondary">{dayjs(item.createdAt).format('DD/MM HH:mm')}</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )
                    }
                ]}
            />

            <Card bordered={false} className="shadow-sm">
                <Title level={4}>Lịch sử đánh giá</Title>
                <List
                    dataSource={reviews}
                    locale={{ emptyText: 'Chưa có đánh giá nào' }}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Star size={18} className="text-yellow-500 mt-1" />}
                                title={(
                                    <div className="flex justify-between items-center">
                                        <Space>
                                            <Text strong>{item.customerName}</Text>
                                            <Rate disabled value={item.rating} />
                                        </Space>
                                        <Text type="secondary">{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                    </div>
                                )}
                                description={(
                                    <div>
                                        <div>Dịch vụ: {item.serviceName}</div>
                                        <div>{item.comment || 'Không có nhận xét'}</div>
                                    </div>
                                )}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Card bordered={false} className="shadow-sm mt-4">
                <Title level={4}>Chat real-time theo đơn</Title>
                <Space className="mb-3">
                    <Select
                        style={{ width: 240 }}
                        placeholder="Chọn booking để chat"
                        value={chatBookingId}
                        onChange={openChat}
                        options={bookings.map(item => ({ value: item.id, label: `#${item.id} - ${item.customerName}` }))}
                    />
                </Space>
                <List
                    dataSource={chatMessages}
                    locale={{ emptyText: 'Chưa có tin nhắn' }}
                    renderItem={(item) => (
                        <List.Item>
                            <Space className="w-full justify-between">
                                <div>
                                    <Text strong>{item.senderName}</Text>
                                    <div>{item.content}</div>
                                </div>
                                <div className="text-right">
                                    <Text type="secondary">{dayjs(item.createdAt).format('DD/MM HH:mm')}</Text>
                                    <div className="text-xs text-slate-500">Xóa lúc {dayjs(item.expiresAt).format('DD/MM HH:mm')}</div>
                                </div>
                            </Space>
                        </List.Item>
                    )}
                />
                <Space className="w-full mt-3">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Nhập tin nhắn..." />
                    <Button type="primary" onClick={sendChat}>Gửi</Button>
                </Space>
            </Card>

            <Modal
                title="Từ chối công việc"
                open={rejectionModalVisible}
                onOk={() => handleTechnicianResponse(selectedBookingId, false, rejectionReason)}
                onCancel={() => setRejectionModalVisible(false)}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
            >
                <div className="space-y-4">
                    <Text>Vui lòng cho biết lý do từ chối công việc này.</Text>
                    <textarea
                        className="w-full border rounded-md p-2"
                        rows={4}
                        placeholder="Nhập lý do..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>
            </Modal>

            <Modal
                title="Hoàn tất hồ sơ kỹ thuật viên"
                open={profileModalOpen}
                onCancel={() => {}}
                footer={null}
                closable={false}
                maskClosable={false}
            >
                <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                    Cấu hình hồ sơ để hệ thống matching tự động phân công theo chuyên mục và lịch làm việc.
                </div>
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={submitTechnicianProfile}
                >
                    <Form.Item name="specialty" label="Thợ làm gì" rules={[{ required: true, message: 'Vui lòng nhập chuyên môn' }]}>
                        <Input placeholder="Ví dụ: Thợ điện máy" />
                    </Form.Item>
                    <Form.Item name="categoryIds" label="Chuyên mục nhận việc" rules={[{ required: true, message: 'Vui lòng chọn chuyên mục' }]}>
                        <Select mode="multiple" placeholder="Chọn chuyên mục phù hợp">
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>{category.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="experienceYears" label="Kinh nghiệm (năm)" rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm' }]}>
                        <InputNumber className="w-full" min={0} max={60} />
                    </Form.Item>
                    <Form.Item name="workDescription" label="Mô tả công việc chi tiết" rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc' }]}>
                        <Input.TextArea rows={4} placeholder="Ví dụ: rửa điều hòa, bơm khí điều hòa..." />
                    </Form.Item>
                    <Form.Item name="citizenId" label="Số CCCD" rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
                        <Input placeholder="Nhập số căn cước công dân" />
                    </Form.Item>
                    <Form.Item name="technicianType" label="Loại thợ" rules={[{ required: true, message: 'Vui lòng chọn loại thợ' }]}>
                        <Select>
                            <Option value="MAIN">Thợ chính</Option>
                            <Option value="ASSISTANT">Thợ phụ</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="baseLocation" label="Khu vực làm việc chính" rules={[{ required: true, message: 'Vui lòng nhập khu vực làm việc' }]}>
                        <Input placeholder="Ví dụ: Cầu Giấy, Hà Nội" />
                    </Form.Item>
                    <Space className="w-full" size={12}>
                        <Form.Item name="availableFrom" label="Bắt đầu ca" className="flex-1" rules={[{ required: true, message: 'Nhập giờ bắt đầu' }]}>
                            <Input placeholder="08:00" />
                        </Form.Item>
                        <Form.Item name="availableTo" label="Kết thúc ca" className="flex-1" rules={[{ required: true, message: 'Nhập giờ kết thúc' }]}>
                            <Input placeholder="18:00" />
                        </Form.Item>
                    </Space>
                    <Form.Item name="availableForAutoAssign" label="Nhận phân công tự động" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    {selectedTechnicianType === 'ASSISTANT' && (
                        <Form.Item
                            name="supervisingTechnicianId"
                            label="Tho chinh phu trach"
                            rules={[{ required: true, message: 'Vui long chon tho chinh phu trach' }]}
                        >
                            <Select
                                placeholder="Chon tho chinh"
                                options={mainTechnicians.map((tech) => ({
                                    value: tech.id,
                                    label: `${tech.fullName} - ${tech.categoryNames?.join(', ') || 'Khong co category'}`
                                }))}
                            />
                        </Form.Item>
                    )}
                    {selectedTechnicianType === 'ASSISTANT' && (
                        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                            Tho phu van co the tu nhan don dung category cua minh. Sau 1 thang, he thong se tu dong nang cap len tho chinh.
                        </div>
                    )}
                    <Button type="primary" htmlType="submit" className="w-full" loading={savingProfile}>
                        Lưu hồ sơ kỹ thuật viên
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default TechnicianDashboard;



