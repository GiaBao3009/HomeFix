import { useEffect, useState } from 'react';
import { Card, Button, Spin, Tag, Row, Col, Typography, Carousel, Badge, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useContent from '../hooks/useContent';
import { Tag as TagIcon, Star, CheckCircle, Search, TrendingUp, Zap, Award } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

const ServiceList = () => {
    const { content: pageContent } = useContent('SERVICE_LIST');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/services/packages');
            setServices(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-lg text-slate-600">Đang tải dịch vụ...</p>
                </div>
            </div>
        );
    }

    const featuredServices = services.slice(0, 3);
    const filteredServices = services.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-16 space-y-16">
            {/* Hero Slider with Modern Design */}
            <div className="overflow-hidden rounded-3xl shadow-2xl">
                <Carousel autoplay effect="fade" dots={{ className: "custom-dots" }}>
                    {featuredServices.length > 0 ? featuredServices.map((service) => (
                        <div key={service.id} className="relative h-[500px]">
                            <img 
                                src={service.imageUrl || 'https://placehold.co/800x600?text=Service'} 
                                alt={service.name}
                                className="object-cover w-full h-full"
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = 'https://placehold.co/800x600?text=Service'; 
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r to-transparent from-black/80 via-black/50"></div>
                            <div className="flex absolute inset-0 items-center">
                                <div className="px-8 mx-auto w-full max-w-7xl">
                                    <div className="space-y-6 max-w-2xl text-white">
                                        <div className="inline-flex gap-2 items-center px-4 py-2 text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
                                            <Award size={16} />
                                            Dịch vụ nổi bật
                                        </div>
                                        <h2 className="text-5xl font-black leading-tight md:text-6xl">
                                            {service.name}
                                        </h2>
                                        <p className="text-xl leading-relaxed text-slate-200 line-clamp-2">
                                            {service.description || "Dịch vụ chất lượng cao với đội ngũ chuyên nghiệp"}
                                        </p>
                                        <div className="flex gap-4 items-center pt-4">
                                            <div className="px-6 py-3 rounded-2xl border backdrop-blur-md bg-white/20 border-white/30">
                                                <span className="text-2xl font-bold">{service.price?.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                            <Button 
                                                size="large" 
                                                onClick={() => navigate(`/services/${service.id}`)}
                                                className="px-10 h-14 font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl border-none shadow-xl transition-all hover:from-blue-700 hover:to-cyan-600 hover:shadow-2xl hover:scale-105"
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="relative h-[500px] bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                            <div className="text-center text-white">
                                <h2 className="mb-4 text-5xl font-black">Chào mừng đến với HomeFix</h2>
                                <p className="text-xl text-blue-100">Khám phá các dịch vụ chất lượng cao</p>
                            </div>
                        </div>
                    )}
                </Carousel>
            </div>

            {/* Search & Filter Section */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="p-8 bg-white rounded-3xl border shadow-lg border-slate-100">
                    <div className="flex flex-col gap-6 items-center md:flex-row">
                        <div className="flex-1 w-full">
                            <Input
                                size="large"
                                placeholder="Tìm kiếm dịch vụ..."
                                prefix={<Search className="text-slate-400" size={20} />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-14 text-lg rounded-2xl"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Tag className="px-4 py-2 text-base rounded-xl transition-colors cursor-pointer hover:bg-blue-50">
                                Tất cả
                            </Tag>
                            <Tag color="blue" className="px-4 py-2 text-base rounded-xl cursor-pointer">
                                Phổ biến
                            </Tag>
                            <Tag className="px-4 py-2 text-base rounded-xl transition-colors cursor-pointer hover:bg-blue-50">
                                Ưu đãi
                            </Tag>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service List with Modern Cards */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-5xl font-black text-slate-900">{pageContent?.page_title?.title || "Dịch vụ của chúng tôi"}</h2>
                    <p className="text-xl text-slate-600">
                        {pageContent?.page_title?.content || "Giải pháp toàn diện cho ngôi nhà của bạn với đội ngũ chuyên nghiệp"}
                    </p>
                </div>

                <Row gutter={[32, 32]}>
                    {filteredServices.map((service, index) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={service.id}>
                            <Card
                                hoverable
                                className="flex overflow-hidden flex-col h-full rounded-3xl border-0 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group"
                                cover={
                                    <div className="overflow-hidden relative h-56">
                                        <img
                                            alt={service.name}
                                            src={service.imageUrl || 'https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=600'}
                                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src = 'https://placehold.co/600x400?text=Service'; 
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent from-black/60"></div>
                                        
                                        {/* Category Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-3 py-1.5 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm bg-white/95 text-slate-800">
                                                {service.categoryName}
                                            </span>
                                        </div>
                                        
                                        {/* Trending Badge - for first few items */}
                                        {index < 3 && (
                                            <div className="absolute top-3 right-3">
                                                <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full shadow-lg">
                                                    <TrendingUp size={20} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                }
                                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
                            >
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-xl font-bold text-slate-900 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors" title={service.name}>
                                        {service.name}
                                    </h3>
                                    
                                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">
                                        {service.description || "Dịch vụ chuyên nghiệp với đội ngũ lành nghề"}
                                    </p>
                                    
                                    {/* Features */}
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-slate-600">
                                            <div className="flex justify-center items-center mr-2 w-5 h-5 bg-green-100 rounded-full">
                                                <CheckCircle size={14} className="text-green-600" />
                                            </div>
                                            Đội ngũ chuyên nghiệp
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600">
                                            <div className="flex justify-center items-center mr-2 w-5 h-5 bg-blue-100 rounded-full">
                                                <Star size={14} className="text-blue-600" />
                                            </div>
                                            Cam kết chất lượng
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600">
                                            <div className="flex justify-center items-center mr-2 w-5 h-5 bg-amber-100 rounded-full">
                                                <Zap size={14} className="text-amber-600" />
                                            </div>
                                            Nhanh chóng
                                        </div>
                                    </div>
                                </div>

                                {/* Price & CTA */}
                                <div className="pt-4 mt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <span className="block mb-1 text-xs text-slate-500">Giá từ</span>
                                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                                {service.price?.toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                    </div>
                                    <Button 
                                        type="primary" 
                                        block
                                        size="large"
                                        onClick={() => navigate(`/services/${service.id}`)}
                                        className="h-12 font-bold bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl border-none shadow-md transition-all hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg hover:scale-105"
                                    >
                                        Xem chi tiết
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {filteredServices.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="mb-4 text-6xl">🔍</div>
                        <h3 className="mb-2 text-2xl font-bold text-slate-900">Không tìm thấy dịch vụ</h3>
                        <p className="text-slate-600">Vui lòng thử tìm kiếm với từ khóa khác</p>
                    </div>
                )}
            </div>
            
            {/* Promotions Section - Enhanced */}
            <div className="px-4 mx-auto max-w-7xl">
                <div className="overflow-hidden relative p-12 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-3xl shadow-2xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl bg-white/20"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-white/10"></div>
                    
                    <div className="relative">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} lg={16}>
                                <div className="inline-flex gap-2 items-center px-4 py-2 mb-6 rounded-full backdrop-blur-sm bg-white/20">
                                    <Zap size={16} className="text-white" />
                                    <span className="text-sm font-bold text-white">{pageContent?.promo_title?.title || "Ưu đãi đặc biệt"}</span>
                                </div>
                                <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
                                    {pageContent?.promo_title?.content || "Nhận ngay ưu đãi hấp dẫn!"}
                                </h2>
                                <p className="mb-6 text-xl text-white/90">
                                    {pageContent?.promo_desc?.content || "Nhập mã WELCOME để được giảm ngay 10% cho đơn hàng đầu tiên!"}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-4 py-2 rounded-xl border backdrop-blur-sm bg-white/20 border-white/30">
                                        <span className="font-bold text-white">{pageContent?.promo_code_1?.content || "#SUMMER2024"}</span>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl border backdrop-blur-sm bg-white/20 border-white/30">
                                        <span className="font-bold text-white">{pageContent?.promo_code_2?.content || "#HOMEFIXVIP"}</span>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl border backdrop-blur-sm bg-white/20 border-white/30">
                                        <span className="font-bold text-white">{pageContent?.promo_code_3?.content || "#FLASHSALE"}</span>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} lg={8} className="text-center">
                                <Button 
                                    size="large" 
                                    className="px-10 h-16 text-lg font-bold text-orange-600 bg-white rounded-2xl border-none shadow-2xl transition-all hover:bg-orange-50 hover:scale-105"
                                >
                                    {pageContent?.promo_button?.content || "Xem tất cả ưu đãi"}
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>

            {/* Custom styles for carousel dots */}
            <style jsx>{`
                :global(.custom-dots li button) {
                    background: rgba(255, 255, 255, 0.5) !important;
                    border-radius: 10px !important;
                    width: 40px !important;
                    height: 4px !important;
                }
                :global(.custom-dots li.slick-active button) {
                    background: white !important;
                    width: 60px !important;
                }
            `}</style>
        </div>
    );
};

export default ServiceList;