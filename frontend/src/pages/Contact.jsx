import { Typography, Row, Col, Form, Input, Button, Card, message, Skeleton } from 'antd';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Headphones } from 'lucide-react';
import useContent from '../hooks/useContent';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const Contact = () => {
    const { content: pageContent, loading: contentLoading } = useContent('CONTACT');
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Success:', values);
        message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
        form.resetFields();
    };

    const contactInfo = [
        {
            icon: <MapPin size={24} />,
            title: "Trụ sở chính",
            content: pageContent?.info_address?.content || "Tầng 12, Tòa nhà TechHome",
            subcontent: pageContent?.info_address?.subcontent || "Quận Cầu Giấy, Hà Nội",
            color: "from-blue-600 to-cyan-600",
            bgColor: "from-blue-50 to-cyan-50"
        },
        {
            icon: <Phone size={24} />,
            title: "Hotline",
            content: pageContent?.info_hotline?.content || "1900 1234 56",
            subcontent: "Hỗ trợ 24/7",
            color: "from-emerald-600 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50"
        },
        {
            icon: <Mail size={24} />,
            title: "Email",
            content: pageContent?.info_email?.content || "support@homefix.vn",
            subcontent: "jobs@homefix.vn",
            color: "from-purple-600 to-pink-600",
            bgColor: "from-purple-50 to-pink-50"
        },
        {
            icon: <Clock size={24} />,
            title: "Giờ làm việc",
            content: pageContent?.info_hours?.content || "T2 - T7: 8:00 - 18:00",
            subcontent: "CN: 9:00 - 17:00",
            color: "from-amber-600 to-orange-600",
            bgColor: "from-amber-50 to-orange-50"
        }
    ];

    return (
        <div className="px-4 py-12 mx-auto space-y-16 max-w-7xl">
            {/* Hero Section */}
            <div className="relative space-y-6 text-center">
                <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 bg-blue-500/10 -z-10"></div>
                
                <div className="inline-flex gap-2 items-center px-4 py-2 mb-4 bg-gradient-to-r rounded-full border border-blue-200 from-blue-500/10 to-cyan-500/10">
                    <MessageCircle size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Liên hệ</span>
                </div>
                
                <h1 className="text-6xl font-black leading-tight md:text-7xl text-slate-900">
                    {contentLoading ? <Skeleton active paragraph={{ rows: 0 }} /> : (pageContent?.hero_title?.content || "Hãy nói chuyện")}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600">
                        {contentLoading ? "" : "với chúng tôi"}
                    </span>
                </h1>
                
                <div className="mx-auto max-w-3xl text-xl leading-relaxed md:text-2xl text-slate-600">
                    {contentLoading ? <Skeleton active paragraph={{ rows: 2 }} /> : (pageContent?.hero_desc?.content || "Bạn có thắc mắc hoặc cần hỗ trợ? Hãy để lại tin nhắn.")}
                </div>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {contentLoading ? [1,2,3,4].map(i => <Skeleton key={i} active />) : contactInfo.map((info, index) => (
                    <div 
                        key={index}
                        className={`group relative bg-gradient-to-br ${info.bgColor} p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100`}
                    >
                        <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                            {info.icon}
                        </div>
                        <h3 className="mb-3 text-lg font-bold text-slate-900">{info.title}</h3>
                        <p className="text-lg font-semibold text-slate-700">{info.content}</p>
                        <p className="mt-1 text-sm text-slate-600">{info.subcontent}</p>
                    </div>
                ))}
            </div>

            {/* Main Contact Section */}
            <Row gutter={[64, 64]}>
                {/* Left Side - Visual Card */}
                <Col xs={24} lg={10}>
                    <div className="sticky top-8 space-y-8">
                        <Card className="overflow-hidden text-white bg-gradient-to-br via-blue-900 rounded-3xl border-0 shadow-2xl from-slate-900 to-slate-900">
                            {/* Animated background */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl"></div>
                            </div>
                            
                            <div className="relative p-4 space-y-8">
                                <div>
                                    <h2 className="mb-4 text-3xl font-black">Kết nối với chúng tôi</h2>
                                    <p className="text-lg text-blue-200">
                                        Chúng tôi luôn sẵn sàng hỗ trợ bạn với mọi thắc mắc về dịch vụ
                                    </p>
                                </div>

                                {/* Quick Contact Options */}
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-center p-4 rounded-2xl backdrop-blur-sm transition-all cursor-pointer bg-white/10 hover:bg-white/20 group">
                                        <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl transition-transform group-hover:scale-110">
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">Gọi ngay</p>
                                            <p className="text-blue-200">1900 1234 56</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-center p-4 rounded-2xl backdrop-blur-sm transition-all cursor-pointer bg-white/10 hover:bg-white/20 group">
                                        <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl transition-transform group-hover:scale-110">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">Gửi email</p>
                                            <p className="text-blue-200">support@homefix.vn</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-center p-4 rounded-2xl backdrop-blur-sm transition-all cursor-pointer bg-white/10 hover:bg-white/20 group">
                                        <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl transition-transform group-hover:scale-110">
                                            <Headphones size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">Live Chat</p>
                                            <p className="text-blue-200">Hỗ trợ trực tuyến 24/7</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="pt-8 border-t border-white/20">
                                    <p className="mb-4 text-lg font-bold">Theo dõi chúng tôi</p>
                                    <div className="flex gap-4">
                                        {['F', 'T', 'I', 'L'].map((social, index) => (
                                            <div 
                                                key={index}
                                                className="flex justify-center items-center w-12 h-12 text-lg font-bold rounded-xl backdrop-blur-sm transition-all cursor-pointer bg-white/10 hover:bg-white/20 hover:scale-110"
                                            >
                                                {social}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Col>

                {/* Right Side - Contact Form */}
                <Col xs={24} lg={14}>
                    <Card className="rounded-3xl border-0 shadow-2xl">
                        <div className="space-y-6">
                            <div>
                                <h2 className="mb-2 text-3xl font-black text-slate-900">Gửi tin nhắn</h2>
                                <p className="text-lg text-slate-600">Điền thông tin và chúng tôi sẽ liên hệ lại sớm nhất</p>
                            </div>

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                size="large"
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="name"
                                            label={<span className="font-semibold text-slate-700">Họ và tên</span>}
                                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                                        >
                                            <Input 
                                                placeholder="Nguyễn Văn A" 
                                                className="rounded-xl border-slate-200 hover:border-blue-400"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="email"
                                            label={<span className="font-semibold text-slate-700">Email</span>}
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập email!' },
                                                { type: 'email', message: 'Email không hợp lệ!' }
                                            ]}
                                        >
                                            <Input 
                                                placeholder="example@email.com" 
                                                className="rounded-xl border-slate-200 hover:border-blue-400"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="subject"
                                    label={<span className="font-semibold text-slate-700">Chủ đề</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập chủ đề!' }]}
                                >
                                    <Input 
                                        placeholder="Hợp tác, Khiếu nại, Tư vấn..." 
                                        className="rounded-xl border-slate-200 hover:border-blue-400"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="message"
                                    label={<span className="font-semibold text-slate-700">Nội dung</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                                >
                                    <TextArea 
                                        rows={6} 
                                        placeholder="Chi tiết nội dung bạn cần hỗ trợ..."
                                        className="rounded-xl border-slate-200 hover:border-blue-400"
                                    />
                                </Form.Item>

                                <Form.Item className="mb-0">
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        icon={<Send size={20} />}
                                        iconPosition="end"
                                        block
                                        className="h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Gửi tin nhắn
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Map Section with Modern Design */}
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="mb-4 text-4xl font-black text-slate-900">
                        Ghé thăm văn phòng của chúng tôi
                    </h2>
                    <p className="text-xl text-slate-600">
                        Chúng tôi luôn chào đón bạn tại trụ sở chính
                    </p>
                </div>
                
                <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px] border-4 border-slate-100 group">
                    <div className="absolute inset-0 z-10 bg-gradient-to-br opacity-0 transition-opacity pointer-events-none from-blue-600/20 to-cyan-600/20 group-hover:opacity-100"></div>
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.7800937149326!3d21.028811885998398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4cd0c66f05%3A0xea038ad3775aaced!2zQ8ahIHF1YW4gVHJ1bmcgxrDGoW5nIMSQb8OgbiBUaGFuaCBmacOqbiBD4buZbmcgU-G6o24gSOG7kyBDaMOtIE1pbmggLSBUUlVORyBUw4JNIEPDlE5HIE5HjMOqIFRIw5RORyBUSU4gVEhBTkggTknDqU4gVkl44buGVCBOQU0!5e0!3m2!1svi!2s!4v1647847384938!5m2!1svi!2s" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy"
                        title="Google Map"
                        className="relative z-0"
                    />
                </div>
            </div>

            {/* FAQ or Additional Info Section */}
            <div className="p-12 bg-gradient-to-br to-blue-50 rounded-3xl from-slate-50">
                <div className="mb-8 text-center">
                    <h2 className="mb-4 text-3xl font-black text-slate-900">Câu hỏi thường gặp</h2>
                    <p className="text-lg text-slate-600">Những thông tin hữu ích cho bạn</p>
                </div>
                
                <div className="grid gap-6 mx-auto max-w-4xl md:grid-cols-2">
                    {[
                        { q: "Thời gian phản hồi?", a: "Chúng tôi sẽ phản hồi trong vòng 24h" },
                        { q: "Hỗ trợ khẩn cấp?", a: "Hotline 24/7 luôn sẵn sàng" },
                        { q: "Làm việc cuối tuần?", a: "Có, chúng tôi làm việc cả thứ 7 và CN" },
                        { q: "Tư vấn miễn phí?", a: "Hoàn toàn miễn phí tư vấn ban đầu" }
                    ].map((faq, index) => (
                        <div key={index} className="p-6 bg-white rounded-2xl shadow-md">
                            <h3 className="mb-2 text-lg font-bold text-slate-900">{faq.q}</h3>
                            <p className="text-slate-600">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Contact;