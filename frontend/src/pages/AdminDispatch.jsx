import { useEffect, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Tag,
    Button,
    Typography,
    message,
    Space,
    Statistic,
    Row,
    Col,
    Select,
    Input
} from 'antd';
import { UserCheck, RefreshCw, Inbox, Loader, CheckCircle } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

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

const statusLabels = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    ASSIGNED: 'Đã phân công',
    ARRIVED: 'Đã đến nơi',
    WORKING: 'Đang làm',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    DECLINED: 'Đã từ chối'
};

const statusFilterOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label
}));

const AdminDispatch = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState(null);
    const [searchText, setSearchText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const bookingsRes = await api.get('/bookings/all');
            setBookings(bookingsRes.data || []);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải dữ liệu điều phối');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = useMemo(
        () => ({
            open: bookings.filter((item) => item.status === 'CONFIRMED' && !item.technicianId).length,
            claimed: bookings.filter((item) => item.status === 'ASSIGNED').length,
            inProgress: bookings.filter((item) =>
                ['IN_PROGRESS', 'ARRIVED', 'WORKING'].includes(item.status)
            ).length,
            completed: bookings.filter((item) => item.status === 'COMPLETED').length
        }),
        [bookings]
    );

    const filteredBookings = useMemo(() => {
        let list = bookings;
        if (statusFilter) {
            list = list.filter((b) => b.status === statusFilter);
        }
        const q = searchText.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (b) =>
                    (b.customerName || '').toLowerCase().includes(q) ||
                    (b.serviceName || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [bookings, statusFilter, searchText]);

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70, render: (value) => <Text strong>#{value}</Text> },
        { title: 'Khách hàng', dataIndex: 'customerName' },
        { title: 'Dịch vụ', dataIndex: 'serviceName' },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            ellipsis: true,
            render: (text) => text || <Text type="secondary">—</Text>
        },
        {
            title: 'Thời gian',
            dataIndex: 'bookingTime',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status) => (
                <Tag color={statusColors[status] || 'default'}>
                    {statusLabels[status] || status}
                </Tag>
            )
        },
        {
            title: 'Thợ chính',
            dataIndex: 'technicianName',
            render: (text) =>
                text ? (
                    <div className="flex gap-2 items-center px-2 py-1 text-green-700 bg-green-50 rounded-lg w-fit">
                        <UserCheck size={14} />
                        {text}
                    </div>
                ) : (
                    <Tag>Đang chờ thợ nhận</Tag>
                )
        },
        {
            title: 'Thợ phụ',
            dataIndex: 'assistantTechnicianNames',
            render: (names = []) =>
                names.length ? (
                    <Space wrap>
                        {names.map((name) => (
                            <Tag key={name}>{name}</Tag>
                        ))}
                    </Space>
                ) : (
                    <Text type="secondary">Không có</Text>
                )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <Title level={3} className="!m-0">
                        Điều phối đơn hàng
                    </Title>
                    <Text type="secondary">
                        Admin chỉ theo dõi. Thợ phù hợp sẽ tự nhận đơn trước theo danh mục.
                    </Text>
                </div>
                <Button icon={<RefreshCw size={16} />} onClick={fetchData} loading={loading}>
                    Làm mới
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="rounded-xl shadow-sm border border-slate-100/80">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl p-3 bg-orange-50 text-orange-600 shrink-0">
                                <Inbox size={22} strokeWidth={2} />
                            </div>
                            <Statistic
                                title="Đơn đang mở"
                                value={summary.open}
                                valueStyle={{ color: '#ea580c', fontWeight: 600 }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="rounded-xl shadow-sm border border-slate-100/80">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl p-3 bg-blue-50 text-blue-600 shrink-0">
                                <UserCheck size={22} strokeWidth={2} />
                            </div>
                            <Statistic
                                title="Đơn đã được nhận"
                                value={summary.claimed}
                                valueStyle={{ color: '#2563eb', fontWeight: 600 }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="rounded-xl shadow-sm border border-slate-100/80">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl p-3 bg-violet-50 text-violet-600 shrink-0">
                                <Loader size={22} strokeWidth={2} />
                            </div>
                            <Statistic
                                title="Đang thực hiện"
                                value={summary.inProgress}
                                valueStyle={{ color: '#7c3aed', fontWeight: 600 }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="rounded-xl shadow-sm border border-slate-100/80">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl p-3 bg-emerald-50 text-emerald-600 shrink-0">
                                <CheckCircle size={22} strokeWidth={2} />
                            </div>
                            <Statistic
                                title="Hoàn thành"
                                value={summary.completed}
                                valueStyle={{ color: '#059669', fontWeight: 600 }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm rounded-xl">
                <Space wrap className="mb-4 w-full" size="middle">
                    <Input.Search
                        allowClear
                        placeholder="Tìm theo tên khách hàng hoặc dịch vụ"
                        style={{ minWidth: 260, maxWidth: 360 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc theo trạng thái"
                        style={{ width: 220 }}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={statusFilterOptions}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={filteredBookings}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default AdminDispatch;
