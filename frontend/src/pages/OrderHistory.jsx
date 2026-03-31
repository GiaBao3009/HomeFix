import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Modal, Form, Rate, Input, Space, Descriptions } from 'antd';
import { Calendar, Clock, MapPin, DollarSign, User, Star, XCircle } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const OrderHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForm] = Form.useForm();
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelForm] = Form.useForm();
  const [cancellingBooking, setCancellingBooking] = useState(false);

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
      fetchBookings();
    } catch (error) {
      console.error('Review error:', error);
      message.error('Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelClick = (booking) => {
    const hasTechnician = booking.technicianName && booking.technicianName !== 'Chưa có';
    if (!hasTechnician) {
      Modal.confirm({
        title: 'Xác nhận hủy đơn',
        content: 'Bạn có chắc chắn muốn hủy đơn hàng #' + booking.id + '?',
        okText: 'Hủy đơn',
        cancelText: 'Không',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await api.post(`/bookings/${booking.id}/cancel`, {});
            message.success('Đã hủy đơn hàng thành công');
            fetchBookings();
          } catch (e) {
            message.error(e.response?.data?.message || e.response?.data || 'Không thể hủy đơn');
          }
        }
      });
    } else {
      setCancelBooking(booking);
      cancelForm.resetFields();
      setCancelModalOpen(true);
    }
  };

  const handleCancelSubmit = async (values) => {
    setCancellingBooking(true);
    try {
      await api.post(`/bookings/${cancelBooking.id}/cancel`, { reason: values.reason });
      message.success('Đã gửi yêu cầu hủy đơn thành công');
      setCancelModalOpen(false);
      fetchBookings();
    } catch (e) {
      message.error(e.response?.data?.message || e.response?.data || 'Không thể hủy đơn');
    } finally {
      setCancellingBooking(false);
    }
  };

  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ARRIVED'];

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
          case 'ARRIVED': color = 'geekblue'; text = 'Đã đến nơi'; break;
          case 'WORKING': color = 'purple'; text = 'Đang làm việc'; break;
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
        <Space>
          {record.status === 'COMPLETED' && (
            <Button type="primary" ghost size="small" icon={<Star size={14} />} onClick={() => handleOpenReview(record)}>Đánh giá</Button>
          )}
          {cancellableStatuses.includes(record.status) && (
            <Button danger size="small" icon={<XCircle size={14} />} onClick={() => handleCancelClick(record)}>Hủy đơn</Button>
          )}
        </Space>
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

      <Modal title="Đánh giá dịch vụ" open={isReviewModalOpen} onCancel={() => setIsReviewModalOpen(false)} footer={null}>
        <div className="mb-4">
            <p className="font-semibold">Dịch vụ: <span className="text-blue-600">{selectedBooking?.serviceName}</span></p>
            <p className="text-sm text-slate-500">Thợ thực hiện: {selectedBooking?.technicianName || 'Không có thông tin'}</p>
        </div>
        <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview}>
            <Form.Item name="rating" label="Đánh giá sao" rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
                <Rate allowHalf className="text-yellow-400" />
            </Form.Item>
            <Form.Item name="comment" label="Nhận xét của bạn" rules={[{ required: true, message: 'Vui lòng nhập nhận xét' }]}>
                <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..." />
            </Form.Item>
            <Form.Item className="mb-0 text-right">
                <Button onClick={() => setIsReviewModalOpen(false)} className="mr-2">Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submittingReview}>Gửi đánh giá</Button>
            </Form.Item>
        </Form>
      </Modal>

      <Modal title="Hủy đơn hàng" open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)} footer={null}>
        <div className="mb-4">
            <p className="font-semibold">Đơn hàng: <span className="text-blue-600">#{cancelBooking?.id}</span></p>
            <p className="text-sm text-slate-500">Kỹ thuật viên đã nhận đơn: <strong>{cancelBooking?.technicianName}</strong></p>
            <p className="mt-2 text-orange-600 text-sm">Đơn hàng đã có kỹ thuật viên nhận, vui lòng cho biết lý do hủy.</p>
        </div>
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelSubmit}>
            <Form.Item name="reason" label="Lý do hủy đơn" rules={[{ required: true, message: 'Vui lòng nhập lý do hủy đơn' }]}>
                <Input.TextArea rows={4} placeholder="Nhập lý do hủy đơn hàng..." />
            </Form.Item>
            <Form.Item className="mb-0 text-right">
                <Button onClick={() => setCancelModalOpen(false)} className="mr-2">Quay lại</Button>
                <Button type="primary" danger htmlType="submit" loading={cancellingBooking}>Xác nhận hủy</Button>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderHistory;
