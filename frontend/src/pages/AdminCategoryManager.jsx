import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Upload, Card, Typography, Empty } from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon, Layers } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';

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
            message.error(getApiErrorMessage(error, 'Khong the tai danh muc'));
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
                message.success('Cap nhat danh muc thanh cong');
            } else {
                await api.post('/categories', values);
                message.success('Tao danh muc thanh cong');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error(error);
            message.error(getApiErrorMessage(error, 'Thao tac that bai'));
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            message.success('Xoa danh muc thanh cong');
            fetchCategories();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Xoa that bai'));
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
            message.success('Tai anh thanh cong');
        } catch (error) {
            onError(error);
            message.error(getApiErrorMessage(error, 'Tai anh that bai'));
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
        {
            title: 'Icon',
            dataIndex: 'iconUrl',
            key: 'iconUrl',
            width: 70,
            render: (url) =>
                url ? (
                    <img src={url} alt="icon" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Layers size={16} className="text-slate-400" />
                    </div>
                ),
        },
        { title: 'Ten danh muc', dataIndex: 'name', key: 'name', render: (textValue) => <Text strong>{textValue}</Text> },
        { title: 'Mo ta', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Hanh dong',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size={4}>
                    <Button
                        size="small"
                        icon={<Edit size={14} />}
                        onClick={() => {
                            setEditingCategory(record);
                            form.setFieldsValue(record);
                            setIsModalOpen(true);
                        }}
                    >
                        Sua
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<Trash size={14} />}
                        onClick={() =>
                            Modal.confirm({
                                title: 'Xoa danh muc?',
                                content:
                                    'He thong se khong cho xoa neu danh muc van con dich vu. Hay chuyen dich vu sang danh muc khac truoc de bao toan lich su don hang.',
                                okText: 'Xoa',
                                okType: 'danger',
                                cancelText: 'Huy',
                                onOk: () => handleDelete(record.id),
                            })
                        }
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2 !mb-0">
                        <Layers size={22} className="text-blue-600" />
                        Quan ly Danh muc
                    </h2>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        {categories.length} danh muc
                    </span>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => {
                        setEditingCategory(null);
                        form.resetFields();
                        setIsModalOpen(true);
                    }}
                >
                    Them danh muc
                </Button>
            </div>

            <Card bordered={false} className="!rounded-xl shadow-sm">
                <Table
                    dataSource={categories}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    locale={{ emptyText: <Empty description="Chua co danh muc nao" /> }}
                />
            </Card>

            <Modal
                title={editingCategory ? 'Sua danh muc' : 'Them danh muc moi'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical" className="mt-4">
                    <Form.Item name="name" label="Ten danh muc" rules={[{ required: true, message: 'Nhap ten danh muc' }]}>
                        <Input placeholder="VD: Dien lanh, Sua ong nuoc..." />
                    </Form.Item>
                    <Form.Item name="description" label="Mo ta">
                        <TextArea rows={3} placeholder="Mo ta ngan ve danh muc..." />
                    </Form.Item>
                    <Form.Item name="iconUrl" label="Icon URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Icon danh muc">
                        <div className="flex items-center gap-4">
                            {iconUrl ? (
                                <img src={iconUrl} alt="Icon" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                                    <Layers size={24} className="text-slate-400" />
                                </div>
                            )}
                            <Upload
                                customRequest={({ file, onSuccess, onError }) =>
                                    handleUpload({
                                        file,
                                        onSuccess: (data) => {
                                            form.setFieldValue('iconUrl', data.fileUrl);
                                            onSuccess(data);
                                        },
                                        onError,
                                    })
                                }
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadIcon size={16} />}>Tai anh len</Button>
                            </Upload>
                        </div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">
                        Luu
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCategoryManager;
