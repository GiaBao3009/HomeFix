import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select } from 'antd';
import { CheckCircle, Clock, MapPin, User, Wrench, RefreshCw } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const TechnicianDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/bookings/my-bookings');
            setBookings(response.data);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 400) {
                 message.error('Phiên đăng nhập không hợp lệ hoặc tài khoản không tồn tại. Vui lòng đăng nhập lại.');
                 // Optional: redirect to login
                 // window.location.href = '/login'; 
            } else {
                 message.error('Không thể tải danh sách công việc');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleTechnicianResponse = async (bookingId, accepted, reason = '') => {
        try {
            await api.post(`/bookings/${bookingId}/technician-response?accepted=${accepted}&reason=${reason}`);
            message.success(accepted ? 'Đã nhận việc thành công' : 'Đã gửi yêu cầu từ chối');
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
                            >
                                Nhận việc
                            </Button>
                            <Button 
                                danger
                                size="small"
                                onClick={() => openRejectionModal(record.id)}
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
                    <Text type="secondary">Quản lý và cập nhật trạng thái các đơn hàng được giao</Text>
                </div>
                <Button icon={<RefreshCw size={16} />} onClick={fetchBookings}>
                    Làm mới
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table 
                    columns={columns} 
                    dataSource={bookings} 
                    rowKey="id"
                    loading={loading}
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
                    <Text>Vui lòng cho biết lý do từ chối công việc này. Admin sẽ xem xét yêu cầu của bạn.</Text>
                    <textarea
                        className="w-full border rounded-md p-2"
                        rows={4}
                        placeholder="Nhập lý do..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default TechnicianDashboard;
