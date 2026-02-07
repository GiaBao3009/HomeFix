import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Input } from 'antd';
import { User, Shield, Briefcase, Search, RefreshCw, Edit } from 'lucide-react';
import api from '../services/api';

const { Option } = Select;

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
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

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'red';
            case 'TECHNICIAN': return 'blue';
            case 'CUSTOMER': return 'green';
            default: return 'default';
        }
    };

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
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
            onFilter: (value, record) => record.fullName.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={getRoleColor(role)} className="px-3 py-1 text-sm font-medium">
                    {role === 'CUSTOMER' ? 'Khách hàng' : role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Quản trị viên'}
                </Tag>
            ),
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-8 h-8 text-blue-600" />
                    Quản lý Người dùng
                </h1>
                <Button icon={<RefreshCw size={16} />} onClick={fetchUsers}>
                    Làm mới
                </Button>
            </div>

            <Card className="shadow-lg rounded-xl border-none">
                <Table 
                    columns={columns} 
                    dataSource={users} 
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
                <p>Chọn vai trò mới cho <strong>{selectedUser?.fullName}</strong>:</p>
                <Select 
                    className="w-full mt-2" 
                    value={selectedRole} 
                    onChange={setSelectedRole}
                >
                    <Option value="CUSTOMER">Khách hàng</Option>
                    <Option value="TECHNICIAN">Kỹ thuật viên</Option>
                    <Option value="ADMIN">Quản trị viên</Option>
                </Select>
            </Modal>
        </div>
    );
};

export default AdminUserManager;
