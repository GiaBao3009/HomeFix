import { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Modal, Input, Space, Typography } from 'antd';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

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

    useEffect(() => { fetchWithdrawals(); }, []);

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

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
        { title: 'Kỹ thuật viên', dataIndex: 'technicianName', key: 'technicianName' },
        {
            title: 'Số tiền', dataIndex: 'amount', key: 'amount',
            render: (v) => <span className="font-bold text-emerald-600">{Number(v || 0).toLocaleString('vi-VN')} đ</span>
        },
        { title: 'Ngân hàng', dataIndex: 'bankName', key: 'bankName' },
        { title: 'Số TK', dataIndex: 'bankAccountNumber', key: 'bankAccountNumber' },
        { title: 'Chủ TK', dataIndex: 'bankAccountHolder', key: 'bankAccountHolder' },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (s) => {
                const map = { PENDING: ['gold', 'Chờ duyệt'], APPROVED: ['green', 'Đã duyệt'], REJECTED: ['red', 'Từ chối'] };
                const [color, text] = map[s] || ['default', s];
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Ghi chú', dataIndex: 'adminNote', key: 'adminNote', render: (v) => v || '-' },
        {
            title: 'Hành động', key: 'action',
            render: (_, record) => record.status === 'PENDING' ? (
                <Button size="small" type="primary" onClick={() => { setSelectedRequest(record); setAdminNote(''); setProcessModalOpen(true); }}>
                    Xử lý
                </Button>
            ) : null
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Text strong className="text-lg">Quản lý yêu cầu rút tiền</Text>
                <Button icon={<RefreshCw size={16} />} onClick={fetchWithdrawals}>Làm mới</Button>
            </div>
            <Table rowKey="id" columns={columns} dataSource={withdrawals} loading={loading} pagination={{ pageSize: 10 }} />

            <Modal title={`Xử lý yêu cầu rút tiền #${selectedRequest?.id}`} open={processModalOpen} onCancel={() => setProcessModalOpen(false)} footer={null}>
                <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p><Text type="secondary">Kỹ thuật viên: </Text><strong>{selectedRequest?.technicianName}</strong></p>
                        <p><Text type="secondary">Số tiền: </Text><strong className="text-emerald-600">{Number(selectedRequest?.amount || 0).toLocaleString('vi-VN')} đ</strong></p>
                        <p><Text type="secondary">Ngân hàng: </Text><strong>{selectedRequest?.bankName} - {selectedRequest?.bankAccountNumber}</strong></p>
                        <p><Text type="secondary">Chủ TK: </Text><strong>{selectedRequest?.bankAccountHolder}</strong></p>
                    </div>
                    <div>
                        <Text className="block mb-2">Ghi chú admin (tùy chọn)</Text>
                        <Input.TextArea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Nhập ghi chú..." />
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
