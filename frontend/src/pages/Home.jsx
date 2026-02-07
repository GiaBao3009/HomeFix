import { Link, useNavigate } from 'react-router-dom';
import { Button, Rate, Tag, Skeleton } from 'antd';
import { Wrench, Zap, Droplets, CheckCircle, Clock, Shield, ArrowRight, Star, Users, Award, TrendingUp, Heart, LayoutDashboard } from 'lucide-react';
import useContent from '../hooks/useContent';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Home = () => {
    const { content: pageContent, loading: contentLoading } = useContent('HOME');
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services/packages');
                if (Array.isArray(response.data)) {
                    // Get top 3 services or random 3 for "Popular"
                    // For now, just slice the first 3
                    const mappedServices = response.data.slice(0, 3).map(service => ({
                        id: service.id,
                        name: service.name,
                        image: service.imageUrl || "https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800",
                        rating: 5, // Default/Placeholder as backend doesn't support yet
                        reviews: Math.floor(Math.random() * 100) + 50, // Random placeholder
                        price: service.price ? `${service.price.toLocaleString('vi-VN')} đ` : "Liên hệ",
                        tag: "Phổ biến" // Placeholder
                    }));
                    setServices(mappedServices);
                }
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setServicesLoading(false);
            }
        };

        fetchServices();
    }, []);

    const isAdminOrTech = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

    if (isAdminOrTech) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-8 p-12 bg-white rounded-3xl shadow-xl max-w-2xl">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <LayoutDashboard size={48} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-4">
                            Xin chào, {user.fullName || user.username}
                        </h1>
                        <p className="text-xl text-slate-600">
                            Bạn đang đăng nhập với quyền <span className="font-bold text-blue-600">{user.role}</span>.
                            <br/>
                            Vui lòng truy cập trang quản lý để thực hiện công việc.
                        </p>
                    </div>
                    <Button 
                        type="primary" 
                        size="large"
                        className="h-14 px-8 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                        onClick={() => navigate(user.role === 'ADMIN' ? '/admin/dispatch' : '/technician/dashboard')}
                    >
                        Đến trang quản lý
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden pb-20 space-y-32">
            {/* Hero Section - Refined & Modern */}
            <div className="relative rounded-[2rem] overflow-hidden min-h-[600px] flex items-center">
                {contentLoading ? (
                    <div className="flex absolute inset-0 justify-center items-center bg-slate-900">
                        <Skeleton active paragraph={{ rows: 4 }} title={{ width: 400 }} />
                    </div>
                ) : (
                    <>
                        {/* Background with overlay */}
                        <div className="absolute inset-0">
                            <img
                                src={pageContent?.hero_image?.imageUrl || "https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=1600"}
                                alt="HomeFix Hero"
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95"></div>

                            {/* Animated background elements */}
                            <div className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse bg-blue-500/10"></div>
                            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse bg-cyan-500/10" style={{ animationDelay: '1s' }}></div>
                        </div>

                        <div className="relative z-10 px-8 py-16 mx-auto w-full max-w-7xl">
                            <div className="space-y-10 max-w-3xl">
                                {/* Badge */}
                                <div className="inline-flex gap-2 items-center px-4 py-2 text-white rounded-full border backdrop-blur-md bg-white/10 border-white/20">
                                    <Award className="w-4 h-4 text-cyan-400" />
                                    <span className="text-sm font-medium">{pageContent?.hero_badge?.content || "Nền tảng #1 Việt Nam"}</span>
                                </div>

                                {/* Main heading with gradient */}
                                <h1 className="text-6xl font-black leading-tight text-white md:text-7xl">
                                    {pageContent?.hero_title_1?.content || "Chăm sóc ngôi nhà"}
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                                        {pageContent?.hero_title_2?.content || "Trọn vẹn yêu thương"}
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="max-w-2xl text-xl font-light leading-relaxed text-slate-200">
                                    {pageContent?.hero_description?.content || "Đặt lịch thợ lành nghề chuyên nghiệp chỉ trong 30 giây."}
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Link to="/services">
                                        <Button
                                            type="primary"
                                            size="large"
                                            className="px-12 h-16 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl border-none shadow-2xl transition-all duration-300 shadow-blue-500/50 hover:from-blue-700 hover:to-cyan-600 hover:scale-105 hover:shadow-blue-500/70"
                                            icon={<ArrowRight className="ml-2" size={20} />}
                                            iconPosition="end"
                                        >
                                            Đặt dịch vụ ngay
                                        </Button>
                                    </Link>
                                    <Link to="/about">
                                        <Button
                                            size="large"
                                            className="px-10 h-16 text-lg font-bold text-white rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:scale-105"
                                        >
                                            Tìm hiểu thêm
                                        </Button>
                                    </Link>
                                </div>

                                {/* Trust badges */}
                                <div className="flex gap-8 items-center pt-8 text-slate-300">
                                    <div className="flex gap-3 items-center group">
                                        <div className="flex justify-center items-center w-10 h-10 rounded-full transition-transform bg-green-500/20 group-hover:scale-110">
                                            <CheckCircle className="text-green-400" size={20} />
                                        </div>
                                        <span className="font-medium">Thợ xác thực</span>
                                    </div>
                                    <div className="flex gap-3 items-center group">
                                        <div className="flex justify-center items-center w-10 h-10 rounded-full transition-transform bg-blue-500/20 group-hover:scale-110">
                                            <CheckCircle className="text-blue-400" size={20} />
                                        </div>
                                        <span className="font-medium">Giá minh bạch</span>
                                    </div>
                                    <div className="flex gap-3 items-center group">
                                        <div className="flex justify-center items-center w-10 h-10 rounded-full transition-transform bg-purple-500/20 group-hover:scale-110">
                                            <CheckCircle className="text-purple-400" size={20} />
                                        </div>
                                        <span className="font-medium">Bảo hành 30 ngày</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Features - Card Design */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-5xl font-bold text-slate-900">Tại sao chọn HomeFix?</h2>
                    <p className="text-xl text-slate-600">Trải nghiệm dịch vụ đẳng cấp với công nghệ hiện đại</p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {contentLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} active />)
                    ) : (
                        Array.isArray(pageContent?.feature) && pageContent.feature.map((feature, index) => {
                            const getIcon = (iconName) => {
                                if (iconName === 'CLOCK') return <Clock size={36} />;
                                if (iconName === 'SHIELD') return <Shield size={36} />;
                                if (iconName === 'ZAP') return <Zap size={36} />;
                                return <Star size={36} />;
                            };

                            const getStyle = (index) => {
                                const styles = [
                                    { bg: "from-white to-blue-50", border: "border-blue-100", hover: "hover:border-blue-300", iconBg: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/50", blur: "bg-blue-500/5" },
                                    { bg: "from-white to-emerald-50", border: "border-emerald-100", hover: "hover:border-emerald-300", iconBg: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/50", blur: "bg-emerald-500/5" },
                                    { bg: "from-white to-amber-50", border: "border-amber-100", hover: "hover:border-amber-300", iconBg: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/50", blur: "bg-amber-500/5" }
                                ];
                                return styles[index % styles.length];
                            };

                            const style = getStyle(index);

                            return (
                                <div key={feature.id} className={`relative p-10 bg-gradient-to-br ${style.bg} rounded-3xl border ${style.border} shadow-lg transition-all duration-500 group hover:shadow-2xl ${style.hover} hover:-translate-y-2`}>
                                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all ${style.blur} group-hover:${style.blur.replace('/5', '/10')}`}></div>
                                    <div className="relative">
                                        <div className={`flex justify-center items-center mb-6 w-20 h-20 text-white bg-gradient-to-br ${style.iconBg} rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${style.shadow}`}>
                                            {getIcon(feature.imageUrl)}
                                        </div>
                                        <h3 className="mb-4 text-2xl font-bold text-slate-900">{feature.title}</h3>
                                        <p className="text-lg leading-relaxed text-slate-700">{feature.content}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative py-20 bg-gradient-to-br via-blue-900 from-slate-900 to-slate-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
                </div>
                <div className="relative px-4 mx-auto max-w-7xl">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {contentLoading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="text-center"><Skeleton.Input active /></div>)
                        ) : (
                            <>
                                <div className="text-center group">
                                    <div className="mb-2 text-6xl font-black text-white transition-transform group-hover:scale-110">{pageContent?.stat_customer?.content || "15K+"}</div>
                                    <div className="text-lg font-medium text-blue-300">{pageContent?.stat_customer?.title || "Khách hàng hài lòng"}</div>
                                </div>
                                <div className="text-center group">
                                    <div className="mb-2 text-6xl font-black text-white transition-transform group-hover:scale-110">{pageContent?.stat_partner?.content || "500+"}</div>
                                    <div className="text-lg font-medium text-blue-300">{pageContent?.stat_partner?.title || "Đối tác kỹ thuật"}</div>
                                </div>
                                <div className="text-center group">
                                    <div className="mb-2 text-6xl font-black text-white transition-transform group-hover:scale-110">{pageContent?.stat_service?.content || "45K+"}</div>
                                    <div className="text-lg font-medium text-blue-300">{pageContent?.stat_service?.title || "Dịch vụ hoàn thành"}</div>
                                </div>
                                <div className="text-center group">
                                    <div className="mb-2 text-6xl font-black text-white transition-transform group-hover:scale-110">{pageContent?.stat_exp?.content || "10+"}</div>
                                    <div className="text-lg font-medium text-blue-300">{pageContent?.stat_exp?.title || "Năm kinh nghiệm"}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Popular Services - Modern Card Grid */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="mb-3 text-5xl font-bold text-slate-900">{pageContent?.popular_title?.content || "Dịch vụ phổ biến"}</h2>
                        <p className="text-xl text-slate-600">{pageContent?.popular_desc?.content || "Được nhiều khách hàng tin dùng nhất tháng này"}</p>
                    </div>
                    <Link to="/services">
                        <Button
                            type="link"
                            className="flex gap-2 items-center text-lg font-semibold text-blue-600 transition-all hover:gap-3"
                            icon={<ArrowRight size={20} />}
                            iconPosition="end"
                        >
                            Xem tất cả
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className="overflow-hidden bg-white rounded-3xl border shadow-lg transition-all duration-500 group hover:shadow-2xl border-slate-100 hover:border-blue-200 hover:-translate-y-2"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="overflow-hidden relative h-56">
                                <img
                                    src={service.image}
                                    alt={service.name}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/800x600?text=Service";
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t to-transparent from-black/60 via-black/20"></div>

                                {/* Tag badge */}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg">
                                        {service.tag}
                                    </span>
                                </div>

                                {/* Price badge */}
                                <div className="absolute top-4 right-4 px-4 py-2 text-sm font-bold text-blue-600 rounded-full shadow-lg backdrop-blur-sm bg-white/95">
                                    {service.price}
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="mb-3 text-xl font-bold transition-colors text-slate-900 group-hover:text-blue-600">
                                    {service.name}
                                </h3>

                                <div className="flex gap-3 items-center mb-5">
                                    <Rate disabled defaultValue={service.rating} className="text-sm" />
                                    <span className="text-sm font-medium text-slate-500">({service.reviews} đánh giá)</span>
                                </div>

                                <Link to={`/booking/${service.id}`}>
                                    <Button
                                        block
                                        size="large"
                                        className="h-12 font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl border-none shadow-md transition-all hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg"
                                    >
                                        Đặt ngay
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="relative bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-[2rem] p-12 md:p-16 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl bg-white/10"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl bg-cyan-400/20"></div>

                    <div className="relative mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-black text-white md:text-5xl">
                            {pageContent?.cta_title?.content || "Sẵn sàng trải nghiệm dịch vụ tốt nhất?"}
                        </h2>
                        <p className="mb-10 text-xl font-light text-blue-100">
                            {pageContent?.cta_desc?.content || "Hàng nghìn khách hàng đã tin tưởng HomeFix. Đến lượt bạn!"}
                        </p>
                        <Link to="/services">
                            <Button
                                size="large"
                                className="px-12 h-16 text-lg font-bold text-blue-600 bg-white rounded-2xl border-none shadow-2xl transition-all hover:bg-blue-50 hover:scale-105"
                                icon={<ArrowRight size={20} />}
                                iconPosition="end"
                            >
                                {pageContent?.cta_button?.content || "Bắt đầu ngay"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;