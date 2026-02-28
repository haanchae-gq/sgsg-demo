import React from 'react';
import { NavBar, Grid, Card, Button } from 'antd-mobile';
import { MailOutline, CalendarOutline, CheckCircleOutline, WalletOutline } from 'antd-mobile-icons';

const HomeScreen: React.FC = () => {
  const features = [
    { icon: <MailOutline />, title: 'Orders', count: '5 new' },
    { icon: <CalendarOutline />, title: 'Schedule', count: '3 today' },
    { icon: <CheckCircleOutline />, title: 'Completed', count: '24 this week' },
    { icon: <WalletOutline />, title: 'Earnings', count: '₩1,240,000' },
  ];

  return (
    <div className="p-4">
      <NavBar back={null} className="mb-4">
        Expert Dashboard
      </NavBar>
      
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2">Welcome back, Expert!</h1>
        <p className="text-gray-600">Here's your today's overview</p>
      </div>

      <Grid columns={2} gap={8} className="mb-6">
        {features.map((item, index) => (
          <Grid.Item key={index}>
            <Card className="text-center p-3">
              <div className="text-2xl mb-2 text-blue-500">{item.icon}</div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.count}</div>
            </Card>
          </Grid.Item>
        ))}
      </Grid>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Today's Schedule</h2>
        <Card className="mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Air conditioner installation</div>
              <div className="text-sm text-gray-500">10:00 AM - 12:00 PM</div>
              <div className="text-sm">Seoul, Gangnam-gu</div>
            </div>
            <Button size="small" color="primary">Start</Button>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Kitchen cleaning</div>
              <div className="text-sm text-gray-500">2:00 PM - 4:00 PM</div>
              <div className="text-sm">Seoul, Mapo-gu</div>
            </div>
            <Button size="small" color="primary">Navigate</Button>
          </div>
        </Card>
      </div>

      <Button block color="primary" size="large">
        View All Orders
      </Button>
    </div>
  );
};

export default HomeScreen;