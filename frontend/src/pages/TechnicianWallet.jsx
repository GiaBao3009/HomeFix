import { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, message, Button } from 'antd';
import { Wallet, RefreshCw } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TechnicianWallet = () => {
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState({
        walletBalance: 0,
        completedJobs: 0,
        totalRevenue: 0,
        totalPlatformProfit: 0,
        lifetimeIncome: 0,
        technicianType: null,
        approvalStatus: null,
        items: []
    });

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/technician/wallet');
            setWallet(response.data || {});
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Không thể tải ví kỹ thuật viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const columns = [
        { title: 'Mã đơn', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
        { title: 'Dịch vụ', dataIndex: 'serviceName', key: 'serviceName' },
        {
            title: 'Ngày hoàn thành',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (_, record) => record?.status === 'COMPLETED' ? dayjs(record.completedAt || record.bookingTime).format('DD/MM/YYYY HH:mm') : '-'
        },
        {
            title: 'Doanh thu đơn',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`
        },
        {
            title: 'Thu nhập nhận',
            dataIndex: 'technicianEarning',
            key: 'technicianEarning',
            render: (value) => <span className="font-semibold text-emerald-600">{Number(value || 0).toLocaleString('vi-VN')} đ</span>
        },
        {
            title: 'Chiết khấu nền tảng',
            dataIndex: 'platformProfit',
            key: 'platformProfit',
            render: (value) => <span className="font-semibold text-orange-600">{Number(value || 0).toLocaleString('vi-VN')} đ</span>
        }
    ];

    return (
        <div className="p-6 mx-auto max-w-7xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="!mb-1">Ví kỹ thuật viên</Title>
                    <Text type="secondary">Tiền chỉ cộng vào ví khi công việc hoàn thành</Text>
                </div>
                <Button icon={<RefreshCw size={16} />} onClick={fetchWallet}>Làm mới</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
                <Card className="rounded-xl shadow-sm">
                    <div className="flex gap-3 items-center">
                        <Wallet className="text-emerald-600" />
                        <div>
                            <Text type="secondary">Số dư ví hiện tại</Text>
                            <div className="text-2xl font-bold text-emerald-600">{Number(wallet.walletBalance || 0).toLocaleString('vi-VN')} đ</div>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <Text type="secondary">Số công việc hoàn thành</Text>
                    <div className="text-2xl font-bold">{wallet.completedJobs || 0}</div>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <Text type="secondary">Tổng doanh thu đơn đã làm</Text>
                    <div className="text-2xl font-bold text-slate-700">{Number(wallet.totalRevenue || 0).toLocaleString('vi-VN')} đ</div>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <Text type="secondary">Tổng lợi nhuận nền tảng</Text>
                    <div className="text-2xl font-bold text-orange-600">{Number(wallet.totalPlatformProfit || 0).toLocaleString('vi-VN')} đ</div>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <Text type="secondary">Tổng thu nhập đã nhận</Text>
                    <div className="text-2xl font-bold text-blue-600">{Number(wallet.lifetimeIncome || 0).toLocaleString('vi-VN')} đ</div>
                    <div className="mt-2">
                        <Tag color={wallet.approvalStatus === 'APPROVED' ? 'green' : wallet.approvalStatus === 'PENDING' ? 'gold' : 'default'}>
                            {wallet.technicianType === 'MAIN' ? 'Thợ chính' : wallet.technicianType === 'ASSISTANT' ? 'Thợ phụ' : 'Chưa chọn loại thợ'}
                        </Tag>
                    </div>
                </Card>
            </div>

            <Card className="rounded-xl shadow-sm" title="Lịch sử nhận tiền">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={Array.isArray(wallet.items) ? wallet.items : []}
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>
        </div>
    );
};

export default TechnicianWallet;
