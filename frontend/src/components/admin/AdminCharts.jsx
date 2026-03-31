import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { Title } = Typography;

const AdminCharts = () => {
    const [topServices, setTopServices] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { darkMode } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topServicesRes, revenueRes, statusRes] = await Promise.all([
                    api.get('/statistics/top-services'),
                    api.get('/statistics/revenue'),
                    api.get('/statistics/order-status')
                ]);
                
                setTopServices(topServicesRes.data);
                
                // Format revenue data
                // Backend returns [{month: "Tháng 1", revenue: 1000}, ...]
                // Chart expects {name: "Tháng 1", total: 1000}
                const formattedRevenue = revenueRes.data.map(item => ({
                    name: item.month,
                    total: item.revenue
                }));
                setRevenueData(formattedRevenue);

                // Format status data
                // Backend returns [{status: "COMPLETED", count: 5}, ...]
                // Chart expects {name: "Hoàn thành", value: 5}
                const statusMap = {
                    'COMPLETED': 'Hoàn thành',
                    'IN_PROGRESS': 'Đang xử lý',
                    'CANCELLED': 'Đã hủy',
                    'PENDING': 'Chờ xác nhận',
                    'ASSIGNED': 'Đã phân công',
                    'DECLINED': 'Đã từ chối'
                };
                
                const formattedStatus = statusRes.data.map(item => ({
                    name: statusMap[item.status] || item.status,
                    value: item.count
                })).filter(item => item.value > 0);
                
                setStatusData(formattedStatus);

            } catch (error) {
                console.error("Error fetching statistics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Row gutter={[16, 16]}>
                <Col span={24} lg={12}>
                    <Card title="Doanh thu theo tháng" bordered={false} className="shadow-sm">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#1e293b' }} />
                                    <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={24} lg={12}>
                    <Card title="Trạng thái đơn hàng" bordered={false} className="shadow-sm">
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#1e293b' }} />
                                    <Legend wrapperStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

             <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Top dịch vụ được đặt nhiều nhất" bordered={false} className="shadow-sm">
                        <div className="h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topServices} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <XAxis type="number" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <YAxis dataKey="serviceName" type="category" width={150} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#e2e8f0' : '#1e293b' }} />
                                    <Legend wrapperStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }} />
                                    <Bar dataKey="count" name="Số lượt đặt" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
             </Row>
        </div>
    );
};

export default AdminCharts;
