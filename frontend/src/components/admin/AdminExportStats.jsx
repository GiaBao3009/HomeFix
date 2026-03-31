import { useState, useEffect } from 'react';
import { Card, Button, Select, Table, Tag, Typography, message, Space, Empty, Spin, Row, Col, Statistic, Tooltip } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Download, FileSpreadsheet, RefreshCw, Users, ShoppingCart, TrendingUp, Clock, HardDrive, Hash } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TYPE_LABELS = { BOOKINGS: 'Đơn hàng', USERS: 'Người dùng', REVENUE: 'Doanh thu' };

const AdminExportStats = () => {
    const { darkMode } = useTheme();
    const [stats, setStats] = useState(null);
    const [recentExports, setRecentExports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);
    const [days, setDays] = useState(30);

    const chartColors = {
        grid: darkMode ? '#334155' : '#e2e8f0',
        tick: darkMode ? '#94a3b8' : '#64748b',
        tooltipBg: darkMode ? '#1e293b' : '#fff',
        tooltipBorder: darkMode ? '#334155' : '#e2e8f0',
        tooltipColor: darkMode ? '#e2e8f0' : '#1e293b',
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [statsRes, recentRes] = await Promise.all([
                api.get(`/admin/export/statistics?days=${days}`),
                api.get('/admin/export/recent?limit=15')
            ]);
            setStats(statsRes.data || {});
            setRecentExports(recentRes.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, [days]);

    const handleExport = async (type) => {
        setExporting(type);
        try {
            const endpoints = { bookings: '/admin/export/bookings', users: '/admin/export/users', revenue: '/admin/export/revenue' };
            const names = { bookings: 'don-hang.xlsx', users: 'nguoi-dung.xlsx', revenue: 'doanh-thu.xlsx' };
            const res = await api.get(endpoints[type], { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = names[type];
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            message.success('Xuất file Excel thành công');
            setTimeout(fetchStats, 1000);
        } catch (error) {
            message.error(error.response?.data?.message || 'Xuất Excel thất bại');
        } finally {
            setExporting(null);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    const recentColumns = [
        { title: '#', dataIndex: 'id', width: 60, render: (id) => <Text type="secondary">#{id}</Text> },
        {
            title: 'Loại', dataIndex: 'exportType', width: 120,
            render: (t) => <Tag color={t === 'BOOKINGS' ? 'blue' : t === 'USERS' ? 'green' : 'gold'}>{TYPE_LABELS[t] || t}</Tag>
        },
        { title: 'Người xuất', dataIndex: 'userName', ellipsis: true },
        { title: 'File', dataIndex: 'fileName', ellipsis: true, render: (f) => <Text className="text-xs">{f}</Text> },
        { title: 'Kích thước', dataIndex: 'fileSize', width: 100, render: (s) => formatBytes(s) },
        { title: 'Số dòng', dataIndex: 'rowCount', width: 80 },
        { title: 'Thời gian', dataIndex: 'durationMs', width: 90, render: (ms) => ms != null ? `${ms}ms` : '-' },
        { title: 'Ngày', dataIndex: 'createdAt', width: 140, render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-' }
    ];

    if (loading && !stats) {
        return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
    }

    const byDay = stats?.byDay || [];
    const byType = (stats?.byType || []).map(d => ({ ...d, name: TYPE_LABELS[d.type] || d.type }));
    const byUser = (stats?.byUser || []).slice(0, 8);

    return (
        <div className="space-y-6">
            {/* Header + Export Buttons */}
            <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                    <Title level={4} className="!mb-1">Xuất báo cáo Excel</Title>
                    <Text type="secondary">Xuất dữ liệu hệ thống và theo dõi lịch sử</Text>
                </div>
                <Space wrap>
                    <Select value={days} onChange={setDays} style={{ width: 140 }} options={[
                        { value: 7, label: '7 ngày qua' }, { value: 30, label: '30 ngày qua' },
                        { value: 90, label: '90 ngày qua' }, { value: 365, label: '1 năm qua' }
                    ]} />
                    <Button icon={<RefreshCw size={14} />} onClick={fetchStats} loading={loading}>Làm mới</Button>
                </Space>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card bordered={false} className="!rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => !exporting && handleExport('bookings')}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <ShoppingCart size={22} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold">Đơn hàng</div>
                            <div className="text-xs text-slate-500">Toàn bộ booking</div>
                        </div>
                        <Button type="primary" size="small" icon={<Download size={14} />} loading={exporting === 'bookings'} onClick={(e) => { e.stopPropagation(); handleExport('bookings'); }}>
                            Xuất
                        </Button>
                    </div>
                </Card>
                <Card bordered={false} className="!rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => !exporting && handleExport('users')}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <Users size={22} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold">Người dùng</div>
                            <div className="text-xs text-slate-500">Tất cả users</div>
                        </div>
                        <Button size="small" className="bg-emerald-600 text-white border-emerald-600" icon={<Download size={14} />} loading={exporting === 'users'} onClick={(e) => { e.stopPropagation(); handleExport('users'); }}>
                            Xuất
                        </Button>
                    </div>
                </Card>
                <Card bordered={false} className="!rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => !exporting && handleExport('revenue')}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <TrendingUp size={22} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold">Doanh thu</div>
                            <div className="text-xs text-slate-500">Đơn hoàn thành</div>
                        </div>
                        <Button size="small" className="bg-amber-600 text-white border-amber-600" icon={<Download size={14} />} loading={exporting === 'revenue'} onClick={(e) => { e.stopPropagation(); handleExport('revenue'); }}>
                            Xuất
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card bordered={false} className="!rounded-xl" bodyStyle={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><FileSpreadsheet size={18} className="text-blue-600" /></div>
                        <div><div className="text-xs text-slate-500">Tổng lượt xuất</div><div className="text-lg font-bold text-blue-600">{stats?.totalExports || 0}</div></div>
                    </div>
                </Card>
                <Card bordered={false} className="!rounded-xl" bodyStyle={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><HardDrive size={18} className="text-violet-600" /></div>
                        <div><div className="text-xs text-slate-500">Kích thước TB</div><div className="text-lg font-bold text-violet-600">{formatBytes(stats?.avgFileSize || 0)}</div></div>
                    </div>
                </Card>
                <Card bordered={false} className="!rounded-xl" bodyStyle={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Clock size={18} className="text-emerald-600" /></div>
                        <div><div className="text-xs text-slate-500">Thời gian TB</div><div className="text-lg font-bold text-emerald-600">{stats?.avgDurationMs || 0}ms</div></div>
                    </div>
                </Card>
                <Card bordered={false} className="!rounded-xl" bodyStyle={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Hash size={18} className="text-amber-600" /></div>
                        <div><div className="text-xs text-slate-500">Loại báo cáo</div><div className="text-lg font-bold text-amber-600">{(stats?.byType || []).length}</div></div>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card title="Lượt xuất theo ngày" bordered={false} className="!rounded-xl shadow-sm">
                        {byDay.length > 0 ? (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={byDay}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 12 }} stroke={chartColors.grid} tickFormatter={(d) => dayjs(d).format('DD/MM')} />
                                        <YAxis tick={{ fill: chartColors.tick }} stroke={chartColors.grid} allowDecimals={false} />
                                        <RTooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipColor, borderRadius: 8 }} labelFormatter={(d) => dayjs(d).format('DD/MM/YYYY')} />
                                        <Area type="monotone" dataKey="count" name="Lượt xuất" stroke="#3b82f6" fill="url(#blueGrad)" strokeWidth={2} />
                                        <defs><linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} /></linearGradient></defs>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <Empty description="Chưa có dữ liệu xuất Excel" />}
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title="Phân loại báo cáo" bordered={false} className="!rounded-xl shadow-sm">
                        {byType.length > 0 ? (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <RTooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipColor, borderRadius: 8 }} />
                                        <Legend wrapperStyle={{ color: chartColors.tooltipColor }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <Empty description="Chưa có dữ liệu" />}
                    </Card>
                </Col>
            </Row>

            {/* By User Chart */}
            {byUser.length > 0 && (
                <Card title="Lượt xuất theo người dùng" bordered={false} className="!rounded-xl shadow-sm">
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byUser} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                <XAxis type="number" tick={{ fill: chartColors.tick }} stroke={chartColors.grid} allowDecimals={false} />
                                <YAxis dataKey="user" type="category" width={120} tick={{ fill: chartColors.tick, fontSize: 12 }} stroke={chartColors.grid} />
                                <RTooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipColor, borderRadius: 8 }} />
                                <Bar dataKey="count" name="Lượt xuất" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Recent Exports Table */}
            <Card title="Lịch sử xuất gần đây" bordered={false} className="!rounded-xl shadow-sm">
                <Table columns={recentColumns} dataSource={recentExports} rowKey="id" pagination={{ pageSize: 8, size: 'small' }}
                    scroll={{ x: 800 }} locale={{ emptyText: <Empty description="Chưa có lịch sử xuất Excel" /> }} />
            </Card>
        </div>
    );
};

export default AdminExportStats;
