import { Typography, Row, Col, Card, Avatar, Timeline, Statistic, Skeleton } from 'antd';
import { Target, Heart, Shield, TrendingUp, Users, Award, Sparkles, CheckCircle, Zap, Clock } from 'lucide-react';
import useContent from '../hooks/useContent';

const { Title, Paragraph, Text } = Typography;

const About = () => {
    const { content: pageContent, loading: contentLoading } = useContent('ABOUT');
    const { content: homeContent, loading: homeLoading } = useContent('HOME'); // Reuse stats from Home

    // Icon mapping helper
    const getIcon = (iconName) => {
        const icons = {
            'SHIELD': Shield,
            'HEART': Heart,
            'TRENDING_UP': TrendingUp,
            'USERS': Users,
            'AWARD': Award,
            'CHECK_CIRCLE': CheckCircle,
            'ZAP': Zap,
            'CLOCK': Clock,
            'TARGET': Target,
            'SPARKLES': Sparkles
        };
        const Icon = icons[iconName] || Shield;
        return <Icon size={32} />;
    };

    // Process Values
    const rawValues = pageContent && pageContent.value ? (Array.isArray(pageContent.value) ? pageContent.value : [pageContent.value]) : [];
    const values = rawValues.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((item, index) => {
        const colors = [
            { color: "from-blue-500 to-cyan-500", bgColor: "from-blue-50 to-cyan-50" },
            { color: "from-pink-500 to-rose-500", bgColor: "from-pink-50 to-rose-50" },
            { color: "from-purple-500 to-indigo-500", bgColor: "from-purple-50 to-indigo-50" },
            { color: "from-emerald-500 to-teal-500", bgColor: "from-emerald-50 to-teal-50" }
        ];
        const colorSet = colors[index % colors.length];
        return {
            icon: getIcon(item.imageUrl), // imageUrl stores icon name in DataSeeder
            title: item.title,
            description: item.content,
            ...colorSet
        };
    });

    // Process Stats (from HOME content)
    // Note: homeContent structure might be different depending on Service. 
    // If structured, stats are likely under keys like 'stat_customer', 'stat_partner', etc. individually, OR grouped under 'stat' if we changed Seeder.
    // In DataSeeder, keys are 'stat_customer', 'stat_partner', etc. So they are separate keys in the Map.
    const stats = [];
    if (homeContent) {
        const statKeys = ['stat_customer', 'stat_partner', 'stat_service', 'stat_exp'];
        statKeys.forEach(key => {
            if (homeContent[key]) {
                 const item = Array.isArray(homeContent[key]) ? homeContent[key][0] : homeContent[key];
                 let icon = <CheckCircle size={24} />;
                 let color = "purple";
                 if (key === 'stat_customer') { icon = <Users size={24} />; color = "blue"; }
                 if (key === 'stat_partner') { icon = <Award size={24} />; color = "emerald"; }
                 if (key === 'stat_exp') { icon = <TrendingUp size={24} />; color = "amber"; }
                 
                 stats.push({
                    value: item.content,
                    label: item.title,
                    icon: icon,
                    color: color,
                    displayOrder: item.displayOrder || 0
                 });
            }
        });
        stats.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    // Process Team
    const rawTeam = pageContent && pageContent.team ? (Array.isArray(pageContent.team) ? pageContent.team : [pageContent.team]) : [];
    const team = rawTeam.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((item, index) => {
        const gradients = [
            "from-blue-600 to-cyan-600",
            "from-purple-600 to-pink-600",
            "from-emerald-600 to-teal-600"
        ];
        return {
            name: item.title,
            role: item.content,
            avatar: item.imageUrl,
            gradient: gradients[index % gradients.length]
        };
    });

    // Process Timeline
    const rawTimeline = pageContent && pageContent.timeline ? (Array.isArray(pageContent.timeline) ? pageContent.timeline : [pageContent.timeline]) : [];
    const timelineItems = rawTimeline.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((item) => ({
        color: 'blue',
        children: (
            <div className="p-4 mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="mb-1 text-lg font-bold text-blue-600">{item.title}</div>
                <div className="text-slate-600">{item.content}</div>
            </div>
        ),
    }));
    
    // Loading State
    if (contentLoading) {
        return <div className="p-12 text-center"><Skeleton active paragraph={{ rows: 10 }} /></div>;
    }

    return (
        <div className="px-4 py-12 mx-auto space-y-24 max-w-7xl">
            {/* Hero Section */}
            <div className="relative space-y-6 text-center">
                <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 bg-blue-500/10 -z-10"></div>
                
                <div className="inline-flex gap-2 items-center px-4 py-2 mb-4 bg-gradient-to-r rounded-full border border-blue-200 from-blue-500/10 to-cyan-500/10">
                    <Sparkles size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Về chúng tôi</span>
                </div>
                
                <h1 className="mb-6 text-6xl font-black leading-tight md:text-7xl text-slate-900">
                    {pageContent?.hero_title?.title?.replace("HomeFix", "") || "Câu chuyện"}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600">
                        HomeFix
                    </span>
                </h1>
                
                <p className="mx-auto max-w-3xl text-xl font-light leading-relaxed md:text-2xl text-slate-600">
                    {pageContent?.hero_desc?.content || "Chúng tôi là nền tảng kết nối dịch vụ gia đình hàng đầu."}
                </p>
            </div>

            {/* Mission & Vision */}
            <Row gutter={[64, 64]} className="items-center">
                <Col xs={24} lg={12}>
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl opacity-20 blur-xl transition-opacity group-hover:opacity-30"></div>
                        <img 
                            src={pageContent?.mission_desc?.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000"} 
                            alt="Our Team" 
                            className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                        />
                    </div>
                </Col>
                
                <Col xs={24} lg={12}>
                    <div className="space-y-6">
                        <div className="inline-flex gap-2 items-center px-4 py-2 font-bold text-blue-700 bg-blue-50 rounded-full">
                            <Target size={18} />
                            <span>{pageContent?.mission_title?.title || "Sứ mệnh"}</span>
                        </div>
                        
                        <h2 className="text-4xl font-black leading-tight md:text-5xl text-slate-900">
                            {pageContent?.mission_title?.content || "Giải phóng bạn khỏi lo toan việc nhà"}
                        </h2>
                        
                        <p className="text-lg leading-relaxed text-slate-700">
                            {pageContent?.mission_desc?.content || "HomeFix ra đời với sứ mệnh..."}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {values.map((value, index) => (
                                <div 
                                    key={index}
                                    className={`bg-gradient-to-br ${value.bgColor} p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
                                >
                                    <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                        {value.icon}
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-slate-900">{value.title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-600">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Stats */}
            <div className="overflow-hidden relative rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br via-blue-900 from-slate-900 to-slate-900"></div>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.3),transparent_50%)]"></div>
                </div>
                
                <div className="relative p-12 md:p-16">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-black text-white">Thành tích của chúng tôi</h2>
                        <p className="text-lg text-blue-200">Con số không nói dối</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {stats.map((stat, index) => (
                            <div 
                                key={index}
                                className="text-center group"
                            >
                                <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-2xl backdrop-blur-sm transition-all bg-white/10 group-hover:scale-110 group-hover:bg-white/20">
                                    <div className={`text-${stat.color}-400`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="mb-2 text-5xl font-black text-white transition-transform md:text-6xl group-hover:scale-110">
                                    {stat.value}
                                </div>
                                <div className="text-lg font-semibold text-blue-300">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Story - Timeline */}
            <Row gutter={[64, 64]}>
                <Col xs={24} lg={12}>
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex gap-2 items-center px-4 py-2 mb-6 font-bold text-purple-700 bg-purple-50 rounded-full">
                                <TrendingUp size={18} />
                                <span>Hành trình</span>
                            </div>
                            <h2 className="mb-6 text-4xl font-black md:text-5xl text-slate-900">
                                Phát triển <br />
                                <span className="text-purple-600">không ngừng nghỉ</span>
                            </h2>
                        </div>
                        
                        <Timeline className="custom-timeline">
                            {rawTimeline.map((item, index) => (
                                <Timeline.Item 
                                    key={index}
                                    label={<span className="text-lg font-bold text-blue-600">{item.title}</span>}
                                    dot={
                                        <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full shadow-lg"></div>
                                    }
                                >
                                    <p className="text-lg font-medium text-slate-700">{item.content}</p>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                </Col>
                
                <Col xs={24} lg={12}>
                    <div className="relative h-full group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-20 blur-xl transition-opacity group-hover:opacity-30"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1000" 
                            alt="Meeting" 
                            className="relative rounded-3xl shadow-2xl w-full h-full min-h-[500px] object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                        />
                    </div>
                </Col>
            </Row>

            {/* Team */}
            <div className="space-y-12 text-center">
                <div>
                    <div className="inline-flex gap-2 items-center px-4 py-2 mb-6 font-bold text-emerald-700 bg-emerald-50 rounded-full">
                        <Users size={18} />
                        <span>Đội ngũ</span>
                    </div>
                    <h2 className="mb-4 text-4xl font-black md:text-5xl text-slate-900">
                        Gặp gỡ <span className="text-emerald-600">lãnh đạo</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-xl text-slate-600">
                        Những con người tài năng đứng sau thành công của HomeFix
                    </p>
                </div>
                
                <Row gutter={[32, 32]} justify="center">
                    {team.map((member, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <Card 
                                bordered={false} 
                                className="overflow-hidden rounded-3xl border-0 transition-all duration-500 group hover:shadow-2xl hover:-translate-y-2"
                            >
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl`}></div>
                                    <div className="relative">
                                        <div className={`absolute -inset-2 bg-gradient-to-br ${member.gradient} rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity`}></div>
                                        <Avatar 
                                            size={180} 
                                            src={member.avatar} 
                                            className="relative mx-auto mb-6 border-4 border-white shadow-xl transition-transform duration-500 group-hover:scale-105" 
                                        />
                                    </div>
                                    <div className="relative">
                                        <h3 className="mb-2 text-2xl font-bold transition-colors text-slate-900 group-hover:text-blue-600">
                                            {member.name}
                                        </h3>
                                        <p className="text-lg font-semibold text-slate-600">{member.role}</p>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* CTA Section - Static for now or can use REGISTER content */}
            <div className="overflow-hidden relative rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700"></div>
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl bg-white/10"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-cyan-500/20"></div>
                
                <div className="relative px-8 py-20 text-center">
                    <h2 className="mb-6 text-4xl font-black text-white md:text-5xl">
                        Sẵn sàng trải nghiệm HomeFix?
                    </h2>
                    <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
                        Hãy để chúng tôi chăm sóc ngôi nhà của bạn như chính ngôi nhà của chúng tôi
                    </p>
                    <button className="px-10 py-4 text-lg font-bold text-blue-600 bg-white rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-105">
                        Bắt đầu ngay hôm nay
                    </button>
                </div>
            </div>

            {/* Custom Timeline Styles */}
            <style jsx>{`
                :global(.custom-timeline .ant-timeline-item-label) {
                    font-weight: 700;
                    font-size: 1.125rem;
                    color: #2563eb;
                }
                :global(.custom-timeline .ant-timeline-item-tail) {
                    border-left: 2px solid #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default About;
