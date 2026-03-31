import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';

const ResetPassword = () => {
    const [form] = Form.useForm();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    const onFinish = async (values) => {
        if (!token) {
            setError('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu gửi lại.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/reset-password', {
                token: token,
                newPassword: values.newPassword,
            });
            setSuccess(true);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Có lỗi xảy ra. Token có thể đã hết hạn.'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
                <div className="p-12 text-center bg-white shadow-2xl rounded-3xl max-w-md">
                    <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-red-50">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="mb-3 text-2xl font-black text-slate-900">Link không hợp lệ</h2>
                    <p className="mb-6 text-slate-600">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
                    <Link to="/forgot-password">
                        <Button type="primary" size="large" className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 border-none">
                            Yêu cầu link mới
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">

            <div className="flex overflow-hidden flex-col w-full max-w-5xl bg-white rounded-3xl shadow-2xl md:flex-row">
                {/* Left Side - Visual */}
                <div className="hidden relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 md:w-1/2 md:block">
                    <img
                        src="https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800"
                        alt="Reset Password Visual"
                        className="object-cover absolute inset-0 w-full h-full opacity-20 mix-blend-overlay"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/800x600/png?text=HomeFix';
                        }}
                    />
                    <div className="flex flex-col justify-center p-12 text-white">
                        <div className="mb-12">
                            <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-2xl shadow-lg backdrop-blur-sm bg-white/20">
                                <span className="text-3xl font-black">HF</span>
                            </div>
                            <h1 className="mb-2 text-4xl font-black">HomeFix</h1>
                            <p className="text-lg text-cyan-200">Chăm sóc ngôi nhà của bạn</p>
                        </div>

                        <div className="space-y-6">
                            <h2 className="mb-8 text-3xl font-bold">Đặt lại mật khẩu</h2>
                            <p className="text-lg leading-relaxed text-cyan-100">
                                Tạo mật khẩu mới an toàn cho tài khoản của bạn. Mật khẩu nên có ít nhất 6 ký tự.
                            </p>
                            <div className="pt-8 space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Bảo mật cao</h3>
                                        <p className="text-sm text-cyan-200">Sử dụng mật khẩu mạnh để bảo vệ tài khoản</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Đơn giản & Nhanh chóng</h3>
                                        <p className="text-sm text-cyan-200">Chỉ cần nhập mật khẩu mới và xác nhận</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 bg-white md:w-1/2 md:p-16">
                    <div className="mx-auto max-w-md">
                        <Link
                            to="/login"
                            className="inline-flex gap-2 items-center mb-8 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                        >
                            <ArrowLeft size={16} />
                            Quay lại đăng nhập
                        </Link>

                        {!success ? (
                            <>
                                <div className="mb-10">
                                    <h2 className="mb-3 text-4xl font-black text-slate-900">Mật khẩu mới</h2>
                                    <p className="text-lg text-slate-600">Nhập mật khẩu mới cho tài khoản của bạn</p>
                                </div>

                                {error && (
                                    <Alert
                                        message="Lỗi"
                                        description={error}
                                        type="error"
                                        showIcon
                                        className="mb-6 rounded-2xl"
                                        closable
                                        onClose={() => setError(null)}
                                    />
                                )}

                                <Form
                                    form={form}
                                    name="resetPassword"
                                    layout="vertical"
                                    onFinish={onFinish}
                                    size="large"
                                    className="space-y-2"
                                >
                                    <Form.Item
                                        label={<span className="font-semibold text-slate-700">Mật khẩu mới</span>}
                                        name="newPassword"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<Lock className="mr-2 text-slate-400" size={20} />}
                                            placeholder="Nhập mật khẩu mới"
                                            className="py-3 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
                                            iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="font-semibold text-slate-700">Xác nhận mật khẩu</span>}
                                        name="confirmPassword"
                                        dependencies={['newPassword']}
                                        rules={[
                                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
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
                                            prefix={<Lock className="mr-2 text-slate-400" size={20} />}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="py-3 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
                                            iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                                        />
                                    </Form.Item>

                                    <Form.Item className="pt-4 mb-4">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            className="h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                        >
                                            Đặt lại mật khẩu
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </>
                        ) : (
                            <div className="text-center animate-fadeInUp">
                                <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-green-50">
                                    <CheckCircle className="text-green-500" size={48} />
                                </div>
                                <h2 className="mb-3 text-3xl font-black text-slate-900">Thành công!</h2>
                                <p className="mb-8 text-lg text-slate-600">
                                    Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.
                                </p>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    className="h-14 px-12 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 border-none shadow-lg hover:shadow-xl"
                                >
                                    Đăng nhập ngay
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
