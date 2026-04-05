import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    List,
    Modal,
    Select,
    Space,
    Table,
    Typography,
    Upload,
    Tag,
    message,
} from 'antd';
import { Download, Edit, FileSpreadsheet, Package, Plus, Search, Trash, Upload as UploadIcon } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CATEGORY_FILTER_ALL = 'ALL';
const SERVICE_IMPORT_COLUMNS = [
    'categoryName or categoryId',
    'name',
    'price',
    'description',
    'detailedDescription',
    'imageUrl',
    'imageUrls',
    'status',
];

const AdminServiceManager = () => {
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [packageForm] = Form.useForm();
    const [imageLinkInput, setImageLinkInput] = useState('');
    const packageImageUrl = Form.useWatch('imageUrl', { form: packageForm, preserve: true });
    const packageImageUrls = Form.useWatch('imageUrls', { form: packageForm, preserve: true }) || [];

    const isValidHttpUrl = (value) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, pkgRes] = await Promise.all([api.get('/services/categories'), api.get('/services/packages')]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Khong the tai du lieu dich vu'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetPackageModal = () => {
        setEditingPackage(null);
        setImageLinkInput('');
        packageForm.resetFields();
        setIsPackageModalOpen(false);
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
            message.success('Tai anh thanh cong');
        } catch (error) {
            onError?.(error);
            message.error(getApiErrorMessage(error, 'Tai anh that bai'));
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

    const handlePackageSubmit = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                imageUrls: Array.isArray(values.imageUrls) ? values.imageUrls : [],
            };
            if (editingPackage) {
                await api.put(`/services/packages/${editingPackage.id}`, payload);
                message.success('Cap nhat dich vu thanh cong');
            } else {
                await api.post('/services/packages', payload);
                message.success('Tao dich vu thanh cong');
            }
            resetPackageModal();
            await fetchData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Thao tac that bai'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePackage = async (id) => {
        try {
            await api.delete(`/services/packages/${id}`);
            message.success('Xoa dich vu thanh cong');
            await fetchData();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Xoa that bai'));
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
                `Import xong: tao ${data.createdCount || 0}, cap nhat ${data.updatedCount || 0}, bo qua ${data.skippedCount || 0}${warningCount ? `, can xem ${warningCount} canh bao` : ''}`,
            );
            onSuccess?.(response.data);
            await fetchData();
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
            message.success('Da tai file mau dich vu');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Tai file mau that bai'));
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleAddImageLink = () => {
        const url = imageLinkInput.trim();
        if (!url) {
            message.warning('Vui long nhap link anh');
            return;
        }
        if (!isValidHttpUrl(url)) {
            message.error('Link anh khong hop le');
            return;
        }
        const currentUrls = packageForm.getFieldValue('imageUrls') || [];
        if (currentUrls.includes(url)) {
            message.info('Link anh da ton tai');
            return;
        }
        const nextUrls = [...currentUrls, url];
        packageForm.setFieldValue('imageUrls', nextUrls);
        if (!packageForm.getFieldValue('imageUrl')) {
            packageForm.setFieldValue('imageUrl', url);
        }
        setImageLinkInput('');
    };

    const filteredPackages = useMemo(() => {
        const query = packageSearch.trim().toLowerCase();
        return packages.filter((item) => {
            const matchesName = !query || (item.name || '').toLowerCase().includes(query);
            const matchesCategory =
                categoryFilter === CATEGORY_FILTER_ALL || Number(item.categoryId) === Number(categoryFilter);
            return matchesName && matchesCategory;
        });
    }, [packages, packageSearch, categoryFilter]);

    const packageColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Anh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 84,
            render: (url) =>
                url ? (
                    <img src={url} alt="" className="h-10 w-10 rounded-xl border border-slate-200 object-cover" />
                ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                        --
                    </div>
                ),
        },
        { title: 'Ten dich vu', dataIndex: 'name', key: 'name' },
        { title: 'Danh muc', dataIndex: 'categoryName', key: 'categoryName' },
        {
            title: 'Gia',
            dataIndex: 'price',
            key: 'price',
            render: (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`,
        },
        {
            title: 'Hanh dong',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size={8}>
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
                    />
                    <Button
                        danger
                        icon={<Trash size={16} />}
                        onClick={() =>
                            Modal.confirm({
                                title: 'Xoa dich vu?',
                                content: 'Dich vu da co lich su dat don thi nen khoa hoac chuyen trang thai thay vi xoa.',
                                okText: 'Xoa',
                                okType: 'danger',
                                cancelText: 'Huy',
                                onOk: () => handleDeletePackage(record.id),
                            })
                        }
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-5 p-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <Title level={3} className="!mb-0">
                            Quan ly Dich vu
                        </Title>
                        <Text type="secondary">
                            {packages.length} dich vu, {categories.length} danh muc
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
                        Them dich vu
                    </Button>
                </Space>
            </div>

            <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[1.75rem] bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Tag color="green" className="!rounded-full !px-3 !py-1 !text-xs !font-semibold">
                                Batch import
                            </Tag>
                            <Tag className="!rounded-full !border-slate-200 !bg-white !px-3 !py-1 !text-xs !text-slate-600">
                                Mau xlsx san
                            </Tag>
                        </div>
                        <Text strong className="block text-lg text-slate-900">
                            Tai template dep san, dien du lieu va import mot lan
                        </Text>
                        <Text type="secondary" className="mt-2 block max-w-2xl leading-7">
                            Template da co day du cot, vi du mau va sheet huong dan. He thong se doc formula trong cot gia va
                            update neu trung ten dich vu trong cung danh muc.
                        </Text>
                        <Text type="secondary" className="mt-2 block leading-7">
                            `imageUrls` co the ghi nhieu link cach nhau boi dau phay, dau cham phay hoac xuong dong.
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
                            dataSource={SERVICE_IMPORT_COLUMNS}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <code className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">{item}</code>
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            </Card>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Space wrap className="w-full lg:w-auto">
                    <Input
                        allowClear
                        prefix={<Search size={16} className="text-slate-400" />}
                        placeholder="Tim theo ten dich vu..."
                        value={packageSearch}
                        onChange={(event) => setPackageSearch(event.target.value)}
                        className="min-w-[220px]"
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        className="min-w-[220px]"
                        placeholder="Loc danh muc"
                    >
                        <Option value={CATEGORY_FILTER_ALL}>Tat ca danh muc</Option>
                        {categories.map((category) => (
                            <Option key={category.id} value={category.id}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </div>

            <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <Table dataSource={filteredPackages} columns={packageColumns} rowKey="id" loading={loading} />
            </Card>

            <Modal
                title={editingPackage ? 'Sua dich vu' : 'Them dich vu'}
                open={isPackageModalOpen}
                onCancel={resetPackageModal}
                footer={null}
                width={620}
            >
                <Form form={packageForm} onFinish={handlePackageSubmit} layout="vertical" className="mt-4">
                    <Form.Item name="categoryId" label="Danh muc" rules={[{ required: true, message: 'Chon danh muc' }]}>
                        <Select size="large" placeholder="Chon danh muc">
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="name" label="Ten dich vu" rules={[{ required: true, message: 'Nhap ten dich vu' }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="price" label="Gia" rules={[{ required: true, message: 'Nhap gia dich vu' }]}>
                        <InputNumber className="w-full" min={0} size="large" />
                    </Form.Item>
                    <Form.Item name="description" label="Mo ta ngan">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="detailedDescription" label="Mo ta chi tiet">
                        <TextArea rows={5} />
                    </Form.Item>
                    <Form.Item name="imageUrl" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item name="imageUrls" hidden>
                        <Select mode="tags" />
                    </Form.Item>
                    <Form.Item label="Hinh anh">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    size="large"
                                    value={imageLinkInput}
                                    onChange={(event) => setImageLinkInput(event.target.value)}
                                    placeholder="Dan link anh (https://...)"
                                    onPressEnter={(event) => {
                                        event.preventDefault();
                                        handleAddImageLink();
                                    }}
                                />
                                <Button size="large" onClick={handleAddImageLink}>
                                    Them link
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {(packageImageUrls.length ? packageImageUrls : [packageImageUrl])
                                    .filter(Boolean)
                                    .map((url) => (
                                        <div key={url} className="group relative h-20 w-32">
                                            <img src={url} alt="service-preview" className="h-full w-full rounded-xl border object-cover" />
                                            <div className="absolute inset-0 hidden items-center justify-center rounded-xl bg-black/45 group-hover:flex">
                                                <Button danger size="small" icon={<Trash size={14} />} onClick={() => handleRemovePackageImage(url)} />
                                            </div>
                                            {url === packageImageUrl && (
                                                <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                            <Upload customRequest={handlePackageUpload} showUploadList={false} accept="image/*" multiple>
                                <Button icon={<UploadIcon size={16} />} size="large">
                                    Them anh
                                </Button>
                            </Upload>
                        </div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large" className="w-full" loading={submitting}>
                        Luu
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminServiceManager;
