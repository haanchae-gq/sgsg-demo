import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainApp from './MainApp';
import OrderDetail from '../screens/orders/Detail';
import ServiceMapping from '../screens/services/Mapping';
import Reviews from '../screens/reviews/Reviews';
import Notifications from '../screens/notifications/Notifications';
import SubAccounts from '../screens/accounts/SubAccounts';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<MainApp />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/services/mapping" element={<ServiceMapping />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/sub-accounts" element={<SubAccounts />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;