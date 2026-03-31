import { useEffect, useState } from 'react';
import { Tabs, message, Card, Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminServiceManager from './AdminServiceManager';
import AdminDispatch from './AdminDispatch';
import AdminCategoryManager from './AdminCategoryManager';
import AdminUserManager from './AdminUserManager';
import AdminCouponManager from './AdminCouponManager';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';
import TechnicianDashboard from './TechnicianDashboard';
import TechnicianWallet from './TechnicianWallet';
import OrderHistory from './OrderHistory';
import AdminCharts from '../components/admin/AdminCharts';
import AdminExportStats from '../components/admin/AdminExportStats';
import { LayoutDashboard, Users, Calendar, Settings, Briefcase, Award, PieChart, Tag as TagIcon, Layers, Wallet, MessageSquare, ArrowDownCircle, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [adminTabPosition, setAdminTabPosition] = useState('top');

    useEffect(() => {
        if (user?.role !== 'ADMIN') return;
        const mq = window.matchMedia('(min-width: 768px)');
        const update = () => setAdminTabPosition(mq.matches ? 'left' : 'top');
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [user?.role]);

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
        },
        {
            key: 'export',
            label: (
                <div className="flex gap-2 items-center px-2">
                    <FileSpreadsheet size={18}/>
                    <span className="font-semibold">Xuất báo cáo</span>
                </div>
            ),
            children: <AdminExportStats />
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
                        <div className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Tin nhắn & Chat</div>
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

    const isAdmin = user?.role === 'ADMIN';
    const tabPosition = isAdmin ? adminTabPosition : 'top';

    const tabBarStyle =
        isAdmin && adminTabPosition === 'left'
            ? {
                  minWidth: 180,
                  marginBottom: 0,
                  marginRight: 24,
                  borderBottom: 'none',
                  borderRight: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
              }
            : {
                  borderBottom: darkMode ? '2px solid #1e293b' : '2px solid #e2e8f0',
                  marginBottom: '2rem',
              };

    return (
        <div className="min-h-[80vh] pb-12">
            <div className="px-6 mx-auto max-w-7xl mb-6">
                <div
                    className={[
                        'relative flex h-20 max-h-[80px] min-h-[80px] items-center justify-between gap-4 overflow-hidden rounded-xl px-5 shadow-sm',
                        darkMode
                            ? 'bg-gradient-to-r from-slate-800/95 via-slate-800 to-slate-900 text-white'
                            : 'bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-100 text-slate-800',
                    ].join(' ')}
                >
                    <div
                        className={[
                            'pointer-events-none absolute inset-0 opacity-60',
                            darkMode
                                ? 'bg-gradient-to-r from-blue-600/15 via-transparent to-cyan-500/10'
                                : 'bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-400/10',
                        ].join(' ')}
                        aria-hidden
                    />
                    <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-3">
                        <div
                            className={[
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm',
                                darkMode
                                    ? 'bg-gradient-to-br from-blue-500/40 to-cyan-500/30 text-white'
                                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
                            ].join(' ')}
                        >
                            <LayoutDashboard size={18} />
                        </div>
                        <div className="min-w-0">
                            <p
                                className={[
                                    'truncate text-xs font-medium',
                                    darkMode ? 'text-slate-300' : 'text-slate-600',
                                ].join(' ')}
                            >
                                Chào mừng trở lại
                            </p>
                            <p className="truncate text-sm font-bold sm:text-base">
                                <span className={darkMode ? 'text-white' : 'text-slate-900'}>{user?.fullName || 'User'}</span>
                            </p>
                        </div>
                    </div>
                    <div
                        className={[
                            'relative z-[1] inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm sm:text-sm',
                            darkMode
                                ? 'border-white/15 bg-white/10 text-slate-100'
                                : 'border-slate-200/80 bg-white/70 text-slate-700',
                        ].join(' ')}
                    >
                        <Award size={14} className="shrink-0 opacity-90" />
                        <span>
                            {user?.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : user?.role === 'TECHNICIAN'
                                  ? 'Kỹ thuật viên'
                                  : 'Khách hàng'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 mx-auto max-w-7xl">
                <Tabs
                    defaultActiveKey={getDefaultTab()}
                    items={tabItems}
                    size="large"
                    tabPosition={tabPosition}
                    className={isAdmin ? 'dashboard-tabs dashboard-tabs-admin' : 'dashboard-tabs'}
                    tabBarStyle={tabBarStyle}
                />
            </div>

            <style jsx>{`
                :global(.dashboard-tabs .ant-tabs-tab) {
                    padding: 12px 4px;
                    font-size: 16px;
                    color: #64748b;
                    transition: all 0.3s;
                }
                :global(.dark .dashboard-tabs .ant-tabs-tab) {
                    color: #94a3b8;
                }

                :global(.dashboard-tabs .ant-tabs-tab:hover) {
                    color: #3b82f6;
                }
                :global(.dark .dashboard-tabs .ant-tabs-tab:hover) {
                    color: #60a5fa;
                }

                :global(.dashboard-tabs .ant-tabs-tab-active) {
                    color: #2563eb !important;
                }
                :global(.dark .dashboard-tabs .ant-tabs-tab-active) {
                    color: #60a5fa !important;
                }

                :global(.dashboard-tabs .ant-tabs-ink-bar) {
                    background: linear-gradient(to right, #3b82f6, #06b6d4);
                    height: 3px;
                    border-radius: 3px 3px 0 0;
                }
                :global(.dark .dashboard-tabs .ant-tabs-ink-bar) {
                    background: linear-gradient(to right, #60a5fa, #22d3ee);
                }

                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-nav-wrap) {
                    min-width: 180px;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-nav) {
                    min-width: 180px;
                    padding: 8px 0;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-tab) {
                    margin: 4px 8px 4px 0 !important;
                    padding: 10px 12px !important;
                    border-radius: 10px;
                    justify-content: flex-start;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-tab:hover) {
                    background: rgba(59, 130, 246, 0.08);
                }
                :global(.dark .dashboard-tabs-admin.ant-tabs-left .ant-tabs-tab:hover) {
                    background: rgba(96, 165, 250, 0.12);
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-tab-active) {
                    background: rgba(59, 130, 246, 0.12) !important;
                }
                :global(.dark .dashboard-tabs-admin.ant-tabs-left .ant-tabs-tab-active) {
                    background: rgba(96, 165, 250, 0.15) !important;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-ink-bar) {
                    width: 3px !important;
                    height: auto !important;
                    border-radius: 3px 0 0 3px;
                    background: linear-gradient(to bottom, #3b82f6, #06b6d4);
                }
                :global(.dark .dashboard-tabs-admin.ant-tabs-left .ant-tabs-ink-bar) {
                    background: linear-gradient(to bottom, #60a5fa, #22d3ee);
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-content-holder) {
                    border-left: none;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left > .ant-tabs-content-holder) {
                    padding-left: 0;
                }
                :global(.dark .dashboard-tabs-admin.ant-tabs-left .ant-tabs-nav::before) {
                    border-color: #1e293b;
                }
                :global(.dashboard-tabs-admin.ant-tabs-left .ant-tabs-nav::before) {
                    border-color: #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
