import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Empty,
    Form,
    Input,
    InputNumber,
    List,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd';
import {
    Download,
    Edit,
    FileSpreadsheet,
    Package,
    Plus,
    Search,
    Trash,
    Upload as UploadIcon,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const CATEGORY_FILTER_ALL = 'ALL';
const SERVICE_COLUMNS = ['categoryName', 'name', 'price', 'description', 'detailedDescription', 'imageUrl', 'imageUrls', 'status'];

const AdminServiceManager = () => {
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);

    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const [packageForm] = Form.useForm();
    const [imageLinkInput, setImageLinkInput] = useState('');

    const packageImageUrl = Form.useWatch('imageUrl', { form: packageForm, preserve: true });
    const packageImageUrls = Form.useWatch('imageUrls', { form: packageForm, preserve: true }) || [];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, pkgRes] = await Promise.all([api.get('/services/categories'), api.get('/services/packages')]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Không thể tải dữ liệu dịch vụ'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const isValidHttpUrl = (value) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const resetPackageModal = () => {
        setIsPackageModalOpen(false);
        setEditingPackage(null);
        setImageLinkInput('');
        packageForm.resetFields();
    };

    const handlePackageUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newUrl = response.data.fileUrl;
            const currentUrls = packageForm.getFieldValue('imageUrls') || [];
            const newUrls = [...currentUrls, newUrl];

            packageForm.setFieldValue('imageUrls', newUrls);
            if (!packageForm.getFieldValue('imageUrl')) {
                packageForm.setFieldValue('imageUrl', newUrl);
            }

            onSuccess?.(response.data);
            message.success('Tải ảnh lên thành công');
        } catch (error) {
            onError?.(error);
            message.error(getApiErrorMessage(error, 'Tải ảnh lên thất bại'));
        }
    };

    const handleRemovePackageImage = (urlToRemove) => {
        const currentUrls = packageForm.getFieldValue('imageUrls') || [];
        const newUrls = currentUrls.filter((url) => url !== urlToRemove);
        packageForm.setFieldValue('imageUrls', newUrls);

        if (packageForm.getFieldValue('imageUrl') === urlToRemove) {
            packageForm.setFieldValue('imageUrl', newUrls[0] || '');
        }
    };

    const handleAddImageLink = () => {
        const url = imageLinkInput.trim();

        if (!url) {
            message.warning('Vui lòng nhập link ảnh');
            return;
        }
        if (!isValidHttpUrl(url)) {
            message.error('Link ảnh không hợp lệ');
            return;
        }

        const currentUrls = packageForm.getFieldValue('imageUrls') || [];
        if (currentUrls.includes(url)) {
            message.info('Link ảnh đã tồn tại');
            return;
        }

        const newUrls = [...currentUrls, url];
        packageForm.setFieldValue('imageUrls', newUrls);
        if (!packageForm.getFieldValue('imageUrl')) {
            packageForm.setFieldValue('imageUrl', url);
        }

        setImageLinkInput('');
        message.success('Đã thêm link ảnh');
    };

    const handlePackageSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (editingPackage) {
                await api.put(`/services/packages/${editingPackage.id}`, values);
                message.success('Cập nhật dịch vụ thành công');
            } else {
                await api.post('/services/packages', values);
                message.success('Tạo dịch vụ thành công');
            }
            resetPackageModal();
            await fetchData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Thao tác thất bại'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePackage = async (id) => {
        try {
            await api.delete(`/services/packages/${id}`);
            message.success('Xóa dịch vụ thành công');
            await fetchData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Xóa thất bại'));
        }
    };

    const handleImportFile = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        setImporting(true);

        try {
            const response = await api.post('/admin/catalog-import/packages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = response.data || {};
            const warningCount = Array.isArray(data.warnings) ? data.warnings.length : 0;
            message.success(
                `Import xong: tạo ${data.createdCount || 0}, cập nhật ${data.updatedCount || 0}, bỏ qua ${data.skippedCount || 0}${warningCount ? `, cần xem ${warningCount} cảnh báo` : ''}`,
            );
            onSuccess?.(response.data);
            await fetchData();
        } catch (error) {
            onError?.(error);
            message.error(getApiErrorMessage(error, 'Import Excel thất bại'));
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const response = await api.get('/admin/catalog-import/packages/template', {
                responseType: 'blob',
            });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'homefix-service-template.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            message.success('Đã tải file mẫu dịch vụ');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Tải file mẫu thất bại'));
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const filteredPackages = useMemo(() => {
        const q = packageSearch.trim().toLowerCase();
        return packages.filter((servicePackage) => {
            const nameOk = !q || (servicePackage.name || '').toLowerCase().includes(q);
            const catOk =
                categoryFilter === CATEGORY_FILTER_ALL || Number(servicePackage.categoryId) === Number(categoryFilter);
            return nameOk && catOk;
        });
    }, [packages, packageSearch, categoryFilter]);

    const serviceSummary = useMemo(
        () => ({
            services: packages.length,
            categories: categories.length,
        }),
        [packages, categories],
    );

    const packageColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 80,
            render: (url) =>
                url ? (
                    <img src={url} alt="" className="mx-auto h-10 w-10 rounded-xl border border-slate-200 object-cover" />
                ) : (
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                        -
                    </div>
                ),
        },
        { title: 'Tên dịch vụ', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value}</Text> },
        { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (value) => {
                const amount = value != null ? Number(value) : NaN;
                if (Number.isNaN(amount)) return '-';
                return `${amount.toLocaleString('vi-VN')} đ`;
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 170,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<Edit size={16} />}
                        onClick={() => {
                            setEditingPackage(record);
                            packageForm.setFieldsValue({
                                ...record,
                                imageUrls: Array.isArray(record.imageUrls)
                                    ? record.imageUrls
                                    : record.imageUrl
                                      ? [record.imageUrl]
                                      : [],
                            });
                            setImageLinkInput('');
                            setIsPackageModalOpen(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Button
                        danger
                        icon={<Trash size={16} />}
                        onClick={() =>
                            Modal.confirm({
                                title: 'Xóa dịch vụ?',
                                content:
                                    'Hệ thống sẽ chặn nếu dịch vụ đã có booking. Chỉ xóa khi bạn chắc chắn nó chưa được sử dụng.',
                                okText: 'Xóa',
                                okType: 'danger',
                                cancelText: 'Hủy',
                                onOk: () => handleDeletePackage(record.id),
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <Title level={3} className="!mb-0">
                            Quản lý Dịch vụ
                        </Title>
                        <Text type="secondary">
                            {serviceSummary.services} dịch vụ • {serviceSummary.categories} danh mục
                        </Text>
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
                            setEditingPackage(null);
                            packageForm.resetFields();
                            setImageLinkInput('');
                            setIsPackageModalOpen(true);
                        }}
                    >
                        Thêm dịch vụ
                    </Button>
                </Space>
            </div>

            <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.75rem] bg-gradient-to-br from-white via-emerald-50 to-lime-50 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Tag color="green" className="!rounded-full !px-3 !py-1 !text-xs !font-semibold">
                                Excel workflow
                            </Tag>
                            <Tag className="!rounded-full !border-slate-200 !bg-white !px-3 !py-1 !text-xs !text-slate-600">
                                Import theo cột
                            </Tag>
                        </div>
                        <Text strong className="block text-lg text-slate-900">
                            Tải file mẫu dịch vụ và import thẳng
                        </Text>
                        <Text type="secondary" className="mt-2 block max-w-2xl leading-7">
                            File mẫu có sẵn cột category, tên dịch vụ, giá, mô tả và hình ảnh. Bạn có thể điền bằng tay,
                            copy từ bảng nội bộ hoặc export từ hệ thống khác rồi import lại.
                        </Text>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button
                                icon={<Download size={16} />}
                                size="large"
                                className="!h-11 !rounded-xl !border-slate-300 !bg-white !px-5"
                                loading={downloadingTemplate}
                                onClick={handleDownloadTemplate}
                            >
                                Tải file mẫu
                            </Button>
                            <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={handleImportFile}>
                                <Button
                                    icon={<FileSpreadsheet size={16} />}
                                    size="large"
                                    className="!h-11 !rounded-xl !px-5"
                                    loading={importing}
                                >
                                    Import ngay
                                </Button>
                            </Upload>
                        </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                        <Text strong className="mb-3 block text-slate-900">
                            Cột hỗ trợ trong template
                        </Text>
                        <List
                            size="small"
                            dataSource={SERVICE_COLUMNS}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <code className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">{item}</code>
                                </List.Item>
                            )}
                        />
                        <Text type="secondary" className="mt-3 block text-xs leading-6">
                            Bắt buộc: `categoryName` hoặc `categoryId`, `name`, `price`. Trùng tên dịch vụ trong cùng danh
                            mục thì hệ thống sẽ cập nhật.
                        </Text>
                    </div>
                </div>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            <Package size={14} className="text-slate-500" />
                            Dịch vụ: {serviceSummary.services}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                            Danh mục: {serviceSummary.categories}
                        </span>
                    </div>
                    <Space wrap className="w-full lg:w-auto">
                        <Input
                            allowClear
                            prefix={<Search size={16} className="text-slate-400" />}
                            placeholder="Tìm theo tên dịch vụ..."
                            value={packageSearch}
                            onChange={(event) => setPackageSearch(event.target.value)}
                            className="min-w-[220px] flex-1 lg:max-w-sm"
                        />
                        <Select
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            className="min-w-[220px]"
                            placeholder="Lọc danh mục"
                        >
                            <Option value={CATEGORY_FILTER_ALL}>Tất cả danh mục</Option>
                            {(categories || []).map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Space>
                </div>

                <Table
                    dataSource={filteredPackages}
                    columns={packageColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    locale={{ emptyText: <Empty description="Chưa có dịch vụ nào" /> }}
                />
            </Card>

            <Modal
                title={editingPackage ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
                open={isPackageModalOpen}
                onCancel={resetPackageModal}
                footer={null}
                width={640}
                destroyOnClose
            >
                <Form
                    form={packageForm}
                    onFinish={handlePackageSubmit}
                    layout="vertical"
                    className="[&_.ant-form-item]:mb-5 [&_.ant-form-item:last-child]:mb-0"
                >
                    <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                        <Select size="large" placeholder="Chọn danh mục">
                            {(categories || []).map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true, message: 'Nhập tên dịch vụ' }]}>
                        <Input size="large" placeholder="VD: Bảo trì máy lạnh" />
                    </Form.Item>
                    <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Nhập giá dịch vụ' }]}>
                        <InputNumber className="w-full" min={0} size="large" placeholder="Nhập giá" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả ngắn">
                        <TextArea rows={2} placeholder="Mô tả ngắn..." />
                    </Form.Item>
                    <Form.Item name="detailedDescription" label="Mô tả chi tiết">
                        <TextArea rows={5} placeholder="Mô tả chi tiết, xuống dòng để tạo đoạn mới..." />
                    </Form.Item>
                    <Form.Item name="imageUrl" label="Image URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item name="imageUrls" label="Danh sách ảnh" hidden>
                        <Select mode="tags" />
                    </Form.Item>
                    <Form.Item label="Hình ảnh">
                        <div className="space-y-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Input
                                    value={imageLinkInput}
                                    onChange={(event) => setImageLinkInput(event.target.value)}
                                    placeholder="Dán link ảnh (https://...)"
                                    size="large"
                                    onPressEnter={(event) => {
                                        event.preventDefault();
                                        handleAddImageLink();
                                    }}
                                />
                                <Button size="large" onClick={handleAddImageLink} className="shrink-0 sm:w-auto">
                                    Thêm link
                                </Button>
                            </div>

                            {imageLinkInput.trim() && isValidHttpUrl(imageLinkInput.trim()) && (
                                <div className="h-24 w-40">
                                    <img
                                        src={imageLinkInput.trim()}
                                        alt="preview"
                                        className="h-full w-full rounded-xl border border-slate-200 object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4">
                                {(packageImageUrls.length ? packageImageUrls : [packageImageUrl])
                                    .filter(Boolean)
                                    .map((url, index) => (
                                        <div key={`${url}-${index}`} className="group relative h-20 w-32">
                                            <img
                                                src={url}
                                                alt={`service-${index}`}
                                                className="h-full w-full rounded-xl border border-slate-200 object-cover"
                                            />
                                            <div className="absolute inset-0 hidden items-center justify-center rounded-xl bg-black/50 group-hover:flex">
                                                <Button
                                                    danger
                                                    size="small"
                                                    icon={<Trash size={14} />}
                                                    onClick={() => handleRemovePackageImage(url)}
                                                />
                                            </div>
                                            {url === packageImageUrl && (
                                                <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-blue-500 px-2 py-0.5 text-xs text-white">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            <Upload customRequest={handlePackageUpload} showUploadList={false} accept="image/*" multiple>
                                <Button icon={<UploadIcon size={16} />} size="large">
                                    Thêm ảnh
                                </Button>
                            </Upload>

                            <Text type="secondary" className="block text-xs leading-relaxed">
                                Ảnh đầu tiên sẽ là ảnh đại diện. Bạn có thể thêm gallery để service hiển thị đầy đủ hơn.
                            </Text>
                        </div>
                    </Form.Item>
                    <Form.Item className="mb-0 mt-2">
                        <Button type="primary" htmlType="submit" size="large" className="w-full" loading={submitting}>
                            Lưu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminServiceManager;
