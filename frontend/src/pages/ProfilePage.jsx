import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, message, Avatar, Upload } from 'antd';
import { User, Mail, Phone, MapPin, Lock, Shield, Eye, EyeOff, Camera } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            setProfile(response.data);
            setAvatarUrl(response.data.avatarUrl);
            form.setFieldsValue(response.data);
            
            // Sync context with latest profile data
            updateUser({
                fullName: response.data.fullName,
                avatarUrl: response.data.avatarUrl,
                role: response.data.role,
                email: response.data.email,
                id: response.data.id
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAvatarUrl(response.data.fileUrl);
            form.setFieldValue('avatarUrl', response.data.fileUrl);
            
            // Auto-save profile with new avatar
            const currentValues = form.getFieldsValue();
            await api.put('/users/profile', { ...currentValues, avatarUrl: response.data.fileUrl });
            
            // Update Auth Context to reflect changes immediately
            updateUser({ avatarUrl: response.data.fileUrl });
            
            onSuccess(response.data);
            message.success('Cập nhật ảnh đại diện thành công');
        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            message.error('Tải ảnh lên thất bại');
        }
    };

    const handleUpdateProfile = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/profile', values);
            message.success('Cập nhật thông tin thành công');
            
            // Update Auth Context
            updateUser({ 
                fullName: values.fullName,
                // Add other fields if they are in the user object (like email/role which usually don't change here)
            });
            
            fetchProfile();
        } catch (error) {
            message.error('Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            await api.post('/users/change-password', values);
            message.success('Đổi mật khẩu thành công');
            passwordForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: (
                <div className="flex items-center gap-2 px-2">
                    <User size={18} />
                    <span className="font-semibold">Thông tin cá nhân</span>
                </div>
            ),
            children: (
                <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                        <div className="relative">
                            <Avatar 
                                size={100} 
                                src={avatarUrl}
                                className="border-4 border-white shadow-lg"
                                style={{ backgroundColor: '#3b82f6' }}
                            >
                                {!avatarUrl && <span className="text-3xl font-bold">{profile?.fullName?.charAt(0) || 'U'}</span>}
                            </Avatar>
                            <Upload
                                customRequest={handleUpload}
                                showUploadList={false}
                                accept="image/*"
                                className="absolute bottom-0 right-0"
                            >
                                <Button 
                                    shape="circle" 
                                    size="small"
                                    icon={<Camera size={14} />} 
                                    className="border-none shadow-md flex items-center justify-center bg-white text-slate-600 hover:text-blue-600"
                                />
                            </Upload>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">{profile?.fullName || 'User'}</h3>
                            <p className="text-slate-600 font-medium">{profile?.email}</p>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                <Shield size={14} />
                                {user?.role === 'ADMIN' ? 'Quản trị viên' : 
                                 user?.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Khách hàng'}
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        size="large"
                    >
                        <Form.Item name="avatarUrl" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <User size={18} className="text-blue-600" />
                                    Họ và tên
                                </span>
                            }
                            name="fullName"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                        >
                            <Input 
                                placeholder="Nguyễn Văn A"
                                className="rounded-xl"
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Mail size={18} className="text-blue-600" />
                                    Email
                                </span>
                            }
                            name="email"
                        >
                            <Input 
                                disabled 
                                className="rounded-xl bg-slate-50"
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Phone size={18} className="text-blue-600" />
                                    Số điện thoại
                                </span>
                            }
                            name="phone"
                        >
                            <Input 
                                placeholder="0912 345 678"
                                className="rounded-xl"
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <MapPin size={18} className="text-blue-600" />
                                    Địa chỉ
                                </span>
                            }
                            name="address"
                        >
                            <Input.TextArea 
                                rows={3} 
                                placeholder="Số nhà, đường, quận/huyện, thành phố"
                                className="rounded-xl"
                            />
                        </Form.Item>
                        
                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Cập nhật thông tin
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div className="flex items-center gap-2 px-2">
                    <Lock size={18} />
                    <span className="font-semibold">Đổi mật khẩu</span>
                </div>
            ),
            children: (
                <div className="space-y-6">
                    {/* Security Info */}
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Bảo mật tài khoản</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Thay đổi mật khẩu thường xuyên giúp bảo vệ tài khoản của bạn tốt hơn. 
                                    Sử dụng mật khẩu mạnh với ít nhất 6 ký tự.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Password Form */}
                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handleChangePassword}
                        size="large"
                    >
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Lock size={18} className="text-purple-600" />
                                    Mật khẩu hiện tại
                                </span>
                            }
                            name="oldPassword"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                        >
                            <Input.Password 
                                placeholder="Nhập mật khẩu hiện tại"
                                className="rounded-xl"
                                iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Lock size={18} className="text-purple-600" />
                                    Mật khẩu mới
                                </span>
                            }
                            name="newPassword"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                            ]}
                        >
                            <Input.Password 
                                placeholder="Nhập mật khẩu mới"
                                className="rounded-xl"
                                iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={
                                <span className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Lock size={18} className="text-purple-600" />
                                    Xác nhận mật khẩu mới
                                </span>
                            }
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password 
                                placeholder="Nhập lại mật khẩu mới"
                                className="rounded-xl"
                                iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                            />
                        </Form.Item>
                        
                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Đổi mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ];

    if (user?.role === 'TECHNICIAN') {
        return <Navigate to="/technician/profile" replace />;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Quản lý hồ sơ</h1>
                <p className="text-slate-600 text-lg">Cập nhật thông tin cá nhân và bảo mật tài khoản</p>
            </div>

            <Card bordered={false} className="shadow-2xl rounded-3xl border-0">
                <Tabs 
                    defaultActiveKey="1" 
                    items={items}
                    size="large"
                    className="profile-tabs"
                />
            </Card>

            {/* Custom Styles */}
            <style jsx>{`
                :global(.profile-tabs .ant-tabs-tab) {
                    padding: 12px 8px;
                    font-size: 16px;
                    transition: all 0.3s;
                }
                :global(.profile-tabs .ant-tabs-tab:hover) {
                    color: #3b82f6;
                }
                :global(.profile-tabs .ant-tabs-tab-active) {
                    color: #2563eb !important;
                }
                :global(.profile-tabs .ant-tabs-ink-bar) {
                    background: linear-gradient(to right, #3b82f6, #06b6d4);
                    height: 3px;
                    border-radius: 3px 3px 0 0;
                }
            `}</style>
        </div>
    );
};

export default ProfilePage;
