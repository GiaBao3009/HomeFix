import { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, message, Button, Modal, InputNumber, Form, Input, Descriptions } from 'antd';
import { Wallet, RefreshCw, Landmark, ArrowDownToLine } from 'lucide-react';
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
    const [profile, setProfile] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [bankForm] = Form.useForm();
    const [withdrawForm] = Form.useForm();

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

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/technician/profile');
            setProfile(res.data);
        } catch (e) { /* ignore */ }
    };

    const fetchWithdrawals = async () => {
        try {
            const res = await api.get('/technician/withdrawals');
            setWithdrawals(res.data || []);
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        fetchWallet();
        fetchProfile();
        fetchWithdrawals();
    }, []);

    const handleBankSubmit = async (values) => {
        try {
            await api.put('/users/technician/bank-info', values);
            message.success('Cập nhật thông tin ngân hàng thành công');
            setBankModalOpen(false);
            fetchProfile();
        } catch (err) {
            message.error(err.response?.data?.message || err.response?.data || 'Lỗi cập nhật');
        }
    };

    const handleWithdraw = async (values) => {
        setWithdrawing(true);
        try {
            await api.post('/technician/withdrawals', { amount: values.amount });
            message.success('Yêu cầu rút tiền đã được gửi');
            setWithdrawModalOpen(false);
            fetchWallet();
            fetchWithdrawals();
        } catch (err) {
            message.error(err.response?.data?.message || err.response?.data || 'Không thể rút tiền');
        } finally {
            setWithdrawing(false);
        }
    };

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

            <Card className="rounded-xl shadow-sm" title={
                <div className="flex justify-between items-center">
                    <span>Thông tin ngân hàng</span>
                    <Button size="small" icon={<Landmark size={14} />} onClick={() => {
                        bankForm.setFieldsValue({
                            bankName: profile?.bankName || '',
                            bankAccountNumber: profile?.bankAccountNumber || '',
                            bankAccountHolder: profile?.bankAccountHolder || ''
                        });
                        setBankModalOpen(true);
                    }}>
                        {profile?.bankName ? 'Sửa' : 'Thêm'} ngân hàng
                    </Button>
                </div>
            }>
                {profile?.bankName ? (
                    <Descriptions column={3}>
                        <Descriptions.Item label="Ngân hàng">{profile.bankName}</Descriptions.Item>
                        <Descriptions.Item label="Số tài khoản">{profile.bankAccountNumber}</Descriptions.Item>
                        <Descriptions.Item label="Chủ tài khoản">{profile.bankAccountHolder}</Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Text type="secondary">Chưa liên kết ngân hàng. Vui lòng thêm thông tin ngân hàng để rút tiền.</Text>
                )}
            </Card>

            <Card className="rounded-xl shadow-sm" title={
                <div className="flex justify-between items-center">
                    <span>Yêu cầu rút tiền</span>
                    <Button type="primary" icon={<ArrowDownToLine size={14} />} onClick={() => {
                        if (!profile?.bankName) {
                            message.warning('Vui lòng cập nhật thông tin ngân hàng trước');
                            return;
                        }
                        withdrawForm.resetFields();
                        setWithdrawModalOpen(true);
                    }}>
                        Rút tiền
                    </Button>
                </div>
            }>
                <Table
                    rowKey="id"
                    dataSource={withdrawals}
                    pagination={{ pageSize: 5 }}
                    columns={[
                        { title: 'Ngày tạo', dataIndex: 'createdAt', render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-' },
                        { title: 'Số tiền', dataIndex: 'amount', render: (v) => <span className="font-semibold">{Number(v || 0).toLocaleString('vi-VN')} đ</span> },
                        { title: 'Ngân hàng', dataIndex: 'bankName' },
                        { title: 'Số TK', dataIndex: 'bankAccountNumber' },
                        { title: 'Trạng thái', dataIndex: 'status', render: (s) => {
                            const map = { PENDING: { color: 'gold', text: 'Chờ duyệt' }, APPROVED: { color: 'green', text: 'Đã duyệt' }, REJECTED: { color: 'red', text: 'Từ chối' } };
                            const item = map[s] || { color: 'default', text: s };
                            return <Tag color={item.color}>{item.text}</Tag>;
                        }},
                        { title: 'Ghi chú', dataIndex: 'adminNote', render: (n) => n || '-' },
                    ]}
                />
            </Card>

            <Card className="rounded-xl shadow-sm" title="Lịch sử nhận tiền">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={Array.isArray(wallet.items) ? wallet.items : []}
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            <Modal title="Thông tin ngân hàng" open={bankModalOpen} onCancel={() => setBankModalOpen(false)} footer={null}>
                <Form form={bankForm} layout="vertical" onFinish={handleBankSubmit}>
                    <Form.Item name="bankName" label="Tên ngân hàng" rules={[{ required: true, message: 'Nhập tên ngân hàng' }]}>
                        <Input placeholder="VD: Vietcombank, MB Bank, Techcombank..." />
                    </Form.Item>
                    <Form.Item name="bankAccountNumber" label="Số tài khoản" rules={[{ required: true, message: 'Nhập số tài khoản' }]}>
                        <Input placeholder="Nhập số tài khoản ngân hàng" />
                    </Form.Item>
                    <Form.Item name="bankAccountHolder" label="Tên chủ tài khoản" rules={[{ required: true, message: 'Nhập tên chủ TK' }]}>
                        <Input placeholder="NGUYEN VAN A (viết hoa, không dấu)" />
                    </Form.Item>
                    <div className="text-right">
                        <Button onClick={() => setBankModalOpen(false)} className="mr-2">Hủy</Button>
                        <Button type="primary" htmlType="submit">Lưu</Button>
                    </div>
                </Form>
            </Modal>

            <Modal title="Rút tiền về ngân hàng" open={withdrawModalOpen} onCancel={() => setWithdrawModalOpen(false)} footer={null}>
                <div className="mb-4 p-3 rounded-lg bg-slate-50">
                    <Text type="secondary">Số dư hiện tại: </Text>
                    <span className="text-lg font-bold text-emerald-600">{Number(wallet.walletBalance || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <Form form={withdrawForm} layout="vertical" onFinish={handleWithdraw}>
                    <Form.Item name="amount" label="Số tiền rút" rules={[{ required: true, message: 'Nhập số tiền' }]}>
                        <InputNumber
                            className="w-full"
                            min={10000}
                            max={wallet.walletBalance || 0}
                            step={10000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/,/g, '')}
                            placeholder="Nhập số tiền muốn rút"
                        />
                    </Form.Item>
                    <div className="text-right">
                        <Button onClick={() => setWithdrawModalOpen(false)} className="mr-2">Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={withdrawing}>Gửi yêu cầu</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default TechnicianWallet;
