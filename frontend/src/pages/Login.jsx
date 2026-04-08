import { useState } from 'react';
import { Form, Input, Button, Alert, Checkbox } from 'antd';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthProviderButtons from '../components/AuthProviderButtons';

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user) {
        return <Navigate to="/" replace />;
    }

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        try {
            const userData = await login(values.email, values.password);
            if (userData.role === 'TECHNICIAN') {
                navigate('/technician/dashboard');
            } else if (userData.role === 'ADMIN') {
                navigate('/admin/dispatch');
            } else {
                navigate('/');
            }
        } catch (loginError) {
            setError(loginError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-12">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50">
                <div className="absolute left-20 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-400/20 blur-3xl" />
                <div
                    className="absolute bottom-20 right-20 h-96 w-96 animate-pulse rounded-full bg-cyan-400/20 blur-3xl"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row">
                <div className="relative hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 md:block md:w-1/2">
                    <img
                        src="https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800"
                        alt="Login Visual"
                        className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(event) => {
                            event.target.onerror = null;
                            event.target.src = 'https://placehold.co/800x600/png?text=HomeFix+Login';
                        }}
                    />

                    <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
                        <div className="mb-12">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
                                <span className="text-3xl font-black">HF</span>
                            </div>
                            <h1 className="mb-2 text-4xl font-black">HomeFix</h1>
                            <p className="text-lg text-cyan-200">Chăm sóc ngôi nhà của bạn</p>
                        </div>

                        <div className="space-y-6">
                            <h2 className="mb-8 text-3xl font-bold">Chào mừng trở lại!</h2>
                            <p className="text-lg leading-relaxed text-cyan-100">
                                Đăng nhập để truy cập hệ thống HomeFix, quản lý công việc và dịch vụ tiện ích nhanh hơn.
                            </p>

                            <div className="space-y-4 pt-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Quản lý hiệu quả</h3>
                                        <p className="text-sm text-cyan-200">Theo dõi tiến độ và trạng thái công việc rõ ràng.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Kết nối nhanh chóng</h3>
                                        <p className="text-sm text-cyan-200">Đăng nhập bằng email, Google hoặc GitHub chỉ trong vài giây.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Hỗ trợ 24/7</h3>
                                        <p className="text-sm text-cyan-200">Luôn sẵn sàng hỗ trợ nếu bạn cần truy cập lại tài khoản.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 md:w-1/2 md:p-12">
                    <div className="mx-auto max-w-md">
                        <div className="mb-10">
                            <h2 className="mb-3 text-4xl font-black text-slate-900">Đăng nhập</h2>
                            <p className="text-lg text-slate-600">Nhập thông tin tài khoản để tiếp tục.</p>
                        </div>

                        {error && (
                            <Alert
                                message="Lỗi đăng nhập"
                                description={error}
                                type="error"
                                showIcon
                                className="mb-6 rounded-2xl"
                            />
                        )}

                        <Form name="login" layout="vertical" onFinish={onFinish} size="large" className="space-y-2">
                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Email</span>}
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email.' },
                                    { type: 'email', message: 'Email không hợp lệ.' },
                                ]}
                            >
                                <Input
                                    data-testid="login-email"
                                    prefix={<Mail className="mr-2 text-slate-400" size={20} />}
                                    placeholder="example@email.com"
                                    className="rounded-xl border-slate-200 py-3 hover:border-blue-400 focus:border-blue-500"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Mật khẩu</span>}
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
                            >
                                <Input.Password
                                    data-testid="login-password"
                                    prefix={<Lock className="mr-2 text-slate-400" size={20} />}
                                    placeholder="••••••••"
                                    className="rounded-xl border-slate-200 py-3 hover:border-blue-400 focus:border-blue-500"
                                    iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                                />
                            </Form.Item>

                            <div className="flex items-center justify-between py-2">
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox className="font-medium text-slate-600">Ghi nhớ đăng nhập</Checkbox>
                                </Form.Item>
                                <Link to="/forgot-password" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <Form.Item className="mb-4 pt-4">
                                <Button
                                    data-testid="login-submit"
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="h-14 rounded-xl border-none bg-gradient-to-r from-blue-600 to-cyan-500 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-cyan-600 hover:shadow-xl"
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 font-medium text-slate-500">Hoặc tiếp tục với</span>
                                </div>
                            </div>

                            <AuthProviderButtons />

                            <div className="mt-8 text-center">
                                <span className="text-slate-600">Bạn chưa có tài khoản? </span>
                                <Link to="/register" className="ml-1 font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
