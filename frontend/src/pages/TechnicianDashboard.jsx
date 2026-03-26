import { useState, useEffect, useRef } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Alert, Form, Input, InputNumber, Switch, Row, Col, Statistic, Rate, List } from 'antd';
import { Clock, MapPin, User, Wrench, RefreshCw, Star } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const TechnicianDashboard = () => {
    const { refreshUserProfile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [dashboard, setDashboard] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const [profileForm] = Form.useForm();
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const assignedIdsRef = useRef(new Set());

    const fetchBookings = async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        const [bookingsRes, dashboardRes, reviewsRes] = await Promise.allSettled([
            api.get('/users/technician/history'),
            api.get('/users/technician/dashboard'),
            api.get('/users/technician/reviews')
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
            setDashboard(dashboardRes.status === 'fulfilled' ? (dashboardRes.value.data || {}) : {});
            setReviews(reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data || []) : []);
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
            const [profileRes, categoriesRes] = await Promise.all([
                api.get('/users/technician/profile'),
                api.get('/categories')
            ]);
            const profile = profileRes.data || {};
            setCategories(categoriesRes.data || []);
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
                categoryIds: (Array.isArray(values.categoryIds) ? values.categoryIds : [values.categoryIds])
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            };
            if (!payload.categoryIds.length) {
                message.error('Vui lòng chọn ít nhất 1 chuyên mục kỹ thuật');
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
    const cannotWork = isBlockedByProfile || isMainPending || isMainRejected;

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
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(record.id, 'COMPLETED')}
                            className="bg-green-600"
                            disabled={cannotWork}
                        >
                            Hoàn thành
                        </Button>
                    )}
                </Space>
            ),
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

            <Row gutter={16} className="mb-4">
                <Col xs={24} md={8}>
                    <Card bordered={false}>
                        <Statistic title="Đơn chờ nhận" value={dashboard.pendingJobs || 0} />
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

            <Card bordered={false} className="shadow-sm mb-4">
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading || profileLoading}
                />
            </Card>

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
                    <Button type="primary" htmlType="submit" className="w-full" loading={savingProfile}>
                        Lưu hồ sơ kỹ thuật viên
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default TechnicianDashboard;
