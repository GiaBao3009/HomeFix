import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Lock, Mail, Chrome, Eye, EyeOff } from 'lucide-react';

const { Title, Text } = Typography;

const Login = () => {
    const [form] = Form.useForm();
    const { login, user } = useAuth(); // Get user from context
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // If already logged in, redirect to Home (which handles role-based redirection)
    if (user) {
        return <Navigate to="/" replace />;
    }

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        const success = await login(values.email, values.password);
        setLoading(false);
        if (success) {
            navigate('/');
        } else {
            setError('Email hoặc mật khẩu không chính xác');
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50">
                <div className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse bg-blue-400/20"></div>
                <div className="absolute right-20 bottom-20 w-96 h-96 rounded-full blur-3xl animate-pulse bg-cyan-400/20" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="flex overflow-hidden relative flex-col w-full max-w-5xl bg-white rounded-3xl shadow-2xl md:flex-row">
                {/* Left Side - Image/Branding */}
                <div className="hidden relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 md:w-1/2 md:block">
                    <img
                        src="https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800"
                        alt="Login Visual"
                        className="object-cover absolute inset-0 w-full h-full opacity-20 mix-blend-overlay"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/800x600/png?text=HomeFix+Login';
                        }}
                    />
                    
                    <div className="flex absolute inset-0 flex-col justify-center p-12 text-white">
                        {/* Logo/Brand */}
                        <div className="mb-12">
                            <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-2xl shadow-lg backdrop-blur-sm bg-white/20">
                                <span className="text-3xl font-black">HF</span>
                            </div>
                            <h1 className="mb-2 text-4xl font-black">HomeFix</h1>
                            <p className="text-lg text-cyan-200">Chăm sóc ngôi nhà của bạn</p>
                        </div>

                        {/* Features */}
                        <div className="space-y-6">
                            <h2 className="mb-8 text-3xl font-bold">Chào mừng trở lại!</h2>
                            <p className="text-lg leading-relaxed text-cyan-100">
                                Đăng nhập để truy cập hệ thống HomeFix, quản lý công việc và dịch vụ tiện ích.
                            </p>
                            
                            <div className="pt-8 space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Quản lý hiệu quả</h3>
                                        <p className="text-sm text-cyan-200">Theo dõi tiến độ và trạng thái công việc</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Kết nối nhanh chóng</h3>
                                        <p className="text-sm text-cyan-200">Hệ thống phản hồi tức thì</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full backdrop-blur-sm bg-white/20">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Hỗ trợ 24/7</h3>
                                        <p className="text-sm text-cyan-200">Luôn sẵn sàng hỗ trợ bạn</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 bg-white md:w-1/2 md:p-12">
                    <div className="mx-auto max-w-md">
                        <div className="mb-10">
                            <h2 className="mb-3 text-4xl font-black text-slate-900">Đăng nhập</h2>
                            <p className="text-lg text-slate-600">Nhập thông tin đăng nhập của bạn</p>
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

                        <Form
                            name="login"
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

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Mật khẩu</span>}
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                            >
                                <Input.Password 
                                    prefix={<Lock className="mr-2 text-slate-400" size={20} />} 
                                    placeholder="••••••••" 
                                    className="py-3 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
                                    iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                                />
                            </Form.Item>

                            <div className="flex justify-between items-center py-2">
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox className="font-medium text-slate-600">
                                        Ghi nhớ đăng nhập
                                    </Checkbox>
                                </Form.Item>
                                <Link to="/forgot-password" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <Form.Item className="pt-4 mb-4">
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    loading={loading}
                                    className="h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>

                            <div className="relative my-8">
                                <div className="flex absolute inset-0 items-center">
                                    <span className="w-full border-t border-slate-200" />
                                </div>
                                <div className="flex relative justify-center text-sm">
                                    <span className="px-4 font-medium bg-white text-slate-500">Hoặc tiếp tục với</span>
                                </div>
                            </div>

                            <Button 
                                block
                                size="large"
                                className="flex gap-3 justify-center items-center py-3 h-14 rounded-xl border-2 transition-all border-slate-200 hover:border-slate-300 hover:bg-slate-50 group"
                                onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span className="font-semibold text-slate-700 group-hover:text-slate-900">Đăng nhập với Google</span>
                            </Button>

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
