import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/forgot-password', { email: values.email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">

            <div className="flex overflow-hidden flex-col w-full max-w-5xl bg-white rounded-3xl shadow-2xl md:flex-row">
                {/* Left Side - Visual */}
                <div className="hidden relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 md:w-1/2 md:block">
                    <img
                        src="https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800"
                        alt="Forgot Password Visual"
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
                            <h2 className="mb-8 text-3xl font-bold">Quên mật khẩu?</h2>
                            <p className="text-lg leading-relaxed text-cyan-100">
                                Đừng lo lắng! Chỉ cần nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn link để đặt lại mật khẩu.
                            </p>
                            <div className="pt-8 space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <span className="text-xl">📧</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Nhập email</h3>
                                        <p className="text-sm text-cyan-200">Nhập email bạn đã dùng để đăng ký</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <span className="text-xl">🔗</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Nhận link</h3>
                                        <p className="text-sm text-cyan-200">Kiểm tra hộp thư để lấy link đặt lại</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <span className="text-xl">🔒</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Đặt mật khẩu mới</h3>
                                        <p className="text-sm text-cyan-200">Tạo mật khẩu mới an toàn cho tài khoản</p>
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
                                    <h2 className="mb-3 text-4xl font-black text-slate-900">Quên mật khẩu</h2>
                                    <p className="text-lg text-slate-600">Nhập email để nhận link đặt lại mật khẩu</p>
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
                                    name="forgotPassword"
                                    layout="vertical"
                                    onFinish={onFinish}
                                    size="large"
                                    className="space-y-2"
                                >
                                    <Form.Item
                                        label={<span className="font-semibold text-slate-700">Email</span>}
                                        name="email"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email!' },
                                            { type: 'email', message: 'Email không hợp lệ!' }
                                        ]}
                                    >
                                        <Input
                                            prefix={<Mail className="mr-2 text-slate-400" size={20} />}
                                            placeholder="example@email.com"
                                            className="py-3 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
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
                                            Gửi link đặt lại mật khẩu
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </>
                        ) : (
                            <div className="text-center animate-fadeInUp">
                                <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-green-50">
                                    <CheckCircle className="text-green-500" size={48} />
                                </div>
                                <h2 className="mb-3 text-3xl font-black text-slate-900">Đã gửi email!</h2>
                                <p className="mb-2 text-lg text-slate-600">
                                    Chúng tôi đã gửi link đặt lại mật khẩu vào email của bạn.
                                </p>
                                <p className="mb-8 text-sm text-slate-400">
                                    Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam). Link sẽ hết hạn sau 15 phút.
                                </p>
                                <Button
                                    type="default"
                                    size="large"
                                    onClick={() => { setSuccess(false); form.resetFields(); }}
                                    className="mr-3 rounded-xl border-slate-200"
                                >
                                    Gửi lại
                                </Button>
                                <Link to="/login">
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 border-none"
                                    >
                                        Về trang đăng nhập
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
