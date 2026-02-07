import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Dropdown, Avatar, Space } from 'antd';
import { User, LogOut, LayoutDashboard, Settings, Users, Tag } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const items = [
        {
            key: '1',
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/profile')}>
                    <User size={16} /> Hồ sơ cá nhân
                </div>
            ),
        },
        ...(user?.role === 'TECHNICIAN' ? [{
            key: 'tech-dashboard',
            label: (
                <div className="flex gap-2 items-center px-2 py-1" onClick={() => navigate('/technician/dashboard')}>
                    <LayoutDashboard size={16} /> Bảng công việc
                </div>
            ),
        }] : []),
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
        <nav className="sticky top-0 z-50 border-b border-gray-100 backdrop-blur-md bg-white/80">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex gap-12 items-center">
                        <Link to={user?.role === 'ADMIN' ? '/admin/dispatch' : user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/'} className="flex gap-2 items-center">
                            <div className="flex justify-center items-center w-10 h-10 text-xl font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                H
                            </div>
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                                HomeFix
                            </span>
                        </Link>
                        <div className="hidden items-center space-x-8 md:flex">
                            {(!user || user.role === 'CUSTOMER') && (
                                <>
                                    <Link to="/services" className="font-medium text-gray-600 transition-colors hover:text-blue-600">Dịch vụ</Link>
                                    <Link to="/about" className="font-medium text-gray-600 transition-colors hover:text-blue-600">Giới thiệu</Link>
                                    <Link to="/contact" className="font-medium text-gray-600 transition-colors hover:text-blue-600">Liên hệ</Link>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        {user ? (
                            <>
                                <NotificationBell />
                                <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
                                <div className="flex gap-3 items-center px-3 py-2 rounded-full border border-transparent transition-colors cursor-pointer hover:bg-gray-50 hover:border-gray-200">
                                    <Avatar className="font-bold uppercase bg-gradient-to-r from-blue-500 to-blue-600">
                                        {user.fullName?.charAt(0)}
                                    </Avatar>
                                    <div className="hidden text-left sm:block">
                                        <div className="text-sm font-semibold text-gray-700">{user.fullName}</div>
                                        <div className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</div>
                                    </div>
                                </div>
                            </Dropdown>
                            </>
                        ) : (
                            <div className="flex gap-3 items-center">
                                <Link to="/login">
                                    <Button type="text" className="font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button type="primary" className="px-6 h-10 font-medium bg-blue-600 rounded-full border-none shadow-lg hover:bg-blue-700 shadow-blue-200">
                                        Đăng ký ngay
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
