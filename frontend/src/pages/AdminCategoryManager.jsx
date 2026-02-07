import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Upload } from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon } from 'lucide-react';
import api from '../services/api';

const { TextArea } = Input;

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
            console.error("Error fetching categories:", error);
            message.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { 
            title: 'Icon', 
            dataIndex: 'iconUrl', 
            key: 'iconUrl',
            render: (url) => url ? <img src={url} alt="icon" className="object-cover w-8 h-8 rounded" /> : null
        },
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button icon={<Edit size={16} />} onClick={() => {
                        setEditingCategory(record);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }} />
                    <Button danger icon={<Trash size={16} />} onClick={() => Modal.confirm({
                        title: 'Xóa danh mục?',
                        content: 'Hành động này sẽ xóa tất cả dịch vụ trong danh mục này.',
                        onOk: () => handleDelete(record.id)
                    })} />
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Danh mục</h1>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => {
                    setEditingCategory(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}>Thêm Danh mục</Button>
            </div>

            <Table dataSource={categories} columns={columns} rowKey="id" loading={loading} />

            <Modal
                title={editingCategory ? "Sửa Danh mục" : "Thêm Danh mục"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="iconUrl" label="Icon URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Icon">
                        <Space direction="vertical">
                            {iconUrl && (
                                <img 
                                    src={iconUrl} 
                                    alt="Category Icon" 
                                    className="object-cover w-20 h-20 rounded border"
                                />
                            )}
                            <Upload
                                customRequest={({ file, onSuccess, onError }) => handleUpload({ 
                                    file, 
                                    onSuccess: (data) => {
                                        form.setFieldValue('iconUrl', data.fileUrl);
                                        onSuccess(data);
                                    }, 
                                    onError 
                                })}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadIcon size={16} />}>Tải ảnh lên</Button>
                            </Upload>
                        </Space>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">Lưu</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCategoryManager;
