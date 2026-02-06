import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Modal, Form, Rate, Input } from 'antd';
import { Calendar, Clock, MapPin, DollarSign, User, Star } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const OrderHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForm] = Form.useForm();
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    reviewForm.resetFields();
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (values) => {
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: selectedBooking.id,
        rating: values.rating,
        comment: values.comment
      });
      message.success('Đánh giá thành công! Cảm ơn bạn.');
      setIsReviewModalOpen(false);
      // Optional: Refresh bookings or update local state to show reviewed
    } catch (error) {
      console.error('Review error:', error);
      message.error('Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-bold text-slate-700">#{text}</span>,
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      render: (date) => (
        <div className="flex gap-2 items-center text-slate-600">
          <Calendar size={14} />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => (
        <div className="font-semibold text-slate-700">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        switch (status) {
          case 'PENDING': color = 'orange'; text = 'Chờ xử lý'; break;
          case 'ASSIGNED': color = 'blue'; text = 'Đã có thợ'; break;
          case 'IN_PROGRESS': color = 'processing'; text = 'Đang thực hiện'; break;
          case 'COMPLETED': color = 'success'; text = 'Hoàn thành'; break;
          case 'CANCELLED': color = 'error'; text = 'Đã hủy'; break;
          case 'CONFIRMED': color = 'cyan'; text = 'Đã xác nhận'; break;
          case 'DECLINED': color = 'red'; text = 'Bị từ chối'; break;
        }
        return <Tag color={color} className="px-3 py-1 rounded-full">{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
         record.status === 'COMPLETED' ? (
             <Button 
                type="primary" 
                ghost 
                size="small" 
                icon={<Star size={14} />}
                onClick={() => handleOpenReview(record)}
             >
                 Đánh giá
             </Button>
         ) : null
      ),
    }
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Lịch sử đơn hàng</h1>
      <Card className="shadow-sm rounded-xl border-slate-200">
        <Table 
            columns={columns} 
            dataSource={bookings} 
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Đánh giá dịch vụ"
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        footer={null}
      >
        <div className="mb-4">
            <p className="font-semibold">Dịch vụ: <span className="text-blue-600">{selectedBooking?.serviceName}</span></p>
            <p className="text-sm text-slate-500">Thợ thực hiện: {selectedBooking?.technicianName || 'Không có thông tin'}</p>
        </div>
        <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleSubmitReview}
        >
            <Form.Item
                name="rating"
                label="Đánh giá sao"
                rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
            >
                <Rate allowHalf className="text-yellow-400" />
            </Form.Item>

            <Form.Item
                name="comment"
                label="Nhận xét của bạn"
                rules={[{ required: true, message: 'Vui lòng nhập nhận xét' }]}
            >
                <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..." />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
                <Button onClick={() => setIsReviewModalOpen(false)} className="mr-2">Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submittingReview}>Gửi đánh giá</Button>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderHistory;
