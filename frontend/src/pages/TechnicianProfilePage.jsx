import { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Avatar, Upload, Select, InputNumber, Switch, Alert } from 'antd';
import { User, Mail, Phone, MapPin, Lock, Shield, Eye, EyeOff, Camera, Briefcase, Clock, Layers, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

const TechnicianProfilePage = () => {
    const { user, updateUser, refreshUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [savingTechnicianProfile, setSavingTechnicianProfile] = useState(false);
    const [profile, setProfile] = useState(null);
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [categories, setCategories] = useState([]);
    const [mainTechnicians, setMainTechnicians] = useState([]);
    const [accountForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [technicianForm] = Form.useForm();
    const selectedTechnicianType = Form.useWatch('technicianType', technicianForm);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, technicianRes, categoriesRes, techniciansRes] = await Promise.all([
                api.get('/users/profile'),
                api.get('/users/technician/profile'),
                api.get('/categories'),
                api.get('/users/technicians')
            ]);

            const accountProfile = profileRes.data || {};
            const technicianData = technicianRes.data || {};
            const technicianList = techniciansRes.data || [];

            setProfile(accountProfile);
            setTechnicianProfile(technicianData);
            setAvatarUrl(accountProfile.avatarUrl);
            setCategories(categoriesRes.data || []);
            setMainTechnicians(
                technicianList.filter((tech) => tech.technicianType === 'MAIN' && tech.id !== technicianData.id)
            );

            accountForm.setFieldsValue(accountProfile);
            technicianForm.setFieldsValue({
                specialty: technicianData.specialty,
                experienceYears: technicianData.experienceYears,
                workDescription: technicianData.workDescription,
                citizenId: technicianData.citizenId,
                technicianType: technicianData.technicianType || 'ASSISTANT',
                supervisingTechnicianId: technicianData.supervisingTechnicianId || undefined,
                categoryIds: technicianData.categoryIds || [],
                baseLocation: technicianData.baseLocation,
                availableFrom: technicianData.availableFrom,
                availableTo: technicianData.availableTo,
                availableForAutoAssign: technicianData.availableForAutoAssign ?? true
            });

            updateUser({
                fullName: accountProfile.fullName,
                avatarUrl: accountProfile.avatarUrl,
                role: accountProfile.role,
                email: accountProfile.email,
                id: accountProfile.id,
                technicianProfileCompleted: technicianData.technicianProfileCompleted,
                technicianType: technicianData.technicianType,
                technicianApprovalStatus: technicianData.technicianApprovalStatus
            });
        } catch (error) {
            console.error(error);
            message.error('Không thể tải hồ sơ kỹ thuật viên');
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAvatarUrl(response.data.fileUrl);
            accountForm.setFieldValue('avatarUrl', response.data.fileUrl);

            const currentValues = accountForm.getFieldsValue();
            await api.put('/users/profile', { ...currentValues, avatarUrl: response.data.fileUrl });
            updateUser({ avatarUrl: response.data.fileUrl });

            onSuccess(response.data);
            message.success('Cập nhật ảnh đại diện thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            onError(error);
            message.error('Tải ảnh lên thất bại');
        }
    };

    const handleUpdateProfile = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/profile', values);
            updateUser({ fullName: values.fullName });
            message.success('Cập nhật thông tin cá nhân thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Cập nhật thông tin thất bại');
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
            console.error(error);
            message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTechnicianProfile = async (values) => {
        setSavingTechnicianProfile(true);
        try {
            const normalizedTime = (value) => {
                if (!value) return null;
                if (/^\d{2}:\d{2}$/.test(value)) {
                    return `${value}:00`;
                }
                return value;
            };

            const payload = {
                ...values,
                baseLocation: values.baseLocation?.trim(),
                availableFrom: normalizedTime(values.availableFrom),
                availableTo: normalizedTime(values.availableTo),
                supervisingTechnicianId: values.technicianType === 'ASSISTANT'
                    ? Number(values.supervisingTechnicianId)
                    : null,
                categoryIds: (Array.isArray(values.categoryIds) ? values.categoryIds : [values.categoryIds])
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            };

            if (!payload.categoryIds.length) {
                message.error('Vui lòng chọn ít nhất 1 chuyên mục kỹ thuật');
                return;
            }

            if (values.technicianType === 'ASSISTANT' && !payload.supervisingTechnicianId) {
                message.error('Vui lòng chọn thợ chính phụ trách');
                return;
            }

            await api.put('/users/technician/profile', payload);
            await refreshUserProfile();
            message.success('Cập nhật hồ sơ kỹ thuật viên thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Cập nhật hồ sơ kỹ thuật viên thất bại');
        } finally {
            setSavingTechnicianProfile(false);
        }
    };

    const approvalMeta = useMemo(() => {
        switch (technicianProfile?.technicianApprovalStatus) {
            case 'APPROVED':
                return { type: 'success', message: 'Hồ sơ kỹ thuật viên đã được duyệt và sẵn sàng nhận việc.' };
            case 'REJECTED':
                return { type: 'error', message: 'Hồ sơ kỹ thuật viên chưa được duyệt. Hãy cập nhật lại thông tin.' };
            case 'PENDING':
                return { type: 'info', message: 'Hồ sơ kỹ thuật viên đang chờ admin duyệt.' };
            default:
                return { type: 'warning', message: 'Hãy hoàn tất hồ sơ kỹ thuật viên để hệ thống tự động điều phối đơn.' };
        }
    }, [technicianProfile?.technicianApprovalStatus]);

    const items = [
        {
            key: 'account',
            label: (
                <div className="flex items-center gap-2 px-2">
                    <User size={18} />
                    <span className="font-semibold">Tài khoản</span>
                </div>
            ),
            children: (
                <div className="space-y-6">
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                        <div className="relative">
                            <Avatar
                                size={100}
                                src={avatarUrl}
                                className="border-4 border-white shadow-lg"
                                style={{ backgroundColor: '#3b82f6' }}
                            >
                                {!avatarUrl && <span className="text-3xl font-bold">{profile?.fullName?.charAt(0) || 'T'}</span>}
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
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">{profile?.fullName || 'Kỹ thuật viên'}</h3>
                            <p className="text-slate-600 font-medium">{profile?.email}</p>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                <Shield size={14} />
                                Kỹ thuật viên
                            </div>
                        </div>
                    </div>

                    <Form
                        form={accountForm}
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
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input placeholder="Nguyễn Văn A" className="rounded-xl" />
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
                            <Input disabled className="rounded-xl bg-slate-50" />
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
                            <Input placeholder="0912 345 678" className="rounded-xl" />
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
                            <Input.TextArea rows={3} placeholder="Số nhà, đường, quận/huyện, thành phố" className="rounded-xl" />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Cập nhật tài khoản
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            )
        },
        {
            key: 'technician',
            label: (
                <div className="flex items-center gap-2 px-2">
                    <Briefcase size={18} />
                    <span className="font-semibold">Hồ sơ kỹ thuật viên</span>
                </div>
            ),
            children: (
                <div className="space-y-6">
                    <Alert type={approvalMeta.type} message={approvalMeta.message} showIcon />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Loại thợ</div>
                            <div className="font-bold text-slate-900">
                                {technicianProfile?.technicianType === 'MAIN' ? 'Thợ chính' : technicianProfile?.technicianType === 'ASSISTANT' ? 'Thợ phụ' : 'Chưa chọn'}
                            </div>
                        </Card>
                        <Card className="rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Trạng thái hồ sơ</div>
                            <div className="font-bold text-slate-900">
                                {technicianProfile?.technicianProfileCompleted ? 'Đã hoàn tất' : 'Chưa hoàn tất'}
                            </div>
                        </Card>
                        <Card className="rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Tự động nhận đơn</div>
                            <div className="font-bold text-slate-900">
                                {technicianProfile?.availableForAutoAssign ? 'Đang bật' : 'Đang tắt'}
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>
                            Làm mới dữ liệu
                        </Button>
                    </div>

                    <Form
                        form={technicianForm}
                        layout="vertical"
                        onFinish={handleUpdateTechnicianProfile}
                    >
                        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                            Hồ sơ này dành riêng cho kỹ thuật viên, không dùng chung với hồ sơ khách hàng.
                        </div>
                        <Form.Item name="specialty" label="Thợ làm gì" rules={[{ required: true, message: 'Vui lòng nhập chuyên môn' }]}>
                            <Input placeholder="Ví dụ: Thợ điện máy" />
                        </Form.Item>
                        <Form.Item
                            name="categoryIds"
                            label={
                                <span className="flex items-center gap-2">
                                    <Layers size={16} />
                                    Chuyên mục nhận việc
                                </span>
                            }
                            rules={[{ required: true, message: 'Vui lòng chọn chuyên mục' }]}
                        >
                            <Select mode="multiple" placeholder="Chọn chuyên mục phù hợp">
                                {categories.map((category) => (
                                    <Option key={category.id} value={category.id}>{category.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="experienceYears" label="Kinh nghiệm (năm)" rules={[{ required: true, message: 'Vui lòng nhập số năm kinh nghiệm' }]}>
                            <InputNumber className="w-full" min={0} max={60} />
                        </Form.Item>
                        <Form.Item name="workDescription" label="Mô tả công việc chi tiết" rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc' }]}>
                            <Input.TextArea rows={4} placeholder="Ví dụ: rửa điều hòa, bơm khí điều hòa..." />
                        </Form.Item>
                        <Form.Item name="citizenId" label="Số CCCD" rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
                            <Input placeholder="Nhập số căn cước công dân" />
                        </Form.Item>
                        <Form.Item name="technicianType" label="Loại thợ" rules={[{ required: true, message: 'Vui lòng chọn loại thợ' }]}>
                            <Select>
                                <Option value="MAIN">Thợ chính</Option>
                                <Option value="ASSISTANT">Thợ phụ</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="baseLocation" label="Khu vực làm việc chính" rules={[{ required: true, message: 'Vui lòng nhập khu vực làm việc' }]}>
                            <Input placeholder="Ví dụ: Cầu Giấy, Hà Nội" />
                        </Form.Item>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                name="availableFrom"
                                label={
                                    <span className="flex items-center gap-2">
                                        <Clock size={16} />
                                        Bắt đầu ca
                                    </span>
                                }
                                rules={[{ required: true, message: 'Nhập giờ bắt đầu' }]}
                            >
                                <Input placeholder="08:00" />
                            </Form.Item>
                            <Form.Item
                                name="availableTo"
                                label={
                                    <span className="flex items-center gap-2">
                                        <Clock size={16} />
                                        Kết thúc ca
                                    </span>
                                }
                                rules={[{ required: true, message: 'Nhập giờ kết thúc' }]}
                            >
                                <Input placeholder="18:00" />
                            </Form.Item>
                        </div>
                        <Form.Item name="availableForAutoAssign" label="Nhận phân công tự động" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        {selectedTechnicianType === 'ASSISTANT' && (
                            <Form.Item
                                name="supervisingTechnicianId"
                                label="Thợ chính phụ trách"
                                rules={[{ required: true, message: 'Vui lòng chọn thợ chính phụ trách' }]}
                            >
                                <Select
                                    placeholder="Chọn thợ chính"
                                    options={mainTechnicians.map((tech) => ({
                                        value: tech.id,
                                        label: `${tech.fullName} - ${tech.categoryNames?.join(', ') || 'Chưa có chuyên mục'}`
                                    }))}
                                />
                            </Form.Item>
                        )}
                        {selectedTechnicianType === 'ASSISTANT' && (
                            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                                Thợ phụ vẫn có thể tự nhận đơn đúng chuyên mục của mình. Sau 1 tháng, hệ thống sẽ tự động nâng cấp lên thợ chính.
                            </div>
                        )}
                        <Button type="primary" htmlType="submit" className="w-full" loading={savingTechnicianProfile}>
                            Lưu hồ sơ kỹ thuật viên
                        </Button>
                    </Form>
                </div>
            )
        },
        {
            key: 'password',
            label: (
                <div className="flex items-center gap-2 px-2">
                    <Lock size={18} />
                    <span className="font-semibold">Đổi mật khẩu</span>
                </div>
            ),
            children: (
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Bảo mật tài khoản</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Thay đổi mật khẩu thường xuyên giúp bảo vệ tài khoản tốt hơn. Hãy dùng mật khẩu mạnh với ít nhất 6 ký tự.
                                </p>
                            </div>
                        </div>
                    </div>

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
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
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
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
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
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                    }
                                })
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
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Hồ sơ kỹ thuật viên</h1>
                <p className="text-slate-600 text-lg">Quản lý riêng thông tin tài khoản và cấu hình nhận việc</p>
            </div>

            <Card bordered={false} className="shadow-2xl rounded-3xl border-0">
                <Tabs
                    defaultActiveKey="account"
                    items={items}
                    size="large"
                    className="profile-tabs"
                />
            </Card>

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

export default TechnicianProfilePage;
