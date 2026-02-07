import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Typography, message, Modal, Select, Space } from 'antd';
import { UserCheck, Wrench, RefreshCw, MapPin } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import AdminCharts from '../components/admin/AdminCharts';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminDispatch = () => {
    const [bookings, setBookings] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [bookingToReview, setBookingToReview] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, techniciansRes] = await Promise.all([
                api.get('/bookings/all'),
                api.get('/users/technicians')
            ]);
            setBookings(bookingsRes.data);
            setTechnicians(techniciansRes.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải dữ liệu điều phối');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAssign = (booking) => {
        setSelectedBooking(booking);
        setIsModalVisible(true);
    };

    const confirmAssign = async () => {
        if (!selectedTechnician) return message.warning('Vui lòng chọn kỹ thuật viên');
        try {
            await api.patch(`/bookings/${selectedBooking.id}/assign?technicianId=${selectedTechnician}`);
            message.success('Phân công thành công');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error('Phân công thất bại');
        }
    };

    const handleReviewDecline = (booking) => {
        setBookingToReview(booking);
        setReviewModalVisible(true);
    };

    const submitReview = async (approve) => {
        try {
            await api.post(`/bookings/${bookingToReview.id}/review-decline?approve=${approve}`);
            message.success(approve ? 'Đã chấp nhận từ chối' : 'Đã từ chối yêu cầu');
            setReviewModalVisible(false);
            fetchData();
        } catch (error) {
            message.error('Xử lý thất bại');
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.patch(`/bookings/${bookingId}/status?status=${newStatus}`);
            message.success('Cập nhật trạng thái thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('Cập nhật trạng thái thất bại');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Khách hàng', dataIndex: 'customerName' },
        { title: 'Dịch vụ', dataIndex: 'serviceName' },
        { title: 'Thời gian', dataIndex: 'bookingTime', render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm') },
        {
            title: 'Trạng thái', dataIndex: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'PENDING') color = 'orange';
                else if (status === 'CONFIRMED') color = 'blue';
                else if (status === 'ASSIGNED') color = 'purple';
                else if (status === 'IN_PROGRESS') color = 'cyan';
                else if (status === 'COMPLETED') color = 'green';
                else if (status === 'CANCELLED') color = 'red';
                else if (status === 'DECLINED') color = 'volcano';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Kỹ thuật viên', dataIndex: 'technicianName',
            render: (text) => text ? <div className="flex gap-2 items-center px-2 py-1 text-green-700 bg-green-50 rounded-lg w-fit"><UserCheck size={14} />{text}</div> : <Tag>Chưa phân công</Tag>,
        },
        {
            title: 'Hành động', key: 'action',
            render: (_, record) => {
                if (record.status === 'DECLINED') {
                    return <Button type="primary" danger size="small" onClick={() => handleReviewDecline(record)}>Duyệt từ chối</Button>;
                }
                if (record.status === 'IN_PROGRESS') {
                    return (
                        <Space>
                             <Button type="primary" ghost size="small" icon={<Wrench size={14} />} onClick={() => handleAssign(record)}>Đổi thợ</Button>
                             <Button type="primary" className="bg-green-600" size="small" onClick={() => handleStatusUpdate(record.id, 'COMPLETED')}>Hoàn thành</Button>
                        </Space>
                    );
                }
                return <Button type="primary" ghost size="small" icon={<Wrench size={14} />} onClick={() => handleAssign(record)} disabled={['COMPLETED', 'CANCELLED'].includes(record.status)}>Phân công</Button>;
            },
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <Title level={3} className="!m-0">Điều phối đơn hàng</Title>
                <Button icon={<RefreshCw size={16} />} onClick={fetchData} loading={loading}>Làm mới</Button>
            </div>
            <AdminCharts />
            <Card bordered={false} className="shadow-sm">
                <Table columns={columns} dataSource={bookings} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
            <Modal title="Phân công kỹ thuật viên" open={isModalVisible} onOk={confirmAssign} onCancel={() => setIsModalVisible(false)}>
                <div className="space-y-4">
                    <div className="p-3 rounded-lg border bg-slate-50">
                        <Text strong>Đơn hàng #{selectedBooking?.id}</Text>
                        <div className="flex gap-2 items-center mt-1 text-slate-600"><MapPin size={14} /><span>{selectedBooking?.address}</span></div>
                    </div>
                    <Select className="mt-2 w-full" placeholder="Chọn kỹ thuật viên" value={selectedTechnician} onChange={setSelectedTechnician}>
                        {technicians.map(tech => (
                            <Option key={tech.id} value={tech.id}>{tech.fullName} - {tech.phone}</Option>
                        ))}
                    </Select>
                </div>
            </Modal>
            <Modal title="Xử lý yêu cầu từ chối" open={reviewModalVisible} footer={null} onCancel={() => setReviewModalVisible(false)}>
                <p>Lý do: <span className="italic">{bookingToReview?.rejectionReason || "Không có"}</span></p>
                <div className="flex gap-2 justify-end mt-4">
                    <Button onClick={() => submitReview(false)}>Không chấp nhận</Button>
                    <Button type="primary" danger onClick={() => submitReview(true)}>Đồng ý (Hủy phân công)</Button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDispatch;
