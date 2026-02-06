import { Layout, Row, Col, Typography, Space, Input, Button, Divider } from 'antd';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Send } from 'lucide-react';

const { Footer: AntFooter } = Layout;
const { Title, Text, Link } = Typography;

const Footer = () => {
    return (
        <AntFooter className="bg-slate-900 text-slate-300 p-16 font-sans">
            <div className="max-w-7xl mx-auto">
                <Row gutter={[48, 48]}>
                    {/* Brand Section */}
                    <Col xs={24} md={8}>
                        <div className="mb-6">
                            <span className="text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                HomeFix
                            </span>
                        </div>
                        <Text className="text-slate-400 block mb-6 text-base leading-relaxed">
                            Đối tác tin cậy cho mọi nhu cầu sửa chữa và chăm sóc ngôi nhà của bạn. 
                            Kết nối với đội ngũ chuyên gia tận tâm, chuyên nghiệp chỉ với vài cú click.
                        </Text>
                        <Space size="large">
                            <div className="bg-slate-800 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                                <Facebook size={20} />
                            </div>
                            <div className="bg-slate-800 p-3 rounded-full hover:bg-sky-500 hover:text-white transition-all cursor-pointer">
                                <Twitter size={20} />
                            </div>
                            <div className="bg-slate-800 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-all cursor-pointer">
                                <Instagram size={20} />
                            </div>
                        </Space>
                    </Col>
                    
                    {/* Quick Links */}
                    <Col xs={24} sm={12} md={5}>
                        <Title level={4} style={{ color: 'white', marginBottom: '1.5rem' }}>Khám phá</Title>
                        <div className="flex flex-col gap-3">
                            <Link href="/services" className="text-slate-400 hover:text-blue-400 transition-colors text-base">Dịch vụ</Link>
                            <Link href="/about" className="text-slate-400 hover:text-blue-400 transition-colors text-base">Về chúng tôi</Link>
                            <Link href="/contact" className="text-slate-400 hover:text-blue-400 transition-colors text-base">Liên hệ</Link>
                            <Link href="/login" className="text-slate-400 hover:text-blue-400 transition-colors text-base">Đăng nhập</Link>
                            <Link href="/register" className="text-slate-400 hover:text-blue-400 transition-colors text-base">Đăng ký</Link>
                        </div>
                    </Col>

                    {/* Contact Info */}
                    <Col xs={24} sm={12} md={5}>
                        <Title level={4} style={{ color: 'white', marginBottom: '1.5rem' }}>Liên hệ</Title>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3 text-slate-400 group">
                                <MapPin size={20} className="mt-1 group-hover:text-blue-400 transition-colors" />
                                <span className="group-hover:text-white transition-colors">123 Đường Cầu Giấy,<br/>Hà Nội, Việt Nam</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 group">
                                <Phone size={20} className="group-hover:text-blue-400 transition-colors" />
                                <span className="group-hover:text-white transition-colors">1900 1234</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 group">
                                <Mail size={20} className="group-hover:text-blue-400 transition-colors" />
                                <span className="group-hover:text-white transition-colors">support@homefix.vn</span>
                            </div>
                        </div>
                    </Col>

                    {/* Newsletter */}
                    <Col xs={24} md={6}>
                        <Title level={4} style={{ color: 'white', marginBottom: '1.5rem' }}>Đăng ký tin tức</Title>
                        <Text className="text-slate-400 block mb-4">
                            Nhận thông tin khuyến mãi và mẹo vặt chăm sóc nhà cửa mới nhất.
                        </Text>
                        <div className="flex flex-col gap-3">
                            <Input 
                                placeholder="Email của bạn" 
                                size="large" 
                                className="rounded-xl bg-slate-800 border-slate-700 text-white placeholder-slate-500 hover:border-blue-500 focus:border-blue-500"
                            />
                            <Button type="primary" size="large" icon={<Send size={18} />} className="rounded-xl bg-blue-600 hover:bg-blue-500 border-none h-12 font-semibold">
                                Đăng ký ngay
                            </Button>
                        </div>
                    </Col>
                </Row>
                
                <Divider className="border-slate-800 my-10" />
                
                <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <p>© 2026 HomeFix. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link className="text-slate-500 hover:text-slate-300">Điều khoản sử dụng</Link>
                        <Link className="text-slate-500 hover:text-slate-300">Chính sách bảo mật</Link>
                    </div>
                </div>
                <div className="text-center mt-8">
                     <Text className="text-slate-600 text-xs">Developed with ❤️ by Vinhdev04</Text>
                </div>
            </div>
        </AntFooter>
    );
};

export default Footer;
