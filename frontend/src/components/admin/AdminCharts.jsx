import React, { useMemo, useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const { Title } = Typography;

const AdminCharts = ({ bookings = [] }) => {
    const [topServices, setTopServices] = useState([]);
    
    useEffect(() => {
        const fetchTopServices = async () => {
            try {
                const res = await api.get('/statistics/top-services');
                setTopServices(res.data);
            } catch (error) {
                console.error("Error fetching top services:", error);
            }
        };
        fetchTopServices();
    }, []);

    // Calculate Revenue
    const dataRevenue = useMemo(() => {
        if (!bookings.length) return [];
        const revenueByMonth = {};
        
        bookings.forEach(booking => {
            if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
                const date = new Date(booking.bookingTime);
                const month = `T${date.getMonth() + 1}`;
                revenueByMonth[month] = (revenueByMonth[month] || 0) + (booking.totalPrice || 0);
            }
        });

        // Ensure all months are represented or just existing ones sorted
        return Object.entries(revenueByMonth)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => {
                const mA = parseInt(a.name.substring(1));
                const mB = parseInt(b.name.substring(1));
                return mA - mB;
            });
    }, [bookings]);

    // Calculate Status
    const dataStatus = useMemo(() => {
        if (!bookings.length) return [];
        const statusCounts = {
            'COMPLETED': 0,
            'IN_PROGRESS': 0,
            'CANCELLED': 0,
            'PENDING': 0,
            'CONFIRMED': 0,
            'DECLINED': 0
        };

        bookings.forEach(b => {
            if (statusCounts[b.status] !== undefined) {
                statusCounts[b.status]++;
            }
        });

        return [
            { name: 'Hoàn thành', value: statusCounts['COMPLETED'] },
            { name: 'Đang xử lý', value: statusCounts['IN_PROGRESS'] + statusCounts['CONFIRMED'] },
            { name: 'Đã hủy', value: statusCounts['CANCELLED'] + statusCounts['DECLINED'] },
            { name: 'Chờ xác nhận', value: statusCounts['PENDING'] },
        ].filter(item => item.value > 0);
    }, [bookings]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
            <Row gutter={[16, 16]}>
                <Col span={24} lg={12}>
                    <Card title="Doanh thu theo tháng" bordered={false} className="shadow-sm">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
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
                                        data={dataStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {dataStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
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
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="serviceName" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
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
