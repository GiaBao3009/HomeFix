import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Avatar, Tooltip } from 'antd';
import { User, Calendar, MapPin, Wrench, RefreshCw, UserCheck } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import AdminCharts from '../components/admin/AdminCharts';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminDispatch = () => {
    const [bookings, setBookings] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Assign Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    // Review Decline Modal State
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [bookingToReview, setBookingToReview] = useState(null);

    const handleReviewDecline = (booking) => {
        setBookingToReview(booking);
        setReviewModalVisible(true);
    };

    const submitReview = async (approve) => {
        try {
            await api.post(`/bookings/${bookingToReview.id}/review-decline?approve=${approve}`);
            message.success(approve ? 'Đã chấp nhận từ chối. Bạn có thể phân công người khác.' : 'Đã bác bỏ từ chối. Kỹ thuật viên phải thực hiện công việc.');
            setReviewModalVisible(false);
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('Thao tác thất bại');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, techniciansRes] = await Promise.all([
                api.get('/bookings/my-bookings'), // Admin gets all bookings via this endpoint logic
                api.get('/users/technicians')
            ]);
            // Filter only pending or assigned bookings for dispatch view if desired, 
            // but displaying all allows re-assignment.
            // Let's sort by date desc
            const sortedBookings = bookingsRes.data.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));
            setBookings(sortedBookings);
            setTechnicians(techniciansRes.data);
        } catch (error) {
            console.error(error);
            message.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleAssign = (booking) => {
        setSelectedBooking(booking);
        setSelectedTechnician(booking.technicianId); // Pre-select if already assigned
        setIsModalVisible(true);
    };

    const confirmAssign = async () => {
        if (!selectedTechnician) {
            message.warning('Vui lòng chọn kỹ thuật viên');
            return;
        }

        try {
            await api.patch(`/bookings/${selectedBooking.id}/assign?technicianId=${selectedTechnician}`);
            message.success('Phân công thành công');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('Phân công thất bại');
        }
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text) => <Text strong>#{text}</Text>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text) => (
                <div className="flex gap-2 items-center">
                    <Avatar size="small" icon={<User size={14} />} className="bg-blue-100 text-blue-600" />
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: 'Dịch vụ',
            dataIndex: 'serviceName',
            key: 'serviceName',
            render: (text) => (
                <Tag color="cyan">{text}</Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                let color = 'default';
                let text = status;
                switch (status) {
                    case 'PENDING': color = 'orange'; text = 'Chờ xử lý'; break;
                    case 'ASSIGNED': color = 'blue'; text = 'Chờ xác nhận'; break;
                    case 'IN_PROGRESS': color = 'processing'; text = 'Đang thực hiện'; break;
                    case 'COMPLETED': color = 'success'; text = 'Hoàn thành'; break;
                    case 'CANCELLED': color = 'error'; text = 'Đã hủy'; break;
                    case 'DECLINED': 
                        color = 'red'; 
                        text = 'Thợ từ chối'; 
                        return (
                            <Tooltip title="Nhấn để xem lý do từ chối">
                                <Tag color={color} className="cursor-pointer" onClick={() => handleReviewDecline(record)}>
                                    {text}
                                </Tag>
                            </Tooltip>
                        );
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Chi tiết',
            key: 'details',
            render: (_, record) => (
                <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex gap-2 items-center">
                        <Calendar size={14} />
                        {dayjs(record.bookingTime).format('HH:mm DD/MM/YYYY')}
                    </div>
                    <div className="flex gap-2 items-center">
                        <MapPin size={14} />
                        <span className="truncate max-w-[200px]" title={record.address}>{record.address}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Kỹ thuật viên',
            dataIndex: 'technicianName',
            key: 'technicianName',
            render: (text) => text ? (
                <div className="flex gap-2 items-center text-green-700 bg-green-50 px-2 py-1 rounded-lg w-fit">
                    <UserCheck size={14} />
                    {text}
                </div>
            ) : (
                <Tag color="default">Chưa phân công</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    ghost 
                    size="small" 
                    icon={<Wrench size={14} />}
                    onClick={() => handleAssign(record)}
                    disabled={record.status === 'COMPLETED' || record.status === 'CANCELLED'}
                >
                    Phân công
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <Title level={3} className="!m-0">Điều phối đơn hàng</Title>
                <Button 
                    icon={<RefreshCw size={16} />} 
                    onClick={fetchData}
                    loading={loading}
                >
                    Làm mới
                </Button>
            </div>

            <AdminCharts bookings={bookings} />

            <Card className="shadow-sm">
                <Table 
                    columns={columns} 
                    dataSource={bookings} 
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Phân công kỹ thuật viên"
                open={isModalVisible}
                onOk={confirmAssign}
                onCancel={() => setIsModalVisible(false)}
            >
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                        <Text strong>Đơn hàng #{selectedBooking?.id}</Text>
                        <div className="mt-1 flex items-center gap-2 text-slate-600">
                            <MapPin size={14} />
                            <span>{selectedBooking?.address}</span>
                        </div>
                    </div>
                    
                    <div>
                        <Text>Chọn kỹ thuật viên:</Text>
                        <Select
                            className="w-full mt-2"
                            placeholder="Chọn kỹ thuật viên"
                            value={selectedTechnician}
                            onChange={setSelectedTechnician}
                        >
                            {technicians.map(tech => (
                                <Option key={tech.id} value={tech.id}>
                                    <div className="flex justify-between">
                                        <span>{tech.fullName}</span>
                                        <span className="text-slate-400 text-xs">{tech.phone}</span>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Xử lý yêu cầu từ chối"
                open={reviewModalVisible}
                footer={null}
                onCancel={() => setReviewModalVisible(false)}
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <Text strong className="text-red-700">Lý do từ chối:</Text>
                        <p className="mt-2 text-slate-700">{bookingToReview?.rejectionReason || 'Không có lý do chi tiết'}</p>
                    </div>
                    
                    <div className="flex gap-3 justify-end mt-6">
                        <Button 
                            danger
                            onClick={() => submitReview(false)}
                        >
                            Bác bỏ (Bắt buộc làm)
                        </Button>
                        <Button 
                            type="primary"
                            onClick={() => submitReview(true)}
                        >
                            Chấp nhận (Phân công lại)
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDispatch;
