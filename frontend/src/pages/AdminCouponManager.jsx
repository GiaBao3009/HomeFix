import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Card, Space, Tag, Tooltip } from 'antd';
import { Plus, Edit, Trash2, Tag as TagIcon, Search } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const AdminCouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      message.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = () => {
    setEditingCoupon(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCoupon(record);
    form.setFieldsValue({
      ...record,
      validUntil: record.validUntil ? dayjs(record.validUntil) : null,
      isActive: record.status === 'ACTIVE',
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa mã giảm giá này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/coupons/${id}`);
          message.success('Xóa mã giảm giá thành công');
          fetchCoupons();
        } catch (error) {
          console.error('Error deleting coupon:', error);
          message.error('Không thể xóa mã giảm giá');
        }
      },
    });
  };

  const handleSave = async (values) => {
    try {
      const couponData = {
        ...values,
        validUntil: values.validUntil ? values.validUntil.toISOString() : null,
        status: values.isActive ? 'ACTIVE' : 'DISABLED',
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, couponData);
        message.success('Cập nhật mã giảm giá thành công');
      } else {
        await api.post('/coupons', couponData);
        message.success('Thêm mã giảm giá thành công');
      }
      setIsModalVisible(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      message.error('Lỗi khi lưu mã giảm giá');
    }
  };

  const columns = [
    {
      title: 'Mã Coupon',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>{text}</Tag>,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return String(record.code).toLowerCase().includes(value.toLowerCase()) ||
               String(record.description).toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      render: (percent) => <Tag color="green">{percent}%</Tag>,
    },
    {
      title: 'Giảm tối đa',
      dataIndex: 'maxDiscountAmount',
      key: 'maxDiscountAmount',
      render: (amount) => amount ? `${amount.toLocaleString()} đ` : 'Không giới hạn',
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (value) => value ? `${value.toLocaleString()} đ` : '0 đ',
    },
    {
      title: 'Hết hạn',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Vĩnh viễn',
    },
    {
      title: 'Số lượng',
      dataIndex: 'usageLimit',
      key: 'usageLimit',
      render: (limit, record) => (
        <span>{record.usedCount} / {limit || '∞'}</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const isExpired = record.expiryDate && dayjs(record.expiryDate).isBefore(dayjs());
        const isDepleted = record.usageLimit && record.usedCount >= record.usageLimit;
        
        if (!record.isActive) return <Tag color="red">Đã khóa</Tag>;
        if (isExpired) return <Tag color="orange">Hết hạn</Tag>;
        if (isDepleted) return <Tag color="volcano">Hết lượt</Tag>;
        return <Tag color="green">Đang hoạt động</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Edit size={18} />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<Trash2 size={18} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card 
        title={
          <div className="flex gap-2 items-center">
            <TagIcon size={24} className="text-blue-600" />
            <span className="text-xl font-bold">Quản lý Mã Giảm Giá</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<Plus size={18} />} onClick={handleAdd} className="bg-blue-600">
            Thêm mã mới
          </Button>
        }
      >
        <div className="mb-4">
            <Input 
                placeholder="Tìm kiếm mã coupon..." 
                prefix={<Search size={18} className="text-gray-400" />} 
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
            />
        </div>

        <Table 
          columns={columns} 
          dataSource={coupons} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }} 
        />
      </Card>

      <Modal
        title={editingCoupon ? 'Chỉnh sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ isActive: true, usageLimit: 100 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="Mã Coupon"
              rules={[{ required: true, message: 'Vui lòng nhập mã coupon!' }]}
            >
              <Input placeholder="VD: SALE50, TET2024" style={{ textTransform: 'uppercase' }} />
            </Form.Item>

            <Form.Item
              name="discountPercent"
              label="Phần trăm giảm (%)"
              rules={[{ required: true, message: 'Vui lòng nhập % giảm!' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={2} placeholder="Mô tả chi tiết về mã giảm giá" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="maxDiscountAmount"
              label="Giảm tối đa (VNĐ)"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="minOrderValue"
              label="Đơn tối thiểu (VNĐ)"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="validUntil"
              label="Ngày hết hạn"
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="usageLimit"
              label="Giới hạn số lượng"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
             name="isActive"
             valuePropName="checked"
             label="Kích hoạt ngay"
          >
             <input type="checkbox" className="w-4 h-4" />
          </Form.Item>

          <div className="flex gap-2 justify-end mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCouponManager;
