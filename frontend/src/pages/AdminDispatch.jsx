import { useEffect, useMemo, useState } from 'react';
import { Table, Card, Tag, Button, Typography, message, Space, Statistic, Row, Col } from 'antd';
import { UserCheck, RefreshCw } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import AdminCharts from '../components/admin/AdminCharts';

const { Title, Text } = Typography;

const statusColors = {
    PENDING: 'orange',
    CONFIRMED: 'gold',
    ASSIGNED: 'blue',
    ARRIVED: 'geekblue',
    WORKING: 'purple',
    IN_PROGRESS: 'cyan',
    COMPLETED: 'green',
    CANCELLED: 'red',
    DECLINED: 'volcano'
};

const AdminDispatch = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const bookingsRes = await api.get('/bookings/all');
            setBookings(bookingsRes.data || []);
        } catch (error) {
            console.error(error);
            message.error('Khong the tai du lieu dieu phoi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = useMemo(() => ({
        open: bookings.filter((item) => item.status === 'CONFIRMED' && !item.technicianId).length,
        claimed: bookings.filter((item) => item.status === 'ASSIGNED').length,
        inProgress: bookings.filter((item) => ['IN_PROGRESS', 'ARRIVED', 'WORKING'].includes(item.status)).length,
        completed: bookings.filter((item) => item.status === 'COMPLETED').length
    }), [bookings]);

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70, render: (value) => <Text strong>#{value}</Text> },
        { title: 'Khach hang', dataIndex: 'customerName' },
        { title: 'Dich vu', dataIndex: 'serviceName' },
        {
            title: 'Thoi gian',
            dataIndex: 'bookingTime',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Trang thai',
            dataIndex: 'status',
            render: (status) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>
        },
        {
            title: 'Tho chinh',
            dataIndex: 'technicianName',
            render: (text, record) => text
                ? <div className="flex gap-2 items-center px-2 py-1 text-green-700 bg-green-50 rounded-lg w-fit"><UserCheck size={14} />{text}</div>
                : <Tag>Dang cho tho nhan</Tag>
        },
        {
            title: 'Tho phu',
            dataIndex: 'assistantTechnicianNames',
            render: (names = []) => names.length
                ? <Space wrap>{names.map((name) => <Tag key={name}>{name}</Tag>)}</Space>
                : <Text type="secondary">Khong co</Text>
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={3} className="!m-0">Dieu phoi don hang</Title>
                    <Text type="secondary">Admin chi theo doi. Tho phu hop se tu nhan don truoc theo category.</Text>
                </div>
                <Button icon={<RefreshCw size={16} />} onClick={fetchData} loading={loading}>Lam moi</Button>
            </div>

            <Row gutter={16}>
                <Col xs={24} md={6}>
                    <Card bordered={false}><Statistic title="Don dang mo" value={summary.open} /></Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}><Statistic title="Don da duoc nhan" value={summary.claimed} /></Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}><Statistic title="Dang thuc hien" value={summary.inProgress} /></Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false}><Statistic title="Hoan thanh" value={summary.completed} /></Card>
                </Col>
            </Row>

            <AdminCharts />

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default AdminDispatch;
