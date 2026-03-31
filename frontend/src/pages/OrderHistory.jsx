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
  PENDING: { color: 'orange', text: 'Cho xu ly' },
  CONFIRMED: { color: 'cyan', text: 'Da xac nhan' },
  ASSIGNED: { color: 'blue', text: 'Da co tho' },
  IN_PROGRESS: { color: 'processing', text: 'Dang thuc hien' },
  ARRIVED: { color: 'geekblue', text: 'Da den noi' },
  WORKING: { color: 'purple', text: 'Dang lam viec' },
  COMPLETED: { color: 'success', text: 'Hoan thanh' },
  CANCELLED: { color: 'error', text: 'Da huy' },
  DECLINED: { color: 'red', text: 'Bi tu choi' }
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
    message.success(`Don #${targetBooking.id} vua hoan thanh. Ban co the danh gia va tip cho tho ngay bay gio.`);
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
        message.error('Khong the tai lich su don hang');
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
      message.success('Danh gia thanh cong. Cam on ban!');
      setIsReviewModalOpen(false);
      setReviewBookingId(null);
      reviewForm.resetFields();
      await fetchBookings({ silent: true });
    } catch (error) {
      console.error('Review error:', error);
      message.error(error.response?.data?.message || 'Khong the gui danh gia');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelClick = (booking) => {
    const hasTechnician = booking.technicianName && booking.technicianName !== 'Chua co';
    if (!hasTechnician) {
      Modal.confirm({
        title: 'Xac nhan huy don',
        content: `Ban co chac chan muon huy don hang #${booking.id}?`,
        okText: 'Huy don',
        cancelText: 'Khong',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await api.post(`/bookings/${booking.id}/cancel`, {});
            message.success('Da huy don hang thanh cong');
            fetchBookings({ silent: true });
          } catch (e) {
            message.error(e.response?.data?.message || e.response?.data || 'Khong the huy don');
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
      message.success('Da gui yeu cau huy don thanh cong');
      setCancelModalOpen(false);
      fetchBookings({ silent: true });
    } catch (e) {
      message.error(e.response?.data?.message || e.response?.data || 'Khong the huy don');
    } finally {
      setCancellingBooking(false);
    }
  };

  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ARRIVED'];

  const columns = [
    {
      title: 'Ma don',
      dataIndex: 'id',
      key: 'id',
      render: (value) => <span className="font-bold text-slate-700">#{value}</span>
    },
    {
      title: 'Dich vu',
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
      title: 'Lich hen',
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
      title: 'Tam tinh',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => <span className="font-semibold text-slate-700">{formatCurrency(value)}</span>
    },
    {
      title: 'Trang thai',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag
    },
    {
      title: 'Hanh dong',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailBookingId(record.id)}>Chi tiet</Button>
          {record.status === 'COMPLETED' && !record.reviewed && (
            <Button type="primary" ghost size="small" icon={<Star size={14} />} onClick={() => handleOpenReview(record)}>
              Danh gia
            </Button>
          )}
          {record.status === 'COMPLETED' && record.reviewed && (
            <Tag color="green" className="rounded-full px-3 py-1">Da danh gia</Tag>
          )}
          {cancellableStatuses.includes(record.status) && (
            <Button danger size="small" icon={<XCircle size={14} />} onClick={() => handleCancelClick(record)}>
              Huy don
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
          <Title level={2} className="!mb-1">Don hang cua toi</Title>
          <Text type="secondary">Trang nay tu dong cap nhat tien do don va mo popup review khi don hoan thanh.</Text>
        </div>
        <Space>
          <Tag color="blue" className="rounded-full px-3 py-1">
            Cap nhat {lastUpdatedAt ? lastUpdatedAt.format('HH:mm:ss') : '...'}
          </Tag>
          <Button icon={<RefreshCw size={16} />} onClick={() => fetchBookings()}>
            Lam moi
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
          locale={{ emptyText: <Empty description="Ban chua co don hang nao" /> }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedBooking ? `Chi tiet don hang #${selectedBooking.id}` : 'Chi tiet don hang'}
        open={Boolean(detailBookingId)}
        onCancel={() => setDetailBookingId(null)}
        width={920}
        footer={[
          selectedBooking?.status === 'COMPLETED' && !selectedBooking?.reviewed ? (
            <Button key="review" type="primary" onClick={() => handleOpenReview(selectedBooking)}>
              Danh gia va tip
            </Button>
          ) : null,
          <Button key="close" onClick={() => setDetailBookingId(null)}>Dong</Button>
        ]}
      >
        {selectedBooking ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <Text type="secondary">Trang thai hien tai</Text>
                  <div className="mt-1">{renderStatusTag(selectedBooking.status)}</div>
                </div>
                {selectedBooking.reviewed && (
                  <Tag color="green" className="rounded-full px-3 py-1">Da danh gia</Tag>
                )}
              </div>
              {selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'DECLINED' ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                  Don hang nay khong con trong luong xu ly.
                </div>
              ) : (
                <Steps current={Math.max(PROGRESS_STEPS.indexOf(selectedBooking.status), 0)} size="small" items={progressItems} />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <Descriptions title="Thong tin cong viec" column={1} size="small">
                  <Descriptions.Item label="Dich vu">{selectedBooking.serviceName}</Descriptions.Item>
                  <Descriptions.Item label="Ky thuat vien">{selectedBooking.technicianName || 'Dang cho phan cong'}</Descriptions.Item>
                  <Descriptions.Item label="Thoi gian hen">{dayjs(selectedBooking.bookingTime).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                  <Descriptions.Item label="Dia chi">{selectedBooking.address}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chu">{selectedBooking.note || 'Khong co ghi chu'}</Descriptions.Item>
                  <Descriptions.Item label="Hoan thanh luc">
                    {selectedBooking.completedAt ? dayjs(selectedBooking.completedAt).format('DD/MM/YYYY HH:mm') : 'Chua hoan thanh'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card className="rounded-2xl">
                <Descriptions title="Tien va thanh toan" column={1} size="small">
                  <Descriptions.Item label="Gia dich vu">{formatCurrency(selectedBooking.totalPrice)}</Descriptions.Item>
                  <Descriptions.Item label="Tien tip">{selectedBooking.tipAmount ? formatCurrency(selectedBooking.tipAmount) : 'Chua tip'}</Descriptions.Item>
                  <Descriptions.Item label="Tong sau tip">
                    <span className="font-semibold text-emerald-600">{formatCurrency(totalWithTip)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phuong thuc">{selectedBooking.paymentMethod || 'CASH'}</Descriptions.Item>
                  <Descriptions.Item label="Trang thai thanh toan">{selectedBooking.paymentStatus || 'PENDING'}</Descriptions.Item>
                  <Descriptions.Item label="Ma giam gia">{selectedBooking.couponCode || 'Khong dung'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          </div>
        ) : (
          <Empty description="Khong tim thay don hang" />
        )}
      </Modal>

      <Modal
        title="Danh gia ky thuat vien"
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
            <span className="font-semibold">Don #{reviewBooking?.id}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User size={16} />
            <span>{reviewBooking?.technicianName || 'Khong co thong tin ky thuat vien'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <DollarSign size={16} />
            <span>Gia dich vu: {formatCurrency(reviewBooking?.totalPrice)}</span>
          </div>
        </div>

        <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview}>
          <Form.Item
            name="rating"
            label="Cham diem"
            rules={[{ required: true, message: 'Vui long chon so sao' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item name="comment" label="Nhan xet">
            <Input.TextArea rows={4} placeholder="Chia se trai nghiem cua ban..." />
          </Form.Item>

          <Form.Item
            name="tipAmount"
            label="Tien tip cho tho"
            extra="De 0 neu ban chua muon tip."
          >
            <InputNumber
              className="w-full"
              min={0}
              step={10000}
              formatter={(value) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => Number((value || '0').toString().replace(/\./g, ''))}
              placeholder="Vi du: 50000"
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button onClick={() => {
              setIsReviewModalOpen(false);
              setReviewBookingId(null);
            }} className="mr-2">
              Dong
            </Button>
            <Button type="primary" htmlType="submit" loading={submittingReview} icon={<CheckCircle2 size={16} />}>
              Gui danh gia
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Huy don hang" open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)} footer={null}>
        <div className="mb-4">
          <p className="font-semibold">Don hang: <span className="text-blue-600">#{cancelBooking?.id}</span></p>
          <p className="text-sm text-slate-500">Ky thuat vien da nhan don: <strong>{cancelBooking?.technicianName}</strong></p>
          <p className="mt-2 text-sm text-orange-600">Don hang da co ky thuat vien nhan, vui long cho biet ly do huy.</p>
        </div>
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelSubmit}>
          <Form.Item name="reason" label="Ly do huy don" rules={[{ required: true, message: 'Vui long nhap ly do huy don' }]}>
            <Input.TextArea rows={4} placeholder="Nhap ly do huy don hang..." />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Button onClick={() => setCancelModalOpen(false)} className="mr-2">Quay lai</Button>
            <Button type="primary" danger htmlType="submit" loading={cancellingBooking}>Xac nhan huy</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderHistory;
