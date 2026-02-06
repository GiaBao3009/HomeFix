import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Skeleton } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useContent from '../hooks/useContent';
import { User, Mail, Lock, Phone, Eye, EyeOff, Sparkles, Clock, ShieldCheck, CreditCard } from 'lucide-react';

const { Title, Text } = Typography;

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { content: pageContent, loading: contentLoading } = useContent('REGISTER');

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        const success = await register(values);
        setLoading(false);
        if (success) {
            navigate('/');
        } else {
            setError('Đăng ký thất bại. Email có thể đã tồn tại.');
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-400/20"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse bg-pink-400/20" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="flex overflow-hidden relative flex-col w-full max-w-5xl bg-white rounded-3xl shadow-2xl md:flex-row-reverse">
                {/* Right Side - Image/Branding */}
                <div className="hidden relative bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 md:w-1/2 md:block">
                    <img 
                        src="https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=800" 
                        alt="Register Visual" 
                        className="object-cover absolute inset-0 w-full h-full opacity-20 mix-blend-overlay"
                    />
                    
                    <div className="flex absolute inset-0 flex-col justify-center p-12 text-white">
                        {/* Animated badge */}
                        <div className="inline-flex gap-2 items-center px-4 py-2 mb-8 rounded-full backdrop-blur-sm bg-white/20 w-fit">
                            <Sparkles size={16} />
                            <span className="text-sm font-bold">Tham gia 15,000+ khách hàng</span>
                        </div>

                        <h2 className="mb-6 text-5xl font-black leading-tight">
                            Tham gia<br/>HomeFix
                        </h2>
                        
                        <p className="mb-12 text-xl leading-relaxed text-pink-100">
                            Trải nghiệm dịch vụ sửa chữa tại nhà chuyên nghiệp nhất. 
                            Kết nối với hàng nghìn thợ lành nghề ngay hôm nay.
                        </p>
                        
                        {/* Benefits */}
                        <div className="space-y-6">
                            {contentLoading ? (
                                <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 items-center">
                                            <Skeleton.Avatar active shape="square" size="large" />
                                            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 100 }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {Array.isArray(pageContent?.benefit) && pageContent.benefit.map((item, index) => {
                                        // Map icons based on index or title keywords
                                        const getIcon = (idx) => {
                                            if (idx === 0) return <Clock className="w-6 h-6" />;
                                            if (idx === 1) return <CreditCard className="w-6 h-6" />;
                                            return <ShieldCheck className="w-6 h-6" />;
                                        };

                                        return (
                                            <div key={item.id || index} className="flex gap-4 items-center">
                                                <div className="flex flex-shrink-0 justify-center items-center w-12 h-12 rounded-2xl backdrop-blur-sm bg-white/20">
                                                    {getIcon(index)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">{item.title}</h3>
                                                    <p className="text-sm text-pink-200">{item.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Left Side - Form */}
                <div className="p-8 bg-white md:w-1/2 md:p-12">
                    <div className="mx-auto max-w-md">
                        <div className="mb-10">
                            <h2 className="mb-3 text-4xl font-black text-slate-900">Tạo tài khoản</h2>
                            <p className="text-lg text-slate-600">Điền thông tin để bắt đầu</p>
                        </div>

                        {error && (
                            <Alert
                                message="Lỗi đăng ký"
                                description={error}
                                type="error"
                                showIcon
                                className="mb-6 rounded-2xl"
                            />
                        )}

                        <Form 
                            layout="vertical" 
                            onFinish={onFinish}
                            size="large"
                            className="space-y-1"
                        >
                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Họ và tên</span>}
                                name="fullName"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                                <Input 
                                    prefix={<User className="mr-2 text-slate-400" size={20} />}
                                    placeholder="Nguyễn Văn A" 
                                    className="py-3 rounded-xl border-slate-200 hover:border-purple-400 focus:border-purple-500"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Email</span>}
                                name="email"
                                rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}
                            >
                                <Input 
                                    prefix={<Mail className="mr-2 text-slate-400" size={20} />}
                                    placeholder="example@email.com" 
                                    className="py-3 rounded-xl border-slate-200 hover:border-purple-400 focus:border-purple-500"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Mật khẩu</span>}
                                name="password"
                                rules={[{ required: true, min: 6, message: 'Mật khẩu ít nhất 6 ký tự!' }]}
                            >
                                <Input.Password 
                                    prefix={<Lock className="mr-2 text-slate-400" size={20} />}
                                    placeholder="••••••••" 
                                    className="py-3 rounded-xl border-slate-200 hover:border-purple-400 focus:border-purple-500"
                                    iconRender={(visible) => (visible ? <Eye size={20} /> : <EyeOff size={20} />)}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Số điện thoại</span>}
                                name="phone"
                            >
                                <Input 
                                    prefix={<Phone className="mr-2 text-slate-400" size={20} />}
                                    placeholder="0912 345 678" 
                                    className="py-3 rounded-xl border-slate-200 hover:border-purple-400 focus:border-purple-500"
                                />
                            </Form.Item>

                            <Form.Item className="pt-4 mb-4">
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    loading={loading}
                                    className="h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Tạo tài khoản
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
                                className="flex gap-3 justify-center items-center h-14 font-semibold rounded-xl border-2 transition-all text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 group"
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
                                <span className="group-hover:text-slate-900">Đăng ký với Google</span>
                            </Button>

                            <div className="mt-8 text-center">
                                <span className="text-slate-600">Đã có tài khoản? </span>
                                <Link to="/login" className="ml-1 font-bold text-purple-600 transition-colors hover:text-purple-700 hover:underline">
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;