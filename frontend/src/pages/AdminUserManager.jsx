import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Input } from 'antd';
import { User, Shield, Briefcase, Search, RefreshCw, Edit, Users } from 'lucide-react';
import api from '../services/api';

const { Option } = Select;

const ROLE_FILTER_ALL = 'ALL';

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalSearchText, setGlobalSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState(ROLE_FILTER_ALL);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching users:", error);
            message.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleUpdate = async () => {
        if (!selectedUser || !selectedRole) return;
        try {
            await api.patch(`/admin/users/${selectedUser.id}/role`, { role: selectedRole });
            message.success(`Cập nhật quyền cho ${selectedUser.fullName} thành công`);
            setIsRoleModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            message.error('Cập nhật quyền thất bại');
        }
    };

    const handleTechnicianApproval = async (userId, approved) => {
        try {
            await api.patch(`/admin/users/${userId}/technician-approval`, { approved });
            message.success(approved ? 'Đã duyệt thợ chính' : 'Đã từ chối duyệt thợ chính');
            fetchUsers();
        } catch (error) {
            console.error("Error approving technician:", error);
            message.error(error.response?.data?.message || 'Duyệt kỹ thuật viên thất bại');
        }
    };

    const getRoleTagProps = (role) => {
        switch (role) {
            case 'ADMIN':
                return { color: '#7c3aed', label: 'Quản trị viên' };
            case 'TECHNICIAN':
                return { color: '#0ea5e9', label: 'Kỹ thuật viên' };
            case 'CUSTOMER':
                return { color: '#16a34a', label: 'Khách hàng' };
            default:
                return { color: 'default', label: 'Chưa xác định' };
        }
    };

    const summary = useMemo(() => {
        const total = users.length;
        const technicians = users.filter((u) => u.role === 'TECHNICIAN').length;
        const admins = users.filter((u) => u.role === 'ADMIN').length;
        return { total, technicians, admins };
    }, [users]);

    const filteredUsers = useMemo(() => {
        let list = users;
        if (roleFilter !== ROLE_FILTER_ALL) {
            list = list.filter((u) => u.role === roleFilter);
        }
        const q = globalSearchText.trim().toLowerCase();
        if (!q) return list;
        return list.filter((u) => {
            const name = (u.fullName || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.phone || '').toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });
    }, [users, roleFilter, globalSearchText]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div className="p-4">
                    <Input
                        placeholder="Tìm theo tên"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        className="mb-2 block"
                    />
                    <Space>
                        <Button type="primary" onClick={() => confirm()} icon={<Search size={14} />} size="small">
                            Tìm
                        </Button>
                        <Button onClick={() => clearFilters()} size="small">
                            Xóa
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value, record) => (record.fullName || '').toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                const { color, label } = getRoleTagProps(role);
                return (
                    <Tag color={color} className="m-0 rounded-full border-0 px-3 py-0.5 text-xs font-semibold">
                        {label}
                    </Tag>
                );
            },
        },
        {
            title: 'Loại thợ',
            dataIndex: 'technicianType',
            key: 'technicianType',
            render: (_, record) => {
                if (record.role !== 'TECHNICIAN') return '-';
                return record.technicianType === 'MAIN'
                    ? 'Thợ chính'
                    : record.technicianType === 'ASSISTANT'
                      ? 'Thợ phụ'
                      : 'Chưa chọn';
            },
        },
        {
            title: 'Duyệt thợ',
            dataIndex: 'technicianApprovalStatus',
            key: 'technicianApprovalStatus',
            render: (_, record) => {
                if (record.role !== 'TECHNICIAN' || record.technicianType !== 'MAIN') return '-';
                const status = record.technicianApprovalStatus;
                if (status === 'APPROVED') return <Tag color="green">Đã duyệt</Tag>;
                if (status === 'REJECTED') return <Tag color="red">Đã từ chối</Tag>;
                if (status === 'PENDING') {
                    return (
                        <Space>
                            <Tag color="gold">Chờ duyệt</Tag>
                            <Button size="small" type="primary" onClick={() => handleTechnicianApproval(record.id, true)}>
                                Duyệt
                            </Button>
                            <Button size="small" danger onClick={() => handleTechnicianApproval(record.id, false)}>
                                Từ chối
                            </Button>
                        </Space>
                    );
                }
                return '-';
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Button
                    icon={<Edit size={16} />}
                    onClick={() => {
                        setSelectedUser(record);
                        setSelectedRole(record.role);
                        setIsRoleModalVisible(true);
                    }}
                >
                    Phân quyền
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <User className="h-8 w-8 text-blue-600" />
                    Quản lý Người dùng
                </h1>
                <Button icon={<RefreshCw size={16} />} onClick={fetchUsers}>
                    Làm mới
                </Button>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Users size={14} className="text-slate-500" />
                        Tổng: {summary.total}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                        <Briefcase size={14} className="text-sky-600" />
                        Thợ: {summary.technicians}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                        <Shield size={14} className="text-violet-600" />
                        Quản trị: {summary.admins}
                    </span>
                </div>
                <Space wrap className="w-full lg:w-auto">
                    <Input
                        allowClear
                        prefix={<Search size={16} className="text-slate-400" />}
                        placeholder="Tìm theo tên, email hoặc số điện thoại…"
                        value={globalSearchText}
                        onChange={(e) => setGlobalSearchText(e.target.value)}
                        className="min-w-[220px] flex-1 lg:max-w-md"
                    />
                    <Select
                        value={roleFilter}
                        onChange={setRoleFilter}
                        className="min-w-[180px]"
                        placeholder="Lọc vai trò"
                    >
                        <Option value={ROLE_FILTER_ALL}>Tất cả vai trò</Option>
                        <Option value="CUSTOMER">Khách hàng</Option>
                        <Option value="TECHNICIAN">Kỹ thuật viên</Option>
                        <Option value="ADMIN">Quản trị viên</Option>
                    </Select>
                </Space>
            </div>

            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Phân quyền người dùng"
                open={isRoleModalVisible}
                onOk={handleRoleUpdate}
                onCancel={() => setIsRoleModalVisible(false)}
            >
                <p>
                    Chọn vai trò mới cho <strong>{selectedUser?.fullName}</strong>:
                </p>
                <Select className="mt-2 w-full" value={selectedRole} onChange={setSelectedRole}>
                    <Option value="CUSTOMER">Khách hàng</Option>
                    <Option value="TECHNICIAN">Kỹ thuật viên</Option>
                    <Option value="ADMIN">Quản trị viên</Option>
                </Select>
            </Modal>
        </div>
    );
};

export default AdminUserManager;
