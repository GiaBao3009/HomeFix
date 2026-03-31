import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import ServiceList from './pages/ServiceList';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AdminServiceManager from './pages/AdminServiceManager';
import AdminUserManager from './pages/AdminUserManager';
import BookingPage from './pages/BookingPage';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianProfilePage from './pages/TechnicianProfilePage';
import TechnicianWallet from './pages/TechnicianWallet';
import AdminDispatch from './pages/AdminDispatch';
import AdminCategoryManager from './pages/AdminCategoryManager';
import AdminCouponManager from './pages/AdminCouponManager';
import OrderHistory from './pages/OrderHistory';
import PaymentGateway from './pages/PaymentGateway';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

import OAuth2Redirect from './pages/OAuth2Redirect';
import ReviewPage from './pages/ReviewPage';

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
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/payment/gateway" element={<PrivateRoute><PaymentGateway /></PrivateRoute>} />
                    <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
                    <Route path="/review/:bookingId" element={<ReviewPage />} />
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
            </main>
            <Footer />
        </div>
    );
}

export default App;
