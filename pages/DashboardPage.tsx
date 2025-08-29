



import React from 'react';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/Layout/MainLayout';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import EmployeeDashboard from '../components/Dashboard/EmployeeDashboard';
import ManageEmployees from '../components/Admin/ManageEmployees';
import ManageProjects from '../components/Admin/ManageProjects';
import ManageBilling from '../components/Admin/ManageBilling';
import BillingForm from '../components/Admin/BillingForm';
import AdminBillingCalculator from '../components/Admin/AdminBillingCalculator'; 
import ManageLeaveRequests from '../components/Admin/ManageLeaveRequests'; 
import AdminSendNotification from '../components/Admin/AdminSendNotification'; 
import ViewAttendanceReports from '../components/Admin/ViewAttendanceReports'; 
import ViewWorkReports from '../components/Admin/ViewWorkReports'; 
import Register from '../components/Register'; // Import Register component
import CalendarPage from './CalendarPage'; // Import Calendar page
import ManageEvents from '../components/Admin/ManageEvents'; // Import Manage Events page
import ManageTraining from '../components/Admin/ManageTraining';
import OrgChart from '../components/Admin/OrgChart';


import SubmitWorkReportForm from '../components/Employee/SubmitWorkReportForm';
import WorkReportHistory from '../components/Employee/WorkReportHistory';
import ApplyLeaveForm from '../components/Employee/ApplyLeaveForm'; 
import LeaveHistoryView from '../components/Employee/LeaveHistoryView'; 
import EmployeeProfile from '../components/Employee/EmployeeProfile';
import MyBillingRecords from '../components/Employee/MyBillingRecords'; 
import TrainingPage from '../components/Employee/TrainingPage';
import UserMessagesPage from '../components/User/UserMessagesPage'; 
import ChangePasswordPage from '../components/User/ChangePasswordPage'; 
import PersonalNotebook from '../components/User/PersonalNotebook'; 
import FeatureVotingPage from '../components/User/FeatureVotingPage';

import { UserRole } from '../types';
import { THEME } from '../constants';
import { useLocation } from 'react-router-dom';


const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <MainLayout>
        <div className={`flex justify-center items-center h-full text-lg text-${THEME.accentText}`}>Loading dashboard...</div>
      </MainLayout>
    );
  }

  if (!user) {
    // This should ideally not be reached if ProtectedRoute works, but as a fallback.
    return (
      <MainLayout>
        <div className={`flex justify-center items-center h-full text-lg text-red-500`}>User not found. Please login again.</div>
      </MainLayout>
    );
  }
  
  // location.pathname will be like "/app/admin/employees". We need to match based on the part after "/app"
  const baseAppPath = '/app';
  const relativePath = location.pathname.startsWith(baseAppPath) 
    ? location.pathname.substring(baseAppPath.length) 
    : location.pathname; // Should always start with /app if routed correctly

  // Ensure relativePath starts with a single '/' for consistent matching, or is empty if base /app
  const path = relativePath === '' ? '/' : (relativePath.startsWith('/') ? relativePath : '/' + relativePath);


  // Universal routes first (relative to /app)
  if (path === '/messages') {
    return <MainLayout><UserMessagesPage /></MainLayout>;
  }
  if (path === '/notebook') {
    return <MainLayout><PersonalNotebook /></MainLayout>;
  }
  if (path === '/change-password') {
    return <MainLayout><ChangePasswordPage /></MainLayout>;
  }
  if (path === '/calendar') {
    return <MainLayout><CalendarPage /></MainLayout>;
  }
  if (path === '/feature-voting') {
    return <MainLayout><FeatureVotingPage /></MainLayout>;
  }


  if(user.role === UserRole.ADMIN) {
    if (path === '/admin/employees') {
      return <MainLayout><ManageEmployees /></MainLayout>;
    }
    if (path === '/admin/register') { // New route for admin to register users
      return <MainLayout><Register /></MainLayout>;
    }
    if (path === '/admin/org-chart') {
      return <MainLayout><OrgChart /></MainLayout>;
    }
    if (path === '/admin/projects') {
      return <MainLayout><ManageProjects /></MainLayout>;
    }
    if (path === '/admin/billing/new') {
       return <MainLayout><BillingForm /></MainLayout>;
    }
    // Match /admin/billing/edit/:recordId
    const editBillingMatch = path.match(/^\/admin\/billing\/edit\/([^/]+)$/);
    if (editBillingMatch) {
      // Pass recordId to BillingForm or let BillingForm use useParams itself
      return <MainLayout><BillingForm /></MainLayout>;
    }
    if (path === ('/admin/billing')) { 
      return <MainLayout><ManageBilling /></MainLayout>;
    }
    if (path === ('/admin/billing-calculator')) { 
      return <MainLayout><AdminBillingCalculator /></MainLayout>;
    }
    if (path === ('/admin/leave-requests')) {
      return <MainLayout><ManageLeaveRequests /></MainLayout>;
    }
    if (path === ('/admin/send-notification')) {
      return <MainLayout><AdminSendNotification /></MainLayout>;
    }
    if (path === ('/admin/attendance-reports')) {
      return <MainLayout><ViewAttendanceReports /></MainLayout>;
    }
    if (path === ('/admin/work-reports')) {
      return <MainLayout><ViewWorkReports /></MainLayout>;
    }
    if (path === ('/admin/events')) {
      return <MainLayout><ManageEvents /></MainLayout>;
    }
    if (path === ('/admin/training')) {
        return <MainLayout><ManageTraining /></MainLayout>;
    }
  } else if (user.role === UserRole.EMPLOYEE) {
     if (path === ('/employee/profile')) {
      return <MainLayout><EmployeeProfile /></MainLayout>;
    }
    if (path === ('/employee/submit-report')) {
      return <MainLayout><SubmitWorkReportForm /></MainLayout>;
    }
    if (path === ('/employee/report-history')) {
      return <MainLayout><WorkReportHistory /></MainLayout>;
    }
    if (path === ('/employee/apply-leave')) {
      return <MainLayout><ApplyLeaveForm /></MainLayout>;
    }
    if (path === ('/employee/leave-history')) {
      return <MainLayout><LeaveHistoryView /></MainLayout>;
    }
    if (path === ('/employee/training')) {
        return <MainLayout><TrainingPage /></MainLayout>;
    }
    if (path === ('/employee/my-billing')) {
      return <MainLayout><MyBillingRecords /></MainLayout>;
    }
  }

  // Default Dashboard (main page after login, e.g. path is '/app' or '/app/')
  if (path === '/' || path === '') {
    return (
      <MainLayout>
        {user.role === UserRole.ADMIN ? <AdminDashboard /> : <EmployeeDashboard />}
      </MainLayout>
    );
  }
  
  // Fallback for unmatched paths under /app
  return (
    <MainLayout>
       <div className={`p-6 bg-white rounded-xl shadow-lg`}>
            <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Page Not Found</h2>
            <p className={`mt-2 text-${THEME.accentText}`}>The page you are looking for under '/app{path}' does not exist or you do not have permission to view it.</p>
          </div>
    </MainLayout>
  );
};

export default DashboardPage;