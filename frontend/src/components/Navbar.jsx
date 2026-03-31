import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Dropdown, Avatar, Drawer } from 'antd';
import { User, LogOut, LayoutDashboard, Settings, Users, Tag, Layers, Wallet, MessageSquare, Moon, Sun, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const showPublicNav = !user || user.role === 'CUSTOMER';

    const items = [
        {
            key: '1',
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate(user?.role === 'TECHNICIAN' ? '/technician/profile' : '/profile')}>
                    <User size={16} /> {user?.role === 'TECHNICIAN' ? 'Hồ sơ kỹ thuật viên' : 'Hồ sơ cá nhân'}
                </div>
            ),
        },
        ...(user?.role === 'TECHNICIAN' ? [
            {
                key: 'tech-dashboard',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/technician/dashboard')}>
                        <LayoutDashboard size={16} /> Bảng công việc
                    </div>
                ),
            },
            {
                key: 'tech-wallet',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/technician/wallet')}>
                        <Wallet size={16} /> Ví kỹ thuật viên
                    </div>
                ),
            }
        ] : []),
        ...(user?.role === 'ADMIN' ? [
            {
                key: 'admin-dispatch',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/admin/dispatch')}>
                        <LayoutDashboard size={16} /> Điều phối đơn
                    </div>
                ),
            },
            {
                key: 'admin-services',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/admin/services')}>
                        <Settings size={16} /> Quản lý dịch vụ
                    </div>
                ),
            },
            {
                key: 'admin-categories',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/admin/categories')}>
                        <Layers size={16} /> Quản lý danh mục
                    </div>
                ),
            },
            {
                key: 'admin-users',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/admin/users')}>
                        <Users size={16} /> Quản lý thành viên
                    </div>
                ),
            },
            {
                key: 'admin-coupons',
                label: (
                    <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/admin/coupons')}>
                        <Tag size={16} /> Mã giảm giá
                    </div>
                ),
            }
        ] : []),
        ...(user?.role === 'CUSTOMER' ? [{
            key: 'customer-dashboard',
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard size={16} /> Đơn hàng của tôi
                </div>
            ),
        }] : []),
        ...(user ? [{
            key: 'messages',
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/messages')}>
                    <MessageSquare size={16} /> Tin nhắn
                </div>
            ),
        }] : []),
        {
            type: 'divider',
        },
        {
            key: '3',
            danger: true,
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => {
                    logout();
                    navigate('/login');
                }}>
                    <LogOut size={16} /> Đăng xuất
                </div>
            ),
        },
    ];

    return (
        <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'border-slate-800 bg-slate-950/85' : 'border-gray-100 bg-white/80'}`}>
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex gap-12 items-center">
                        <Link to={user?.role === 'ADMIN' ? '/admin/dispatch' : user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/'} className="flex gap-2 items-center">
                            <div className={`flex justify-center items-center w-10 h-10 text-xl font-bold text-white bg-blue-600 rounded-xl shadow-lg ${darkMode ? 'shadow-cyan-950/50' : 'shadow-blue-200'}`}>
                                H
                            </div>
                            <span className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${darkMode ? 'from-blue-400 to-cyan-400' : 'from-blue-600 to-blue-800'}`}>
                                HomeFix
                            </span>
                        </Link>
                        <div className="hidden items-center space-x-8 md:flex">
                            {showPublicNav && (
                                <>
                                    <Link to="/services" className={`font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Dịch vụ</Link>
                                    <Link to="/about" className={`font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Giới thiệu</Link>
                                    <Link to="/contact" className={`font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Liên hệ</Link>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2 items-center sm:gap-4">
                        {showPublicNav && (
                            <Button
                                type="text"
                                className={`md:hidden flex items-center justify-center min-w-10 h-10 ${darkMode ? 'text-slate-200 hover:!text-white hover:!bg-slate-800' : 'text-slate-700 hover:!text-blue-600 hover:!bg-blue-50'}`}
                                aria-label="Mở menu điều hướng"
                                icon={<Menu size={22} />}
                                onClick={() => setMobileMenuOpen(true)}
                            />
                        )}
                        <Button
                            type="text"
                            onClick={toggleDarkMode}
                            className={darkMode ? 'text-slate-200 hover:!text-white hover:!bg-slate-800' : 'text-slate-600 hover:!text-blue-600 hover:!bg-blue-50'}
                            icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        />
                        {user ? (
                            <>
                                <NotificationBell />
                                <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
                                <div className={`flex gap-3 items-center px-3 py-2 rounded-full border border-transparent transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-900 hover:border-slate-800' : 'hover:bg-gray-50 hover:border-gray-200'}`}>
                                    <Avatar 
                                        src={user.avatarUrl}
                                        className="font-bold uppercase bg-gradient-to-r from-blue-500 to-blue-600"
                                    >
                                        {!user.avatarUrl && user.fullName?.charAt(0)}
                                    </Avatar>
                                    <div className="hidden text-left sm:block">
                                        <div className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{user.fullName}</div>
                                        <div className={`text-xs capitalize ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.role.toLowerCase()}</div>
                                    </div>
                                </div>
                            </Dropdown>
                            </>
                        ) : (
                            <div className="flex gap-2 items-center sm:gap-3">
                                <Link to="/login">
                                    <Button
                                        type="text"
                                        className={`font-medium ${darkMode ? 'text-slate-300 hover:!text-blue-400 hover:!bg-slate-800' : 'text-gray-600 hover:!text-blue-600 hover:!bg-blue-50'}`}
                                    >
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button
                                        type="primary"
                                        className={`px-4 sm:px-6 h-10 font-medium bg-blue-600 rounded-full border-none shadow-lg hover:bg-blue-700 ${darkMode ? '!shadow-cyan-950/40' : 'shadow-blue-200'}`}
                                    >
                                        <span className="hidden sm:inline">Đăng ký ngay</span>
                                        <span className="sm:hidden">Đăng ký</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Drawer
                title={null}
                placement="right"
                width={280}
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                closable={false}
                classNames={{ body: '!p-0', content: darkMode ? '!bg-slate-900' : '' }}
            >
                <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className={`flex justify-between items-center px-4 py-4 border-b ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                        <span className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Menu</span>
                        <Button
                            type="text"
                            aria-label="Đóng menu"
                            icon={<X size={20} />}
                            onClick={() => setMobileMenuOpen(false)}
                            className={darkMode ? 'text-slate-300 hover:!bg-slate-800' : 'text-slate-600 hover:!bg-gray-100'}
                        />
                    </div>
                    <nav className="flex flex-col p-4 gap-1">
                        {showPublicNav && (
                            <>
                                <Link
                                    to="/services"
                                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-blue-50'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dịch vụ
                                </Link>
                                <Link
                                    to="/about"
                                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-blue-50'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Giới thiệu
                                </Link>
                                <Link
                                    to="/contact"
                                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-blue-50'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Liên hệ
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </Drawer>
        </nav>
    );
};

export default Navbar;
