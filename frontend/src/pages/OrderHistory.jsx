import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Rate,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Receipt,
  RefreshCw,
  Star,
  User,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const POLL_INTERVAL_MS = 10000;

const STATUS_META = {
  PENDING: { color: 'orange', text: 'Chờ xử lý' },
  CONFIRMED: { color: 'cyan', text: 'Đã xác nhận' },
  ASSIGNED: { color: 'blue', text: 'Đã có thợ' },
  IN_PROGRESS: { color: 'processing', text: 'Đang thực hiện' },
  ARRIVED: { color: 'geekblue', text: 'Đã đến nơi' },
  WORKING: { color: 'purple', text: 'Đang làm việc' },
  COMPLETED: { color: 'success', text: 'Hoàn thành' },
  CANCELLED: { color: 'error', text: 'Đã hủy' },
  DECLINED: { color: 'red', text: 'Bị từ chối' }
};

const PROGRESS_STEPS = ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'ARRIVED', 'WORKING', 'COMPLETED'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const renderStatusTag = (status) => {
  const meta = STATUS_META[status] || { color: 'default', text: status };
  return <Tag color={meta.color} className="rounded-full px-3 py-1">{meta.text}</Tag>;
};

const OrderHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [detailBookingId, setDetailBookingId] = useState(null);
  const [reviewForm] = Form.useForm();
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelForm] = Form.useForm();
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const previousStatusesRef = useRef(new Map());
  const promptedReviewIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const reviewModalOpenRef = useRef(false);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === detailBookingId) || null,
    [bookings, detailBookingId]
  );

  const reviewBooking = useMemo(
    () => bookings.find((booking) => booking.id === reviewBookingId) || null,
    [bookings, reviewBookingId]
  );

  const setStatusSnapshot = (items) => {
    previousStatusesRef.current = new Map(items.map((item) => [item.id, item.status]));
  };

  const openReviewModal = (booking, defaultRating) => {
    promptedReviewIdsRef.current.add(booking.id);
    setReviewBookingId(booking.id);
    reviewForm.resetFields();
    reviewForm.setFieldsValue({
      rating: defaultRating,
      comment: '',
      tipAmount: 0
    });
    setIsReviewModalOpen(true);
  };

  const detectReviewPrompt = (items) => {
    if (reviewModalOpenRef.current) {
      return;
    }

    const previousStatuses = previousStatusesRef.current;
    let targetBooking = null;

    if (!initializedRef.current) {
      targetBooking = items.find((item) => item.status === 'COMPLETED' && !item.reviewed);
    } else {
      targetBooking = items.find((item) => {
        const previousStatus = previousStatuses.get(item.id);
        return previousStatus && previousStatus !== 'COMPLETED' && item.status === 'COMPLETED' && !item.reviewed;
      });
    }

    if (!targetBooking || promptedReviewIdsRef.current.has(targetBooking.id)) {
      return;
    }

    openReviewModal(targetBooking, 5);
    message.success(`Đơn #${targetBooking.id} vừa hoàn thành. Bạn có thể đánh giá và tip cho thợ ngay bây giờ.`);
  };

  const fetchBookings = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await api.get('/bookings/my-bookings');
      const items = Array.isArray(response.data) ? response.data : [];
      detectReviewPrompt(items);
      setBookings(items);
      setStatusSnapshot(items);
      initializedRef.current = true;
      setLastUpdatedAt(dayjs());
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (!silent) {
        message.error('Không thể tải lịch sử đơn hàng');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => fetchBookings({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    reviewModalOpenRef.current = isReviewModalOpen;
  }, [isReviewModalOpen]);

  const handleOpenReview = (booking) => {
    openReviewModal(booking, undefined);
  };

  const handleSubmitReview = async (values) => {
    if (!reviewBooking) {
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBooking.id,
        rating: values.rating,
        comment: values.comment,
        tipAmount: values.tipAmount || 0
      });
      message.success('Đánh giá thành công. Cảm ơn bạn!');
      setIsReviewModalOpen(false);
      setReviewBookingId(null);
      reviewForm.resetFields();
      await fetchBookings({ silent: true });
    } catch (error) {
      console.error('Review error:', error);
      message.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelClick = (booking) => {
    const hasTechnician = booking.technicianName && booking.technicianName !== 'Chưa có';
    if (!hasTechnician) {
      Modal.confirm({
        title: 'Xác nhận hủy đơn',
        content: `Bạn có chắc chắn muốn hủy đơn hàng #${booking.id}?`,
        okText: 'Hủy đơn',
        cancelText: 'Không',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await api.post(`/bookings/${booking.id}/cancel`, {});
            message.success('Đã hủy đơn hàng thành công');
            fetchBookings({ silent: true });
          } catch (e) {
            message.error(e.response?.data?.message || e.response?.data || 'Không thể hủy đơn');
          }
        }
      });
      return;
    }

    setCancelBooking(booking);
    cancelForm.resetFields();
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (values) => {
    setCancellingBooking(true);
    try {
      await api.post(`/bookings/${cancelBooking.id}/cancel`, { reason: values.reason });
      message.success('Đã gửi yêu cầu hủy đơn thành công');
      setCancelModalOpen(false);
      fetchBookings({ silent: true });
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
      render: (value) => <span className="font-bold text-slate-700">#{value}</span>
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (value, record) => (
        <button
          type="button"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          onClick={() => setDetailBookingId(record.id)}
        >
          {value}
        </button>
      )
    },
    {
      title: 'Lịch hẹn',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      render: (value) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={14} />
          {dayjs(value).format('DD/MM/YYYY HH:mm')}
        </div>
      )
    },
    {
      title: 'Tạm tính',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => <span className="font-semibold text-slate-700">{formatCurrency(value)}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailBookingId(record.id)}>Chi tiết</Button>
          {record.status === 'COMPLETED' && !record.reviewed && (
            <Button type="primary" ghost size="small" icon={<Star size={14} />} onClick={() => handleOpenReview(record)}>
              Đánh giá
            </Button>
          )}
          {record.status === 'COMPLETED' && record.reviewed && (
            <Tag color="green" className="rounded-full px-3 py-1">Đã đánh giá</Tag>
          )}
          {cancellableStatuses.includes(record.status) && (
            <Button danger size="small" icon={<XCircle size={14} />} onClick={() => handleCancelClick(record)}>
              Hủy đơn
            </Button>
          )}
        </Space>
      )
    }
  ];

  const progressItems = PROGRESS_STEPS.map((status) => ({
    title: STATUS_META[status]?.text || status
  }));

  const totalWithTip = Number(selectedBooking?.totalPrice || 0) + Number(selectedBooking?.tipAmount || 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1">Đơn hàng của tôi</Title>
          <Text type="secondary">Trang này tự động cập nhật tiến độ đơn và mở popup review khi đơn hoàn thành.</Text>
        </div>
        <Space>
          <Tag color="blue" className="rounded-full px-3 py-1">
            Cập nhật {lastUpdatedAt ? lastUpdatedAt.format('HH:mm:ss') : '...'}
          </Tag>
          <Button icon={<RefreshCw size={16} />} onClick={() => fetchBookings()}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => setDetailBookingId(record.id),
            className: 'cursor-pointer'
          })}
          locale={{ emptyText: <Empty description="Bạn chưa có đơn hàng nào" /> }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedBooking ? `Chi tiết đơn hàng #${selectedBooking.id}` : 'Chi tiết đơn hàng'}
        open={Boolean(detailBookingId)}
        onCancel={() => setDetailBookingId(null)}
        width={920}
        footer={[
          selectedBooking?.status === 'COMPLETED' && !selectedBooking?.reviewed ? (
            <Button key="review" type="primary" onClick={() => handleOpenReview(selectedBooking)}>
              Đánh giá và tip
            </Button>
          ) : null,
          <Button key="close" onClick={() => setDetailBookingId(null)}>Đóng</Button>
        ]}
      >
        {selectedBooking ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <Text type="secondary">Trạng thái hiện tại</Text>
                  <div className="mt-1">{renderStatusTag(selectedBooking.status)}</div>
                </div>
                {selectedBooking.reviewed && (
                  <Tag color="green" className="rounded-full px-3 py-1">Đã đánh giá</Tag>
                )}
              </div>
              {selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'DECLINED' ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                  Đơn hàng này không còn trong luồng xử lý.
                </div>
              ) : (
                <Steps current={Math.max(PROGRESS_STEPS.indexOf(selectedBooking.status), 0)} size="small" items={progressItems} />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <Descriptions title="Thông tin công việc" column={1} size="small">
                  <Descriptions.Item label="Dịch vụ">{selectedBooking.serviceName}</Descriptions.Item>
                  <Descriptions.Item label="Kỹ thuật viên">{selectedBooking.technicianName || 'Đang chờ phân công'}</Descriptions.Item>
                  <Descriptions.Item label="Thời gian hẹn">{dayjs(selectedBooking.bookingTime).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">{selectedBooking.address}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">{selectedBooking.note || 'Không có ghi chú'}</Descriptions.Item>
                  <Descriptions.Item label="Hoàn thành lúc">
                    {selectedBooking.completedAt ? dayjs(selectedBooking.completedAt).format('DD/MM/YYYY HH:mm') : 'Chưa hoàn thành'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card className="rounded-2xl">
                <Descriptions title="Tiền và thanh toán" column={1} size="small">
                  <Descriptions.Item label="Giá dịch vụ">{formatCurrency(selectedBooking.totalPrice)}</Descriptions.Item>
                  <Descriptions.Item label="Tiền tip">{selectedBooking.tipAmount ? formatCurrency(selectedBooking.tipAmount) : 'Chưa tip'}</Descriptions.Item>
                  <Descriptions.Item label="Tổng sau tip">
                    <span className="font-semibold text-emerald-600">{formatCurrency(totalWithTip)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức">{selectedBooking.paymentMethod || 'CASH'}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái thanh toán">{selectedBooking.paymentStatus || 'PENDING'}</Descriptions.Item>
                  <Descriptions.Item label="Mã giảm giá">{selectedBooking.couponCode || 'Không dùng'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          </div>
        ) : (
          <Empty description="Không tìm thấy đơn hàng" />
        )}
      </Modal>

      <Modal
        title="Đánh giá kỹ thuật viên"
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          setReviewBookingId(null);
        }}
        footer={null}
      >
        <div className="mb-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Receipt size={16} />
            <span className="font-semibold">Đơn #{reviewBooking?.id}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User size={16} />
            <span>{reviewBooking?.technicianName || 'Không có thông tin kỹ thuật viên'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <DollarSign size={16} />
            <span>Giá dịch vụ: {formatCurrency(reviewBooking?.totalPrice)}</span>
          </div>
        </div>

        <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview}>
          <Form.Item
            name="rating"
            label="Chấm điểm"
            rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item name="comment" label="Nhận xét">
            <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." />
          </Form.Item>

          <Form.Item
            name="tipAmount"
            label="Tiền tip cho thợ"
            extra="Để 0 nếu bạn chưa muốn tip."
          >
            <InputNumber
              className="w-full"
              min={0}
              step={10000}
              formatter={(value) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => Number((value || '0').toString().replace(/\./g, ''))}
              placeholder="Ví dụ: 50000"
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button onClick={() => {
              setIsReviewModalOpen(false);
              setReviewBookingId(null);
            }} className="mr-2">
              Đóng
            </Button>
            <Button type="primary" htmlType="submit" loading={submittingReview} icon={<CheckCircle2 size={16} />}>
              Gửi đánh giá
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Hủy đơn hàng" open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)} footer={null}>
        <div className="mb-4">
          <p className="font-semibold">Đơn hàng: <span className="text-blue-600">#{cancelBooking?.id}</span></p>
          <p className="text-sm text-slate-500">Kỹ thuật viên đã nhận đơn: <strong>{cancelBooking?.technicianName}</strong></p>
          <p className="mt-2 text-sm text-orange-600">Đơn hàng đã có kỹ thuật viên nhận, vui lòng cho biết lý do hủy.</p>
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
