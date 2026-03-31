import { useState, useEffect, useRef } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Alert, Form, Input, InputNumber, Switch, Row, Col, Statistic, Rate, List, Tabs, Empty, Badge } from 'antd';
import { Clock, MapPin, User, Wrench, RefreshCw, Star, Trophy, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
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
    const [categories, setCategories] = useState([]);
    const [mainTechnicians, setMainTechnicians] = useState([]);
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
        if (!silent) setLoading(true);
        const [bookingsRes, openBookingsRes, dashboardRes, reviewsRes, leaderboardRes, analyticsRes] = await Promise.allSettled([
            api.get('/users/technician/history'),
            api.get('/bookings/available'),
            api.get('/users/technician/dashboard'),
            api.get('/users/technician/reviews'),
            api.get('/technician/leaderboard'),
            api.get('/technician/analytics')
        ]);
        try {
            let bookingData = [];
            if (bookingsRes.status === 'fulfilled') {
                bookingData = bookingsRes.value.data || [];
            } else {
                const backendMessage = bookingsRes.reason?.response?.data?.message || '';
                if (!backendMessage.includes('hoàn tất hồ sơ trước khi nhận việc') && !silent) {
                    message.error('Không thể tải lịch sử công việc');
                }
            }
            const assignedIds = new Set(bookingData.filter(i => i.status === 'ASSIGNED').map(i => i.id));
            if (assignedIdsRef.current.size > 0) {
                assignedIds.forEach((id) => {
                    if (!assignedIdsRef.current.has(id)) message.info(`Bạn vừa nhận đơn mới #${id}`);
                });
            }
            assignedIdsRef.current = assignedIds;
            setBookings(bookingData);
            setOpenBookings(openBookingsRes.status === 'fulfilled' ? (openBookingsRes.value.data || []) : []);
            setDashboard(dashboardRes.status === 'fulfilled' ? (dashboardRes.value.data || {}) : {});
            setReviews(reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data || []) : []);
            setLeaderboard(leaderboardRes.status === 'fulfilled' ? (leaderboardRes.value.data || []) : []);
            setAdvancedAnalytics(analyticsRes.status === 'fulfilled' ? (analyticsRes.value.data || {}) : {});
        } catch (error) {
            console.error(error);
            if (!silent) message.error('Không thể tải dữ liệu');
        } finally {
            if (!silent) setLoading(false);
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
            setMainTechnicians((techniciansRes.data || []).filter((t) => t.technicianType === 'MAIN' && t.id !== profile.id));
            setTechnicianProfile(profile);
            if (!profile.technicianProfileCompleted) setProfileModalOpen(true);
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
            message.success(accepted ? 'Đã nhận việc thành công' : 'Đã từ chối, hệ thống sẽ điều phối lại');
            setRejectionModalVisible(false);
            setRejectionReason('');
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || error.message);
        }
    };

    const handleClaimBooking = async (bookingId) => {
        try {
            await api.post(`/bookings/${bookingId}/claim`);
            message.success('Đã nhận đơn thành công');
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Nhận đơn thất bại');
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.patch(`/bookings/${bookingId}/status?status=${newStatus}`);
            message.success('Cập nhật trạng thái thành công');
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
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
            message.error(error.response?.data?.message || 'Không thể tải danh sách thợ phụ');
        } finally {
            setAssistantLoading(false);
        }
    };

    const handleAddAssistant = async () => {
        if (!assistantBooking || !selectedAssistantId) { message.warning('Vui lòng chọn thợ phụ'); return; }
        try {
            await api.post(`/bookings/${assistantBooking.id}/assistants?assistantId=${selectedAssistantId}`);
            message.success('Đã thêm thợ phụ');
            setAssistantModalVisible(false);
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thêm thợ phụ thất bại');
        }
    };

    const submitTechnicianProfile = async (values) => {
        setSavingProfile(true);
        try {
            const normalizedTime = (v) => (!v ? null : /^\d{2}:\d{2}$/.test(v) ? `${v}:00` : v);
            const payload = {
                ...values,
                baseLocation: values.baseLocation?.trim(),
                availableFrom: normalizedTime(values.availableFrom),
                availableTo: normalizedTime(values.availableTo),
                supervisingTechnicianId: values.technicianType === 'ASSISTANT' ? Number(values.supervisingTechnicianId) : null,
                categoryIds: (Array.isArray(values.categoryIds) ? values.categoryIds : [values.categoryIds])
                    .map(Number).filter((id) => Number.isFinite(id) && id > 0)
            };
            if (!payload.categoryIds.length) { message.error('Vui lòng chọn ít nhất 1 chuyên mục'); return; }
            if (values.technicianType === 'ASSISTANT' && !payload.supervisingTechnicianId) { message.error('Vui lòng chọn thợ chính phụ trách'); return; }
            await api.put('/users/technician/profile', payload);
            message.success('Cập nhật hồ sơ thành công');
            setProfileModalOpen(false);
            await refreshUserProfile();
            fetchTechnicianProfile();
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSavingProfile(false);
        }
    };

    const isBlockedByProfile = !technicianProfile?.technicianProfileCompleted;
    const isMainPending = technicianProfile?.technicianType === 'MAIN' && technicianProfile?.technicianApprovalStatus === 'PENDING';
    const isMainRejected = technicianProfile?.technicianType === 'MAIN' && technicianProfile?.technicianApprovalStatus === 'REJECTED';
    const isAssistantMissingSupervisor = technicianProfile?.technicianType === 'ASSISTANT' && !technicianProfile?.supervisingTechnicianId;
    const cannotWork = isBlockedByProfile || isMainPending || isMainRejected || isAssistantMissingSupervisor;

    const activeStatuses = ['ASSIGNED', 'IN_PROGRESS', 'ARRIVED', 'WORKING'];
    const activeBookings = bookings.filter(b => activeStatuses.includes(b.status));

    const renderStatusTag = (status) => {
        const map = {
            PENDING: ['orange', 'Chờ xử lý'], CONFIRMED: ['gold', 'Đang mở'], ASSIGNED: ['blue', 'Chờ xác nhận'],
            ARRIVED: ['geekblue', 'Đã đến nơi'], WORKING: ['purple', 'Đang làm việc'],
            IN_PROGRESS: ['processing', 'Đang thực hiện'], COMPLETED: ['success', 'Hoàn thành'],
            CANCELLED: ['error', 'Đã hủy'], DECLINED: ['error', 'Đã từ chối']
        };
        const [color, text] = map[status] || ['default', status];
        return <Tag color={color}>{text}</Tag>;
    };

    const renderActions = (record) => {
        const isOwner = record.technicianId === user?.id;
        const isAssistant = (record.assistantTechnicianIds || []).includes(user?.id);
        const canManage = isOwner && technicianProfile?.technicianType === 'MAIN';

        return (
            <Space wrap size={4}>
                {record.status === 'ASSIGNED' && isOwner && (
                    <>
                        <Button type="primary" size="small" onClick={() => handleTechnicianResponse(record.id, true)} disabled={cannotWork}>Nhận việc</Button>
                        <Button danger size="small" onClick={() => { setSelectedBookingId(record.id); setRejectionModalVisible(true); }} disabled={cannotWork}>Từ chối</Button>
                    </>
                )}
                {record.status === 'ASSIGNED' && isAssistant && !isOwner && (
                    <Button type="primary" size="small" onClick={() => handleStatusUpdate(record.id, 'IN_PROGRESS')} disabled={cannotWork}>Bắt đầu hỗ trợ</Button>
                )}
                {record.status === 'IN_PROGRESS' && (isOwner || isAssistant) && (
                    <Button type="primary" size="small" onClick={() => handleStatusUpdate(record.id, 'ARRIVED')} disabled={cannotWork}>Đã đến nơi</Button>
                )}
                {record.status === 'ARRIVED' && (isOwner || isAssistant) && (
                    <Button size="small" className="bg-purple-600 text-white border-purple-600 hover:bg-purple-700" onClick={() => handleStatusUpdate(record.id, 'WORKING')} disabled={cannotWork}>Bắt đầu làm</Button>
                )}
                {record.status === 'WORKING' && (isOwner || isAssistant) && (
                    <Button size="small" className="bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusUpdate(record.id, 'COMPLETED')} disabled={cannotWork}>Hoàn thành</Button>
                )}
                {canManage && ['ASSIGNED', 'ARRIVED', 'WORKING', 'IN_PROGRESS'].includes(record.status) && (
                    <Button size="small" onClick={() => openAssistantModal(record)} disabled={cannotWork}>+ Thợ phụ</Button>
                )}
            </Space>
        );
    };

    const activeColumns = [
        {
            title: 'Đơn hàng', key: 'order', width: 200,
            render: (_, r) => (
                <div>
                    <Text strong className="text-blue-600">#{r.id}</Text>
                    <div className="flex items-center gap-1 mt-1"><Wrench size={13} className="text-slate-400" /><span className="text-sm">{r.serviceName}</span></div>
                </div>
            )
        },
        {
            title: 'Khách hàng', dataIndex: 'customerName', key: 'customer', width: 140,
            render: (t) => <div className="flex items-center gap-1.5"><User size={14} className="text-blue-400" /><span>{t}</span></div>
        },
        {
            title: 'Thời gian', key: 'time', width: 160,
            render: (_, r) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-sm"><Clock size={13} className="text-slate-400" />{dayjs(r.bookingTime).format('HH:mm DD/MM')}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{r.address}</div>
                </div>
            )
        },
        {
            title: 'Đội', key: 'team', width: 150,
            render: (_, r) => (
                <div className="space-y-1">
                    <div className="text-sm">Chính: <Text strong>{r.technicianName || '—'}</Text></div>
                    <div className="flex flex-wrap gap-1">
                        {(r.assistantTechnicianNames || []).map((n) => <Tag key={n} className="!text-xs">{n}</Tag>)}
                    </div>
                </div>
            )
        },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, render: renderStatusTag },
        { title: 'Hành động', key: 'action', width: 200, render: (_, r) => renderActions(r) }
    ];

    const openColumns = [
        {
            title: 'Đơn hàng', key: 'order',
            render: (_, r) => (
                <div>
                    <Text strong>#{r.id}</Text>
                    <div className="text-sm text-slate-500">{r.serviceName}</div>
                </div>
            )
        },
        {
            title: 'Thông tin', key: 'info',
            render: (_, r) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-sm"><Clock size={13} className="text-slate-400" />{dayjs(r.bookingTime).format('HH:mm DD/MM/YYYY')}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{r.address}</div>
                </div>
            )
        },
        {
            title: 'Trạng thái', key: 'status',
            render: (_, r) => (
                <Space direction="vertical" size={2}>
                    {renderStatusTag(r.status)}
                    <Tag color={r.dispatchEligible ? 'green' : 'orange'} className="!text-xs">
                        {r.dispatchEligible ? 'Có thể nhận' : 'Chưa nhận được'}
                    </Tag>
                </Space>
            )
        },
        {
            title: '', key: 'action', width: 100,
            render: (_, r) => (
                <Button type="primary" size="small" onClick={() => handleClaimBooking(r.id)} disabled={cannotWork || !r.dispatchEligible}>
                    Nhận đơn
                </Button>
            )
        }
    ];

    const historyColumns = [
        { title: '#', dataIndex: 'id', key: 'id', width: 70, render: (t) => <Text strong>#{t}</Text> },
        { title: 'Dịch vụ', dataIndex: 'serviceName', key: 'service' },
        { title: 'Khách hàng', dataIndex: 'customerName', key: 'customer' },
        { title: 'Ngày', dataIndex: 'bookingTime', key: 'time', render: (t) => dayjs(t).format('DD/MM/YYYY HH:mm') },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: renderStatusTag }
    ];

    const alertContent = (
        <>
            {isBlockedByProfile && <Alert type="warning" className="mb-3" message="Bạn cần hoàn tất hồ sơ kỹ thuật viên trước khi nhận việc." action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Hoàn tất hồ sơ</Button>} />}
            {isMainPending && <Alert type="info" className="mb-3" message="Thợ chính đang chờ admin duyệt. Bạn chưa thể nhận việc." />}
            {isMainRejected && <Alert type="error" className="mb-3" message="Hồ sơ thợ chính chưa được duyệt. Vui lòng cập nhật lại." action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Cập nhật hồ sơ</Button>} />}
            {isAssistantMissingSupervisor && <Alert type="warning" className="mb-3" message="Thợ phụ cần được gán với một thợ chính trước khi nhận việc." action={<Button size="small" onClick={() => setProfileModalOpen(true)}>Cập nhật hồ sơ</Button>} />}
            {technicianProfile?.technicianType === 'ASSISTANT' && technicianProfile?.supervisingTechnicianName && (
                <Alert type="info" className="mb-3" message={`Bạn đang là thợ phụ của ${technicianProfile.supervisingTechnicianName}.${technicianProfile.assistantPromoteAt ? ` Sẽ lên thợ chính vào ${dayjs(technicianProfile.assistantPromoteAt).format('DD/MM/YYYY')}.` : ''}`} />
            )}
        </>
    );

    const statCards = [
        { icon: <Briefcase size={20} className="text-blue-500" />, title: 'Đơn đang làm', value: activeBookings.length, color: 'text-blue-600' },
        { icon: <CheckCircle size={20} className="text-emerald-500" />, title: 'Hoàn thành', value: dashboard.completedJobs || 0, color: 'text-emerald-600' },
        { icon: <Star size={20} className="text-amber-500" />, title: 'Đánh giá', value: `${(dashboard.averageRating || 0).toFixed(1)}/5`, suffix: <span className="text-xs text-slate-500 ml-1">({dashboard.totalReviews || 0})</span>, color: 'text-amber-600' },
        { icon: <Wallet size={20} className="text-violet-500" />, title: 'Số dư ví', value: `${Number(dashboard.walletBalance || 0).toLocaleString('vi-VN')}đ`, color: 'text-violet-600' }
    ];

    const tabItems = [
        {
            key: 'active',
            label: <Badge count={activeBookings.length} size="small" offset={[8, 0]}><span className="font-semibold">Việc đang làm</span></Badge>,
            children: (
                <Table columns={activeColumns} dataSource={activeBookings} rowKey="id" loading={loading || profileLoading}
                    pagination={false} scroll={{ x: 900 }}
                    locale={{ emptyText: <Empty description="Chưa có đơn nào đang thực hiện" /> }} />
            )
        },
        {
            key: 'open',
            label: <Badge count={openBookings.length} size="small" offset={[8, 0]}><span className="font-semibold">Đơn mở</span></Badge>,
            children: (
                <Table columns={openColumns} dataSource={openBookings} rowKey="id" loading={loading || profileLoading}
                    pagination={{ pageSize: 5, size: 'small' }}
                    locale={{ emptyText: <Empty description="Chưa có đơn mở phù hợp" /> }} />
            )
        },
        {
            key: 'history',
            label: <span className="font-semibold">Lịch sử</span>,
            children: (
                <Table columns={historyColumns} dataSource={bookings} rowKey="id" loading={loading || profileLoading}
                    pagination={{ pageSize: 8, size: 'small' }} />
            )
        },
        {
            key: 'reviews',
            label: <span className="font-semibold">Đánh giá ({reviews.length})</span>,
            children: reviews.length > 0 ? (
                <List dataSource={reviews} renderItem={(item) => (
                    <List.Item>
                        <div className="w-full">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><User size={14} className="text-blue-600" /></div>
                                    <div>
                                        <Text strong>{item.customerName}</Text>
                                        <div className="text-xs text-slate-500">{item.serviceName}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Rate disabled value={item.rating} className="!text-sm" />
                                    <div className="text-xs text-slate-400">{dayjs(item.createdAt).format('DD/MM/YYYY')}</div>
                                </div>
                            </div>
                            {item.comment && <div className="mt-2 text-sm text-slate-600 pl-10">{item.comment}</div>}
                        </div>
                    </List.Item>
                )} />
            ) : <Empty description="Chưa có đánh giá nào" />
        },
        {
            key: 'leaderboard',
            label: <span className="font-semibold">Xếp hạng</span>,
            children: leaderboard.length > 0 ? (
                <List dataSource={leaderboard} renderItem={(item, idx) => (
                    <List.Item>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.rank || idx + 1}
                                </div>
                                <Text strong className={item.technicianName === user?.fullName ? '!text-blue-600' : ''}>{item.technicianName}</Text>
                            </div>
                            <Space size={4}>
                                <Tag color="blue">{item.averageRating} ★</Tag>
                                <Tag color="green">{item.completedJobs} đơn</Tag>
                            </Space>
                        </div>
                    </List.Item>
                )} />
            ) : <Empty description="Chưa có dữ liệu xếp hạng" />
        }
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <Title level={3} className="!mb-0">Bảng công việc</Title>
                    <Text type="secondary" className="text-sm">Hệ thống tự động điều phối theo chuyên mục</Text>
                </div>
                <Button icon={<RefreshCw size={14} />} onClick={() => { fetchTechnicianProfile(); fetchBookings(); }} loading={loading}>
                    Làm mới
                </Button>
            </div>

            {/* Alerts */}
            {alertContent}

            {/* Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((s, i) => (
                    <Card key={i} bordered={false} className="!rounded-xl" bodyStyle={{ padding: '16px 20px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{s.icon}</div>
                            <div className="min-w-0">
                                <div className="text-xs text-slate-500 truncate">{s.title}</div>
                                <div className={`text-lg font-bold ${s.color} truncate`}>{s.value}{s.suffix}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Analytics Row */}
            {(advancedAnalytics.completionRate != null) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <div><div className="text-xs text-emerald-700">Tỉ lệ hoàn thành</div><div className="font-bold text-emerald-700">{advancedAnalytics.completionRate || 0}%</div></div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                        <Briefcase size={16} className="text-blue-600" />
                        <div><div className="text-xs text-blue-700">Đơn chờ nhận</div><div className="font-bold text-blue-700">{dashboard.pendingJobs || 0}</div></div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-50 border border-orange-100">
                        <AlertTriangle size={16} className="text-orange-600" />
                        <div><div className="text-xs text-orange-700">Đơn hủy</div><div className="font-bold text-orange-700">{advancedAnalytics.cancelled || 0}</div></div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-100">
                        <AlertTriangle size={16} className="text-red-600" />
                        <div><div className="text-xs text-red-700">Đơn từ chối</div><div className="font-bold text-red-700">{advancedAnalytics.declined || 0}</div></div>
                    </div>
                </div>
            )}

            {/* Main Tabs */}
            <Card bordered={false} className="!rounded-xl !shadow-sm">
                <Tabs defaultActiveKey="active" items={tabItems} size="middle" />
            </Card>

            {/* Rejection Modal */}
            <Modal title="Từ chối công việc" open={rejectionModalVisible}
                onOk={() => handleTechnicianResponse(selectedBookingId, false, rejectionReason)}
                onCancel={() => setRejectionModalVisible(false)} okText="Xác nhận từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
                <div className="space-y-3">
                    <Text>Vui lòng cho biết lý do từ chối công việc này:</Text>
                    <Input.TextArea rows={4} placeholder="Nhập lý do..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                </div>
            </Modal>

            {/* Assistant Modal */}
            <Modal title="Thêm thợ phụ" open={assistantModalVisible} onOk={handleAddAssistant} okText="Thêm" cancelText="Đóng"
                confirmLoading={assistantLoading} onCancel={() => { setAssistantModalVisible(false); setAssistantBooking(null); setAssistantCandidates([]); setSelectedAssistantId(null); }}>
                <div className="space-y-3">
                    <div className="text-sm text-slate-500">Đơn #{assistantBooking?.id} — {assistantBooking?.serviceName}</div>
                    <Select className="w-full" placeholder="Chọn thợ phụ" loading={assistantLoading} value={selectedAssistantId} onChange={setSelectedAssistantId}
                        options={assistantCandidates.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.categoryNames?.join(', ') || 'Không có chuyên mục'}` }))} />
                    {!assistantLoading && !assistantCandidates.length && <Text type="secondary">Không có thợ phụ rảnh trong khung giờ này.</Text>}
                </div>
            </Modal>

            {/* Profile Modal */}
            <Modal title="Hoàn tất hồ sơ kỹ thuật viên" open={profileModalOpen} onCancel={() => {}} footer={null} closable={false} maskClosable={false} width={560}>
                <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                    Cấu hình hồ sơ để hệ thống matching tự động phân công theo chuyên mục và lịch làm việc.
                </div>
                <Form form={profileForm} layout="vertical" onFinish={submitTechnicianProfile} size="middle">
                    <Form.Item name="specialty" label="Chuyên môn" rules={[{ required: true, message: 'Nhập chuyên môn' }]}>
                        <Input placeholder="VD: Thợ điện máy" />
                    </Form.Item>
                    <Form.Item name="categoryIds" label="Chuyên mục nhận việc" rules={[{ required: true, message: 'Chọn chuyên mục' }]}>
                        <Select mode="multiple" placeholder="Chọn chuyên mục phù hợp">
                            {categories.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={12}>
                        <Col xs={12}><Form.Item name="experienceYears" label="Kinh nghiệm (năm)" rules={[{ required: true }]}><InputNumber className="w-full" min={0} max={60} /></Form.Item></Col>
                        <Col xs={12}><Form.Item name="citizenId" label="Số CCCD" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="workDescription" label="Mô tả công việc" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="VD: Rửa điều hòa, bơm khí..." />
                    </Form.Item>
                    <Form.Item name="technicianType" label="Loại thợ" rules={[{ required: true }]}>
                        <Select><Option value="MAIN">Thợ chính</Option><Option value="ASSISTANT">Thợ phụ</Option></Select>
                    </Form.Item>
                    <Form.Item name="baseLocation" label="Khu vực làm việc" rules={[{ required: true }]}>
                        <Input placeholder="VD: Cầu Giấy, Hà Nội" />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col xs={12}><Form.Item name="availableFrom" label="Bắt đầu ca" rules={[{ required: true }]}><Input placeholder="08:00" /></Form.Item></Col>
                        <Col xs={12}><Form.Item name="availableTo" label="Kết thúc ca" rules={[{ required: true }]}><Input placeholder="18:00" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="availableForAutoAssign" label="Nhận phân công tự động" valuePropName="checked"><Switch /></Form.Item>
                    {selectedTechnicianType === 'ASSISTANT' && (
                        <>
                            <Form.Item name="supervisingTechnicianId" label="Thợ chính phụ trách" rules={[{ required: true, message: 'Chọn thợ chính' }]}>
                                <Select placeholder="Chọn thợ chính" options={mainTechnicians.map((t) => ({ value: t.id, label: `${t.fullName} — ${t.categoryNames?.join(', ') || ''}` }))} />
                            </Form.Item>
                            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                                Thợ phụ vẫn có thể tự nhận đơn đúng chuyên mục. Sau 1 tháng, hệ thống sẽ tự động nâng cấp lên thợ chính.
                            </div>
                        </>
                    )}
                    <Button type="primary" htmlType="submit" className="w-full" loading={savingProfile}>Lưu hồ sơ kỹ thuật viên</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default TechnicianDashboard;
