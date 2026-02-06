import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Select, Input } from 'antd';
import { User, Shield, Briefcase, Search, RefreshCw, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Use /users endpoint for admin management (mapped to /api/users in backend)
            const response = await api.get('/users');
            console.log("Users fetched:", response.data);
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

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            message.success('Cập nhật quyền thành công');
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error('Không thể cập nhật quyền');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => (
                <div className="flex gap-2 items-center">
                    <User size={16} className="text-blue-500" />
                    <span className="font-medium">{text}</span>
                </div>
            ),
            filteredValue: [searchText],
            onFilter: (value, record) => {
                return String(record.fullName).toLowerCase().includes(value.toLowerCase()) ||
                       String(record.email).toLowerCase().includes(value.toLowerCase()) ||
                       String(record.phone).toLowerCase().includes(value.toLowerCase());
            },
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
                let color = 'default';
                let icon = <User size={14} />;
                let text = role;

                switch (role) {
                    case 'ADMIN': 
                        color = 'red'; 
                        icon = <Shield size={14} />;
                        text = 'Quản trị viên';
                        break;
                    case 'TECHNICIAN': 
                        color = 'blue'; 
                        icon = <Briefcase size={14} />;
                        text = 'Kỹ thuật viên';
                        break;
                    case 'CUSTOMER': 
                        color = 'green'; 
                        text = 'Khách hàng';
                        break;
                }
                
                return (
                    <Tag color={color} className="flex gap-1 items-center w-fit">
                        {icon} {text}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Select
                    defaultValue={record.role}
                    style={{ width: 140 }}
                    onChange={(value) => handleRoleUpdate(record.id, value)}
                    disabled={record.role === 'ADMIN' && record.id === 1} // Prevent changing Super Admin (assuming ID 1)
                >
                    <Option value="CUSTOMER">Khách hàng</Option>
                    <Option value="TECHNICIAN">Kỹ thuật viên</Option>
                    <Option value="ADMIN">Quản trị viên</Option>
                </Select>
            ),
        },
    ];

    return (
        <div className="p-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Quản lý Người dùng</h2>
                    <p className="text-slate-500">Xem và phân quyền thành viên</p>
                </div>
                <Space>
                    <Input 
                        placeholder="Tìm kiếm..." 
                        prefix={<Search size={16} />} 
                        onChange={e => setSearchText(e.target.value)}
                        className="w-64"
                    />
                    <Button icon={<RefreshCw size={16} />} onClick={fetchUsers}>
                        Làm mới
                    </Button>
                </Space>
            </div>

            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                className="shadow-sm rounded-xl overflow-hidden border border-slate-200"
            />
        </div>
    );
};

export default AdminUserManager;
