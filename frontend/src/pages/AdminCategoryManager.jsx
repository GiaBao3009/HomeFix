import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Upload, Card, Typography, Empty } from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon, Layers } from 'lucide-react';
import api from '../services/api';

const { TextArea } = Input;
const { Text } = Typography;

const AdminCategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form] = Form.useForm();
    const iconUrl = Form.useWatch('iconUrl', form);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (values) => {
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, values);
                message.success('Cập nhật danh mục thành công');
            } else {
                await api.post('/categories', values);
                message.success('Tạo danh mục thành công');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error(error);
            message.error('Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            message.success('Xóa danh mục thành công');
            fetchCategories();
        } catch (error) {
            message.error('Xóa thất bại');
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess(response.data);
            message.success('Tải ảnh thành công');
        } catch (error) {
            onError(error);
            message.error('Tải ảnh thất bại');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
        {
            title: 'Icon',
            dataIndex: 'iconUrl',
            key: 'iconUrl',
            width: 70,
            render: (url) => url
                ? <img src={url} alt="icon" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Layers size={16} className="text-slate-400" /></div>
        },
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name', render: (t) => <Text strong>{t}</Text> },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size={4}>
                    <Button size="small" icon={<Edit size={14} />} onClick={() => {
                        setEditingCategory(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }}>Sửa</Button>
                    <Button size="small" danger icon={<Trash size={14} />} onClick={() => Modal.confirm({
                        title: 'Xóa danh mục?',
                        content: 'Hành động này sẽ xóa tất cả dịch vụ trong danh mục.',
                        okText: 'Xóa',
                        okType: 'danger',
                        cancelText: 'Hủy',
                        onOk: () => handleDelete(record.id)
                    })} />
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2 !mb-0">
                        <Layers size={22} className="text-blue-600" />
                        Quản lý Danh mục
                    </h2>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        {categories.length} danh mục
                    </span>
                </div>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => {
                    setEditingCategory(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}>Thêm danh mục</Button>
            </div>

            <Card bordered={false} className="!rounded-xl shadow-sm">
                <Table
                    dataSource={categories}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    locale={{ emptyText: <Empty description="Chưa có danh mục nào" /> }}
                />
            </Card>

            <Modal
                title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical" className="mt-4">
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
                        <Input placeholder="VD: Điện lạnh, Sửa ống nước..." />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={3} placeholder="Mô tả ngắn về danh mục..." />
                    </Form.Item>
                    <Form.Item name="iconUrl" label="Icon URL" hidden><Input /></Form.Item>
                    <Form.Item label="Icon danh mục">
                        <div className="flex items-center gap-4">
                            {iconUrl ? (
                                <img src={iconUrl} alt="Icon" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                                    <Layers size={24} className="text-slate-400" />
                                </div>
                            )}
                            <Upload
                                customRequest={({ file, onSuccess, onError }) => handleUpload({
                                    file,
                                    onSuccess: (data) => { form.setFieldValue('iconUrl', data.fileUrl); onSuccess(data); },
                                    onError
                                })}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadIcon size={16} />}>Tải ảnh lên</Button>
                            </Upload>
                        </div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">Lưu</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCategoryManager;
