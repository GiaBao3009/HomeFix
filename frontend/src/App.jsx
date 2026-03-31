import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ServiceList = lazy(() => import('./pages/ServiceList'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const AdminServiceManager = lazy(() => import('./pages/AdminServiceManager'));
const AdminUserManager = lazy(() => import('./pages/AdminUserManager'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard'));
const TechnicianProfilePage = lazy(() => import('./pages/TechnicianProfilePage'));
const TechnicianWallet = lazy(() => import('./pages/TechnicianWallet'));
const AdminDispatch = lazy(() => import('./pages/AdminDispatch'));
const AdminCategoryManager = lazy(() => import('./pages/AdminCategoryManager'));
const AdminCouponManager = lazy(() => import('./pages/AdminCouponManager'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const OAuth2Redirect = lazy(() => import('./pages/OAuth2Redirect'));

function LoadingFallback() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center min-h-[40vh] gap-4 py-16" role="status" aria-live="polite">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-black text-white shadow-lg shadow-blue-500/30">
                HF
            </div>
            <div className="text-center">
                <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">HomeFix</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đang tải trang…</p>
            </div>
            <div className="h-9 w-9 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin dark:border-slate-700 dark:border-t-cyan-400" />
        </div>
    );
}

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return roles.includes(user.role) ? children : <Navigate to="/" />;
};

function App() {
    const { darkMode } = useTheme();
    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/review/:bookingId" element={<ReviewPage />} />
                        <Route path="/payment/gateway" element={<PrivateRoute><PaymentGateway /></PrivateRoute>} />
                        <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <PrivateRoute>
                                    <OrderHistory />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/messages"
                            element={
                                <PrivateRoute>
                                    <MessagesPage />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/services" element={<ServiceList />} />
                        <Route path="/services/:id" element={<ServiceDetailPage />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route
                            path="/booking/:serviceId"
                            element={
                                <PrivateRoute>
                                    <BookingPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/technician/dashboard"
                            element={
                                <RoleRoute roles={['TECHNICIAN']}>
                                    <TechnicianDashboard />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/technician/profile"
                            element={
                                <RoleRoute roles={['TECHNICIAN']}>
                                    <TechnicianProfilePage />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/technician/wallet"
                            element={
                                <RoleRoute roles={['TECHNICIAN']}>
                                    <TechnicianWallet />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/admin/dispatch"
                            element={
                                <RoleRoute roles={['ADMIN']}>
                                    <AdminDispatch />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/admin/categories"
                            element={
                                <RoleRoute roles={['ADMIN']}>
                                    <AdminCategoryManager />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/admin/services"
                            element={
                                <RoleRoute roles={['ADMIN']}>
                                    <AdminServiceManager />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <RoleRoute roles={['ADMIN']}>
                                    <AdminUserManager />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/admin/coupons"
                            element={
                                <RoleRoute roles={['ADMIN']}>
                                    <AdminCouponManager />
                                </RoleRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

export default App;
