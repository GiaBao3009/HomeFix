import { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Modal, Input, Space } from 'antd';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processModal, setProcessModal] = useState({ open: false, id: null, approve: false });
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/withdrawals');
            setWithdrawals(res.data || []);
        } catch (err) {
            message.error('Không thể tải danh sách yêu cầu rút tiền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    const handleProcess = async () => {
        setProcessing(true);
        try {
            await api.patch(`/admin/withdrawals/${processModal.id}`, {
                approve: processModal.approve,
                adminNote
            });
            message.success(processModal.approve ? 'Đã duyệt yêu cầu rút tiền' : 'Đã từ chối yêu cầu rút tiền');
            setProcessModal({ open: false, id: null, approve: false });
            setAdminNote('');
            fetchWithdrawals();
        } catch (err) {
            message.error(err.response?.data?.message || err.response?.data || 'Lỗi xử lý');
        } finally {
            setProcessing(false);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 60, render: (id) => `#${id}` },
        { title: 'Kỹ thuật viên', dataIndex: 'technicianName' },
        { title: 'Số tiền', dataIndex: 'amount', render: (v) => <span className="font-bold">{Number(v || 0).toLocaleString('vi-VN')} đ</span> },
        { title: 'Ngân hàng', dataIndex: 'bankName' },
        { title: 'Số TK', dataIndex: 'bankAccountNumber' },
        { title: 'Chủ TK', dataIndex: 'bankAccountHolder' },
        { title: 'Ngày tạo', dataIndex: 'createdAt', render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-' },
        {
            title: 'Trạng thái', dataIndex: 'status', render: (s) => {
                const map = { PENDING: { color: 'gold', text: 'Chờ duyệt' }, APPROVED: { color: 'green', text: 'Đã duyệt' }, REJECTED: { color: 'red', text: 'Từ chối' } };
                const item = map[s] || { color: 'default', text: s };
                return <Tag color={item.color}>{item.text}</Tag>;
            }
        },
        { title: 'Ghi chú', dataIndex: 'adminNote', render: (n) => n || '-' },
        {
            title: 'Hành động', render: (_, record) => record.status === 'PENDING' ? (
                <Space>
                    <Button size="small" type="primary" icon={<CheckCircle size={14} />}
                        onClick={() => { setProcessModal({ open: true, id: record.id, approve: true }); setAdminNote(''); }}>
                        Duyệt
                    </Button>
                    <Button size="small" danger icon={<XCircle size={14} />}
                        onClick={() => { setProcessModal({ open: true, id: record.id, approve: false }); setAdminNote(''); }}>
                        Từ chối
                    </Button>
                </Space>
            ) : null
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Quản lý yêu cầu rút tiền</h2>
                <Button onClick={fetchWithdrawals}>Làm mới</Button>
            </div>
            <Table rowKey="id" columns={columns} dataSource={withdrawals} loading={loading} pagination={{ pageSize: 10 }} />

            <Modal
                title={processModal.approve ? 'Duyệt yêu cầu rút tiền' : 'Từ chối yêu cầu rút tiền'}
                open={processModal.open}
                onCancel={() => setProcessModal({ open: false, id: null, approve: false })}
                onOk={handleProcess}
                confirmLoading={processing}
                okText={processModal.approve ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                okType={processModal.approve ? 'primary' : 'danger'}
            >
                <TextArea
                    rows={3}
                    placeholder="Ghi chú cho kỹ thuật viên (không bắt buộc)..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                />
            </Modal>
        </div>
    );
}
