import { useEffect, useState } from 'react';
import { Tabs, message, Card, Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminServiceManager from './AdminServiceManager';
import AdminDispatch from './AdminDispatch';
import AdminCategoryManager from './AdminCategoryManager';
import AdminUserManager from './AdminUserManager';
import AdminCouponManager from './AdminCouponManager';
import TechnicianDashboard from './TechnicianDashboard';
import TechnicianWallet from './TechnicianWallet';
import OrderHistory from './OrderHistory';
import AdminCharts from '../components/admin/AdminCharts';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';
import { LayoutDashboard, Users, Calendar, Settings, Briefcase, Award, PieChart, Tag as TagIcon, Layers, Wallet, MessageSquare, ArrowDownCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const getDefaultTab = () => {
        if (user?.role === 'ADMIN') return 'overview';
        if (user?.role === 'TECHNICIAN') return 'jobs';
        return 'history';
    };

    const adminTabs = [
        {
            key: 'overview',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <PieChart size={18}/>
                    <span className="font-semibold">Thống kê</span>
                </div>
            ),
            children: (
                <div>
                     <h2 className={`mb-4 text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Tổng quan hệ thống</h2>
                     <AdminCharts />
                </div>
            )
        },
        {
            key: 'dispatch',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <LayoutDashboard size={18}/>
                    <span className="font-semibold">Phân công</span>
                </div>
            ),
            children: <AdminDispatch />
        },
        {
            key: 'categories',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Layers size={18}/>
                    <span className="font-semibold">Danh mục</span>
                </div>
            ),
            children: <AdminCategoryManager />
        },
        {
            key: 'services',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Settings size={18}/>
                    <span className="font-semibold">Dịch vụ</span>
                </div>
            ),
            children: <AdminServiceManager />
        },
        {
            key: 'coupons',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <TagIcon size={18}/>
                    <span className="font-semibold">Mã giảm giá</span>
                </div>
            ),
            children: <AdminCouponManager />
        },
        {
            key: 'users',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Users size={18}/>
                    <span className="font-semibold">Người dùng</span>
                </div>
            ),
            children: <AdminUserManager />
        },
        {
            key: 'withdrawals',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <ArrowDownCircle size={18}/>
                    <span className="font-semibold">Rút tiền</span>
                </div>
            ),
            children: <AdminWithdrawals />
        }
    ];

    const technicianTabs = [
        {
            key: 'jobs',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Briefcase size={18}/>
                    <span className="font-semibold">Công việc của tôi</span>
                </div>
            ),
            children: <TechnicianDashboard />
        },
        {
            key: 'wallet',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Wallet size={18}/>
                    <span className="font-semibold">Ví kỹ thuật viên</span>
                </div>
            ),
            children: <TechnicianWallet />
        }
    ];

    const customerTabs = [
        {
            key: 'history',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <Calendar size={18}/>
                    <span className="font-semibold">Lịch sử đặt lịch</span>
                </div>
            ),
            children: <OrderHistory />
        },
        {
            key: 'messages',
            label: (
                <div className="flex gap-2 items-center px-2" onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}>
                    <MessageSquare size={18}/>
                    <span className="font-semibold">Tin nhắn</span>
                </div>
            ),
            children: (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center">
                        <MessageSquare size={36} className="text-blue-500" />
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold mb-2">Tin nhắn & Chat</div>
                        <div className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nhắn tin realtime với kỹ thuật viên và quản trị viên</div>
                        <Button type="primary" size="large" icon={<MessageSquare size={18} />} onClick={() => navigate('/messages')}>
                            Mở Inbox
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    let tabItems = [];
    if (user?.role === 'ADMIN') {
        tabItems = adminTabs;
    } else if (user?.role === 'TECHNICIAN') {
        tabItems = [...technicianTabs, ...customerTabs];
    } else {
        tabItems = customerTabs;
    }

    return (
        <div className="min-h-[80vh] pb-12">
            {/* Header Section */}
            <div className="overflow-hidden relative py-12 mb-8 text-white bg-gradient-to-br via-blue-900 rounded-3xl shadow-2xl from-slate-900 to-slate-900">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl bg-blue-500/10"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-cyan-500/10"></div>
                
                <div className="relative px-6 mx-auto max-w-7xl">
                    <div className="flex gap-4 items-center mb-4">
                        <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                            <LayoutDashboard size={32} />
                        </div>
                        <div>
                            <h1 className="mb-1 text-4xl font-black">Dashboard</h1>
                            <p className="text-lg text-blue-200">
                                Chào mừng trở lại, <span className="font-bold text-white">{user?.fullName || 'User'}</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Role Badge */}
                    <div className="inline-flex gap-2 items-center px-4 py-2 mt-4 rounded-full border backdrop-blur-sm bg-white/10 border-white/20">
                        <Award size={16} />
                        <span className="text-sm font-semibold">
                            {user?.role === 'ADMIN' ? 'Quản trị viên' : 
                             user?.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Khách hàng'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="px-6 mx-auto max-w-7xl">
                <Tabs 
                    defaultActiveKey={getDefaultTab()}
                    items={tabItems}
                    size="large"
                    className="dashboard-tabs"
                    tabBarStyle={{
                        borderBottom: darkMode ? '2px solid #1e293b' : '2px solid #e2e8f0',
                        marginBottom: '2rem'
                    }}
                />
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                :global(.dashboard-tabs .ant-tabs-tab) {
                    padding: 12px 4px;
                    font-size: 16px;
                    color: #64748b;
                    transition: all 0.3s;
                }
                
                :global(.dashboard-tabs .ant-tabs-tab:hover) {
                    color: #3b82f6;
                }
                
                :global(.dashboard-tabs .ant-tabs-tab-active) {
                    color: #2563eb !important;
                }
                
                :global(.dashboard-tabs .ant-tabs-ink-bar) {
                    background: linear-gradient(to right, #3b82f6, #06b6d4);
                    height: 3px;
                    border-radius: 3px 3px 0 0;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
