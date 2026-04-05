import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Empty,
    Form,
    Input,
    List,
    Modal,
    Space,
    Table,
    Typography,
    Upload,
    Tag,
    message,
} from 'antd';
import { Download, Edit, FileSpreadsheet, Layers, Plus, Trash, Upload as UploadIcon } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';

const { Text, Title } = Typography;
const { TextArea } = Input;

const CATEGORY_COLUMNS = ['name', 'description', 'iconUrl'];

const AdminCategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [importing, setImporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [form] = Form.useForm();
    const iconUrl = Form.useWatch('iconUrl', form);

    const categoryCountLabel = useMemo(() => `${categories.length} danh muc`, [categories.length]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Khong the tai danh muc'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetModal = () => {
        setEditingCategory(null);
        form.resetFields();
        setIsModalOpen(false);
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, values);
                message.success('Cap nhat danh muc thanh cong');
            } else {
                await api.post('/categories', values);
                message.success('Tao danh muc thanh cong');
            }
            resetModal();
            await fetchCategories();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Thao tac that bai'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            message.success('Xoa danh muc thanh cong');
            await fetchCategories();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Xoa that bai'));
        }
    };

    const handleIconUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            form.setFieldValue('iconUrl', response.data.fileUrl);
            onSuccess?.(response.data);
            message.success('Tai icon thanh cong');
        } catch (error) {
            onError?.(error);
            message.error(getApiErrorMessage(error, 'Tai icon that bai'));
        }
    };

    const handleImportFile = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        setImporting(true);
        try {
            const response = await api.post('/admin/catalog-import/categories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = response.data || {};
            const warningCount = Array.isArray(data.warnings) ? data.warnings.length : 0;
            message.success(
                `Import xong: tao ${data.createdCount || 0}, cap nhat ${data.updatedCount || 0}, bo qua ${data.skippedCount || 0}${warningCount ? `, can xem ${warningCount} canh bao` : ''}`,
            );
            onSuccess?.(response.data);
            await fetchCategories();
        } catch (error) {
            onError?.(error);
            message.error(getApiErrorMessage(error, 'Import Excel that bai'));
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const response = await api.get('/admin/catalog-import/categories/template', {
                responseType: 'blob',
            });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'homefix-category-template.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            message.success('Da tai file mau danh muc');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Tai file mau that bai'));
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Icon',
            dataIndex: 'iconUrl',
            key: 'iconUrl',
            width: 88,
            render: (url) =>
                url ? (
                    <img src={url} alt="icon" className="h-10 w-10 rounded-xl border border-slate-200 object-cover" />
                ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                        <Layers size={16} className="text-slate-400" />
                    </div>
                ),
        },
        {
            title: 'Ten danh muc',
            dataIndex: 'name',
            key: 'name',
            render: (value) => <Text strong>{value}</Text>,
        },
        { title: 'Mo ta', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Hanh dong',
            key: 'actions',
            width: 160,
            render: (_, record) => (
                <Space size={8}>
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
                                content: 'Danh muc chi nen xoa khi da chuyen het dich vu sang noi khac.',
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Layers size={20} />
                    </div>
                    <div>
                        <Title level={3} className="!mb-0">
                            Quan ly Danh muc
                        </Title>
                        <Text type="secondary">{categoryCountLabel}</Text>
                    </div>
                </div>
                <Space wrap>
                    <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={handleImportFile}>
                        <Button icon={<FileSpreadsheet size={16} />} loading={importing}>
                            Import Excel
                        </Button>
                    </Upload>
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
                </Space>
            </div>

            <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.75rem] bg-gradient-to-br from-white via-sky-50 to-blue-50 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Tag color="blue" className="!rounded-full !px-3 !py-1 !text-xs !font-semibold">
                                Excel workflow
                            </Tag>
                            <Tag className="!rounded-full !border-slate-200 !bg-white !px-3 !py-1 !text-xs !text-slate-600">
                                Import theo cot
                            </Tag>
                        </div>
                        <Text strong className="block text-lg text-slate-900">
                            Tai file mau roi dien vao cho nhanh
                        </Text>
                        <Text type="secondary" className="mt-2 block max-w-2xl leading-7">
                            File mau da co san header dung format cho HomeFix. Admin chi viec tai xuong, dien du lieu vao sheet dau
                            tien, sau do import thang len he thong.
                        </Text>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button
                                icon={<Download size={16} />}
                                size="large"
                                className="!h-11 !rounded-xl !border-slate-300 !bg-white !px-5"
                                loading={downloadingTemplate}
                                onClick={handleDownloadTemplate}
                            >
                                Tai file mau
                            </Button>
                            <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={handleImportFile}>
                                <Button icon={<FileSpreadsheet size={16} />} size="large" className="!h-11 !rounded-xl !px-5" loading={importing}>
                                    Import ngay
                                </Button>
                            </Upload>
                        </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                        <Text strong className="block mb-3 text-slate-900">
                            Cot ho tro trong template
                        </Text>
                        <List
                            size="small"
                            dataSource={CATEGORY_COLUMNS}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <code className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">{item}</code>
                                </List.Item>
                            )}
                        />
                        <Text type="secondary" className="mt-3 block text-xs leading-6">
                            `name` la bat buoc. Neu trung ten danh muc cu, he thong se cap nhat thay vi tao ban ghi moi.
                        </Text>
                    </div>
                </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 shadow-sm">
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
                onCancel={resetModal}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
                    <Form.Item name="name" label="Ten danh muc" rules={[{ required: true, message: 'Nhap ten danh muc' }]}>
                        <Input placeholder="VD: Dien lanh, Son nha..." />
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
                                <img src={iconUrl} alt="icon-preview" className="h-16 w-16 rounded-2xl border border-slate-200 object-cover" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                                    <Layers size={24} className="text-slate-400" />
                                </div>
                            )}
                            <Upload customRequest={handleIconUpload} showUploadList={false} accept="image/*">
                                <Button icon={<UploadIcon size={16} />}>Tai icon len</Button>
                            </Upload>
                        </div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full" loading={submitting}>
                        Luu
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCategoryManager;
