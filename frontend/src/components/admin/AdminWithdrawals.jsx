import { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Tag,
    Button,
    Card,
    message,
    Modal,
    Input,
    Space,
    Typography,
    Row,
    Col,
    Statistic,
    Select,
} from 'antd';
import { CheckCircle, XCircle, RefreshCw, Clock, Wallet } from 'lucide-react';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/withdrawals/all');
            setWithdrawals(res.data || []);
        } catch (error) {
            message.error('Không thể tải danh sách yêu cầu rút tiền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleProcess = async (approved) => {
        setProcessing(true);
        try {
            await api.post(`/withdrawals/${selectedRequest.id}/process`, { approved, adminNote });
            message.success(approved ? 'Đã duyệt yêu cầu rút tiền' : 'Đã từ chối yêu cầu rút tiền');
            setProcessModalOpen(false);
            setAdminNote('');
            fetchWithdrawals();
        } catch (error) {
            message.error(error.response?.data?.message || error.response?.data || 'Xử lý thất bại');
        } finally {
            setProcessing(false);
        }
    };

    const stats = useMemo(() => {
        const pending = withdrawals.filter((w) => w.status === 'PENDING');
        const approved = withdrawals.filter((w) => w.status === 'APPROVED');
        const rejected = withdrawals.filter((w) => w.status === 'REJECTED');
        const sumAmount = (arr) => arr.reduce((acc, w) => acc + Number(w.amount || 0), 0);
        return {
            pendingCount: pending.length,
            pendingTotal: sumAmount(pending),
            approvedCount: approved.length,
            approvedTotal: sumAmount(approved),
            rejectedCount: rejected.length,
            rejectedTotal: sumAmount(rejected),
        };
    }, [withdrawals]);

    const filteredWithdrawals = useMemo(() => {
        if (statusFilter === 'ALL') return withdrawals;
        return withdrawals.filter((w) => w.status === statusFilter);
    }, [withdrawals, statusFilter]);

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
        { title: 'Kỹ thuật viên', dataIndex: 'technicianName', key: 'technicianName' },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (v) => <span className="font-bold text-emerald-600">{formatVnd(v)}</span>,
        },
        { title: 'Ngân hàng', dataIndex: 'bankName', key: 'bankName' },
        { title: 'Số TK', dataIndex: 'bankAccountNumber', key: 'bankAccountNumber' },
        { title: 'Chủ TK', dataIndex: 'bankAccountHolder', key: 'bankAccountHolder' },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s) => {
                const map = {
                    PENDING: ['gold', 'Chờ duyệt'],
                    APPROVED: ['green', 'Đã duyệt'],
                    REJECTED: ['red', 'Từ chối'],
                };
                const [color, text] = map[s] || ['default', s];
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'),
        },
        { title: 'Ghi chú', dataIndex: 'adminNote', key: 'adminNote', render: (v) => v || '-' },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) =>
                record.status === 'PENDING' ? (
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            setSelectedRequest(record);
                            setAdminNote('');
                            setProcessModalOpen(true);
                        }}
                    >
                        Xử lý
                    </Button>
                ) : null,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <Text strong className="text-lg">
                    Quản lý yêu cầu rút tiền
                </Text>
                <Space wrap>
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ minWidth: 160 }}
                        options={[
                            { value: 'ALL', label: 'Tất cả' },
                            { value: 'PENDING', label: 'Chờ duyệt' },
                            { value: 'APPROVED', label: 'Đã duyệt' },
                            { value: 'REJECTED', label: 'Từ chối' },
                        ]}
                    />
                    <Button icon={<RefreshCw size={16} />} onClick={fetchWithdrawals}>
                        Làm mới
                    </Button>
                </Space>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-amber-200/80 bg-amber-50/40">
                        <Statistic
                            title={
                                <span className="flex items-center gap-2 text-amber-800">
                                    <Clock size={18} className="text-amber-600" />
                                    Chờ duyệt
                                </span>
                            }
                            value={stats.pendingCount}
                            valueStyle={{ color: '#b45309' }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-amber-900 text-sm font-medium">
                            <Wallet size={16} className="text-amber-600 shrink-0" />
                            <span>Tổng: {formatVnd(stats.pendingTotal)}</span>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-emerald-200/80 bg-emerald-50/40">
                        <Statistic
                            title={
                                <span className="flex items-center gap-2 text-emerald-800">
                                    <CheckCircle size={18} className="text-emerald-600" />
                                    Đã duyệt
                                </span>
                            }
                            value={stats.approvedCount}
                            valueStyle={{ color: '#047857' }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-emerald-900 text-sm font-medium">
                            <Wallet size={16} className="text-emerald-600 shrink-0" />
                            <span>Tổng: {formatVnd(stats.approvedTotal)}</span>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-red-200/80 bg-red-50/40">
                        <Statistic
                            title={
                                <span className="flex items-center gap-2 text-red-800">
                                    <XCircle size={18} className="text-red-600" />
                                    Từ chối
                                </span>
                            }
                            value={stats.rejectedCount}
                            valueStyle={{ color: '#b91c1c' }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-red-900 text-sm font-medium">
                            <Wallet size={16} className="text-red-600 shrink-0" />
                            <span>Tổng: {formatVnd(stats.rejectedTotal)}</span>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="rounded-xl shadow-sm">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredWithdrawals}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={`Xử lý yêu cầu rút tiền #${selectedRequest?.id}`}
                open={processModalOpen}
                onCancel={() => setProcessModalOpen(false)}
                footer={null}
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950">
                        <Text className="block text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                            Chi tiết yêu cầu
                        </Text>
                        <p className="mb-1">
                            <Text type="secondary">Kỹ thuật viên: </Text>
                            <strong>{selectedRequest?.technicianName}</strong>
                        </p>
                        <p className="mb-1">
                            <Text type="secondary">Số tiền: </Text>
                            <strong className="text-emerald-700">{formatVnd(selectedRequest?.amount)}</strong>
                        </p>
                        <p className="mb-1">
                            <Text type="secondary">Ngân hàng: </Text>
                            <strong>
                                {selectedRequest?.bankName} — {selectedRequest?.bankAccountNumber}
                            </strong>
                        </p>
                        <p className="mb-0">
                            <Text type="secondary">Chủ TK: </Text>
                            <strong>{selectedRequest?.bankAccountHolder}</strong>
                        </p>
                    </div>
                    <div>
                        <Text className="block mb-2">Ghi chú admin (tùy chọn)</Text>
                        <Input.TextArea
                            rows={3}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Nhập ghi chú..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button danger icon={<XCircle size={14} />} onClick={() => handleProcess(false)} loading={processing}>
                            Từ chối
                        </Button>
                        <Button type="primary" icon={<CheckCircle size={14} />} onClick={() => handleProcess(true)} loading={processing}>
                            Duyệt
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminWithdrawals;
