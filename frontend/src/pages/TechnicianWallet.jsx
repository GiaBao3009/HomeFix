import { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, message, Button, Modal, Form, InputNumber, Descriptions, Empty } from 'antd';
import { Wallet, RefreshCw, Landmark, ArrowDownCircle } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const TechnicianWallet = () => {
    const { user, refreshUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState({
        walletBalance: 0, completedJobs: 0, totalRevenue: 0, totalPlatformProfit: 0, lifetimeIncome: 0,
        technicianType: null, approvalStatus: null, items: []
    });
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const [walletRes, withdrawRes] = await Promise.all([
                api.get('/users/technician/wallet'),
                api.get('/withdrawals/my')
            ]);
            setWallet(walletRes.data || {});
            setWithdrawals(withdrawRes.data || []);
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Không thể tải ví kỹ thuật viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWallet(); }, []);

    const handleWithdraw = async (values) => {
        setSubmitting(true);
        try {
            await api.post('/withdrawals', { amount: values.amount });
            message.success('Đã gửi yêu cầu rút tiền thành công');
            setWithdrawModalOpen(false);
            withdrawForm.resetFields();
            fetchWallet();
            refreshUserProfile?.();
        } catch (error) {
            message.error(error.response?.data?.message || error.response?.data || 'Không thể rút tiền');
        } finally {
            setSubmitting(false);
        }
    };

    const hasBankInfo = user?.bankName && user?.bankAccountNumber;

    const columns = [
        { title: 'Mã đơn', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
        { title: 'Dịch vụ', dataIndex: 'serviceName', key: 'serviceName' },
        {
            title: 'Ngày hoàn thành', dataIndex: 'createdAt', key: 'createdAt',
            render: (_, record) => record?.status === 'COMPLETED' ? dayjs(record.completedAt || record.bookingTime).format('DD/MM/YYYY HH:mm') : '-'
        },
        { title: 'Doanh thu đơn', dataIndex: 'totalPrice', key: 'totalPrice', render: (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ` },
        { title: 'Thu nhập nhận', dataIndex: 'technicianEarning', key: 'technicianEarning', render: (value) => <span className="font-semibold text-emerald-600">{Number(value || 0).toLocaleString('vi-VN')} đ</span> },
        { title: 'Chiết khấu nền tảng', dataIndex: 'platformProfit', key: 'platformProfit', render: (value) => <span className="font-semibold text-orange-600">{Number(value || 0).toLocaleString('vi-VN')} đ</span> }
    ];

    const withdrawalColumns = [
        { title: 'Mã', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
        { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v) => <span className="font-semibold">{Number(v || 0).toLocaleString('vi-VN')} đ</span> },
        { title: 'Ngân hàng', dataIndex: 'bankName', key: 'bankName' },
        { title: 'Số TK', dataIndex: 'bankAccountNumber', key: 'bankAccountNumber' },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (s) => {
                const map = { PENDING: ['gold', 'Chờ duyệt'], APPROVED: ['green', 'Đã duyệt'], REJECTED: ['red', 'Từ chối'] };
                const [color, text] = map[s] || ['default', s];
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Ghi chú admin', dataIndex: 'adminNote', key: 'adminNote', render: (v) => v || '-' }
    ];

    return (
        <div className="p-6 mx-auto max-w-7xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="!mb-1">Ví kỹ thuật viên</Title>
                    <Text type="secondary">Tiền chỉ cộng vào ví khi công việc hoàn thành</Text>
                </div>
                <div className="flex gap-2">
                    <Button icon={<RefreshCw size={16} />} onClick={fetchWallet}>Làm mới</Button>
                    <Button type="primary" icon={<ArrowDownCircle size={16} />}
                        onClick={() => { withdrawForm.resetFields(); setWithdrawModalOpen(true); }}
                        disabled={!hasBankInfo || (wallet.walletBalance || 0) <= 0}>
                        Rút tiền
                    </Button>
                </div>
            </div>

            {!hasBankInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                    <Landmark size={18} className="inline mr-2" />
                    Bạn chưa liên kết tài khoản ngân hàng. Vui lòng cập nhật thông tin ngân hàng tại <a href="/technician/profile" className="text-blue-600 underline">trang hồ sơ</a> để có thể rút tiền.
                </div>
            )}

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
                <Card className="rounded-xl shadow-sm"><Text type="secondary">Số công việc hoàn thành</Text><div className="text-2xl font-bold">{wallet.completedJobs || 0}</div></Card>
                <Card className="rounded-xl shadow-sm"><Text type="secondary">Tổng doanh thu đơn đã làm</Text><div className="text-2xl font-bold text-slate-700">{Number(wallet.totalRevenue || 0).toLocaleString('vi-VN')} đ</div></Card>
                <Card className="rounded-xl shadow-sm"><Text type="secondary">Tổng lợi nhuận nền tảng</Text><div className="text-2xl font-bold text-orange-600">{Number(wallet.totalPlatformProfit || 0).toLocaleString('vi-VN')} đ</div></Card>
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

            {hasBankInfo && (
                <Card className="rounded-xl shadow-sm" title={<span><Landmark size={16} className="inline mr-2" />Thông tin ngân hàng liên kết</span>}>
                    <Descriptions column={3}>
                        <Descriptions.Item label="Ngân hàng">{user.bankName}</Descriptions.Item>
                        <Descriptions.Item label="Số tài khoản">{user.bankAccountNumber}</Descriptions.Item>
                        <Descriptions.Item label="Chủ tài khoản">{user.bankAccountHolder}</Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            <Card className="rounded-xl shadow-sm" title="Lịch sử nhận tiền">
                <Table rowKey="id" columns={columns} dataSource={Array.isArray(wallet.items) ? wallet.items : []} loading={loading} pagination={{ pageSize: 8 }} />
            </Card>

            <Card className="rounded-xl shadow-sm" title="Lịch sử rút tiền">
                {withdrawals.length > 0 ? (
                    <Table rowKey="id" columns={withdrawalColumns} dataSource={withdrawals} loading={loading} pagination={{ pageSize: 5 }} />
                ) : (
                    <Empty description="Chưa có yêu cầu rút tiền nào" />
                )}
            </Card>

            <Modal title="Rút tiền về tài khoản ngân hàng" open={withdrawModalOpen} onCancel={() => setWithdrawModalOpen(false)} footer={null}>
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <Text type="secondary">Số dư khả dụng: </Text>
                    <span className="font-bold text-emerald-600 text-lg">{Number(wallet.walletBalance || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <Form form={withdrawForm} layout="vertical" onFinish={handleWithdraw}>
                    <Form.Item name="amount" label="Số tiền muốn rút (VNĐ)" rules={[
                        { required: true, message: 'Vui lòng nhập số tiền' },
                        { type: 'number', min: 10000, message: 'Số tiền tối thiểu là 10,000 VNĐ' }
                    ]}>
                        <InputNumber className="w-full" min={10000} max={wallet.walletBalance || 0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/,/g, '')} placeholder="Nhập số tiền" />
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                        <Button onClick={() => setWithdrawModalOpen(false)} className="mr-2">Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>Gửi yêu cầu rút tiền</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TechnicianWallet;
