import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import ServiceList from './pages/ServiceList';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AdminServiceManager from './pages/AdminServiceManager';
import BookingPage from './pages/BookingPage';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDispatch from './pages/AdminDispatch';
import AdminCouponManager from './pages/AdminCouponManager';
import OrderHistory from './pages/OrderHistory';
import PaymentGateway from './pages/PaymentGateway';
import About from './pages/About';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';

import OAuth2Redirect from './pages/OAuth2Redirect';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
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
                            <PrivateRoute>
                                <TechnicianDashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/admin/dispatch" 
                        element={
                            <PrivateRoute>
                                <AdminDispatch />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/admin/services" 
                        element={
                            <PrivateRoute>
                                <AdminServiceManager />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/admin/coupons" 
                        element={
                            <PrivateRoute>
                                <AdminCouponManager />
                            </PrivateRoute>
                        } 
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;
