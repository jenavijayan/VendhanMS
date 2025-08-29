import { Company, User, UserRole, AdminDashboardData, EmployeeDashboardData, StoredUser, BillingRecord, BillingStatus, NewManualBillingRecordData, NewCalculatedBillingRecordData, Project, DailyWorkReport, NewDailyWorkReportData, ProjectLogItemData, LeaveRequest, LeaveType, LeaveStatus, NewLeaveRequestData, ProjectBillingType, EmployeeProfileUpdateData, AttendanceRecord, UserAttendanceStatus, AdminUserUpdateData, InternalMessage, MessageRecipient, WorkReportFilters, ChangePasswordData, EmployeeProjectBillingDetail, ProjectLogItem, MessageAttachment, CompanyEvent, NewCompanyEventData, TrainingMaterial, TrainingCategory, TrainingMaterialType, NotebookEntry, NewNotebookEntryData, NewTrainingMaterialData, UpdateTrainingMaterialData, FeatureSuggestion, FeatureVote, NewFeatureSuggestionData, UIFeatureSuggestion } from '../types';
import { MOCK_API_DELAY } from '../constants';
import { calculateLeaveDays, calculateDecimalHours, formatDate } from '../utils/dateUtils';

// =====================================================================================
// Mock Data Store
// =====================================================================================

// Company details are stored here after initial setup
let mockCompanyDatabase: Company | null = null;
// { id: '1', name: 'Vendhan Info Tech', logoUrl: '/vendhan-logo-placeholder.png' }; // Example if pre-populated

let mockUserDatabase: StoredUser[] = [];
// Example if pre-populated:
// [
//   { id: '1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN, firstName: 'Admin', lastName: 'User', password_hash: 'admin123', department: 'Management', joinDate: '2020-01-01', profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg', phone: '111-222-3333' },
//   { id: '2', username: 'employee1', email: 'employee1@example.com', role: UserRole.EMPLOYEE, firstName: 'John', lastName: 'Doe', password_hash: 'emp123', department: 'Development', joinDate: '2021-06-15', profilePictureUrl: 'https://randomuser.me/api/portraits/men/2.jpg', phone: '444-555-6666' },
// ];


const mockProjects: Project[] = [
    {id: 'proj1', name: 'Website Redesign', billingType: 'hourly', ratePerHour: 75},
    {id: 'proj2', name: 'Mobile App Development', billingType: 'hourly', ratePerHour: 90},
    {id: 'proj3', name: 'Data Entry Batch A', billingType: 'count_based', countMetricLabel: 'Records Processed', countDivisor: 1, countMultiplier: 0.5},
    {id: 'proj4', name: 'Content Moderation X', billingType: 'count_based', countMetricLabel: 'Items Reviewed', countDivisor: 100, countMultiplier: 5},
];

let mockBillingRecords: BillingRecord[] = [];
let mockDailyWorkReports: DailyWorkReport[] = [];
let mockLeaveRequests: LeaveRequest[] = [];
let mockAttendanceRecords: AttendanceRecord[] = [];
const userAttendanceStatusMap = new Map<string, UserAttendanceStatus>();
let mockInternalMessages: InternalMessage[] = [];
let mockCompanyEvents: CompanyEvent[] = [];
let mockNotebookDatabase: NotebookEntry[] = [];
let mockTrainingMaterials: TrainingMaterial[] = [
  {
    id: 'train-01',
    title: 'Welcome to the Team! - Onboarding Guide',
    description: 'Everything you need to know for your first week. Company history, values, and key contacts.',
    category: TrainingCategory.ONBOARDING,
    type: TrainingMaterialType.DOCUMENT_PDF,
    url: '/path/to/mock-onboarding-guide.pdf', // In a real app, this would be a real URL
    thumbnailUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: '45 min read'
  },
  {
    id: 'train-02',
    title: 'Company Code of Conduct',
    description: 'Our commitment to a respectful and inclusive workplace. Required reading for all employees.',
    category: TrainingCategory.COMPANY_POLICIES,
    type: TrainingMaterialType.DOCUMENT_PDF,
    url: '/path/to/mock-code-of-conduct.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: '20 min read'
  },
  {
    id: 'train-03',
    title: 'Introduction to Our Tech Stack',
    description: 'A video overview of the primary technologies we use, from frontend to backend.',
    category: TrainingCategory.TECHNICAL_SKILLS,
    type: TrainingMaterialType.VIDEO,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // A classic example video embed URL
    thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: '12 min video'
  },
  {
    id: 'train-04',
    title: 'Using Our Internal Communication Tool',
    description: 'Learn the best practices for communicating effectively with your team using our primary chat software.',
    category: TrainingCategory.TOOLS_SOFTWARE,
    type: TrainingMaterialType.PRESENTATION,
    url: '/path/to/mock-comm-tool-slides.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587825140708-df876c12b44e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: '30 slides'
  },
  {
    id: 'train-05',
    title: 'Security Best Practices',
    description: 'How to keep your workstation and our company data secure. Phishing awareness and password management.',
    category: TrainingCategory.COMPANY_POLICIES,
    type: TrainingMaterialType.VIDEO,
    url: 'https://www.youtube.com/embed/s6dZ246a5sY', // A sample video
    thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: '8 min video'
  },
  {
    id: 'train-06',
    title: 'Advanced Git Workflow',
    description: 'Learn about our branching strategy, pull request process, and tips for efficient version control.',
    category: TrainingCategory.TECHNICAL_SKILLS,
    type: TrainingMaterialType.EXTERNAL_LINK,
    url: 'https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
    duration: 'Article'
  },
];

let mockFeatureSuggestionsDatabase: FeatureSuggestion[] = [
    {
        id: 'feat-1',
        title: 'Dark Mode for Entire App',
        description: 'A comprehensive dark mode would be easier on the eyes during late-night work sessions and in low-light environments. It should apply to all pages, modals, and components.',
        submittedByUserId: '2', // employee1
        submittedByUserName: 'John Doe',
        submittedByUserProfilePictureUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
        createdAt: '2023-10-20T10:00:00Z',
        voteCount: 2,
    },
    {
        id: 'feat-2',
        title: 'Export Reports to PDF',
        description: 'Currently, we can export to CSV. It would be very helpful to also have an option to export beautifully formatted work reports and billing statements as PDF files for printing or sharing with clients.',
        submittedByUserId: '1', // admin
        submittedByUserName: 'Admin User',
        submittedByUserProfilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        createdAt: '2023-10-22T14:30:00Z',
        voteCount: 1,
    }
];

let mockFeatureVotesDatabase: FeatureVote[] = [
    { suggestionId: 'feat-1', userId: '1' },
    { suggestionId: 'feat-1', userId: '2' },
    { suggestionId: 'feat-2', userId: '1' },
];



// =====================================================================================
// API Functions
// =====================================================================================

// --- User Management Interfaces (kept for consistency with AuthContext) ---
export interface ParsedLoginCredentials {
    username: string;
    password?: string;
}

export interface ParsedRegisterData {
    username: string;
    email: string;
    password?: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string | null;
}

export interface SetupData {
    companyName: string;
    logoUrl: string | null;
    adminData: ParsedRegisterData;
}


// --- Helper to get the auth token ---
const getAuthToken = (): string | null => localStorage.getItem('authToken');

// --- Helper to convert StoredUser to User ---
const stripPassword = (storedUser: StoredUser): User => {
  const { password_hash, ...user } = storedUser;
  return user;
};

// --- Company & Setup API Functions ---
export const apiFetchCompanyDetails = async (): Promise<Company | null> => {
    console.warn("apiFetchCompanyDetails: Called with mock data store.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
    return Promise.resolve(mockCompanyDatabase);
};

export const apiSetupInitialAdmin = async (setupData: SetupData): Promise<void> => {
    console.warn("apiSetupInitialAdmin: Called with mock data store.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));

    // Check if an admin already exists or if company is already set up
    if (mockCompanyDatabase || mockUserDatabase.some(u => u.role === UserRole.ADMIN)) {
        return Promise.reject(new Error("Application has already been set up."));
    }

    // Create the company
    mockCompanyDatabase = {
        id: 'company-1',
        name: setupData.companyName,
        logoUrl: setupData.logoUrl,
    };

    // Create the first admin user
    try {
        await apiRegister(setupData.adminData);
        return Promise.resolve();
    } catch (err) {
        // Rollback company creation if admin creation fails
        mockCompanyDatabase = null;
        return Promise.reject(err);
    }
};


// --- User API Functions ---
export const apiLogin = async (credentials: ParsedLoginCredentials): Promise<{ user: User, token: string }> => {
  console.warn("apiLogin: Called with mock data store.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  
  // Prevent login if setup is not complete
  if (!mockCompanyDatabase || mockUserDatabase.length === 0) {
    return Promise.reject(new Error("System not set up. Please complete the initial setup."));
  }

  const foundUser = mockUserDatabase.find(
    u => u.username === credentials.username && u.password_hash === credentials.password
  );

  if (foundUser) {
    return Promise.resolve({ user: stripPassword(foundUser), token: `fake-token-for-${foundUser.id}` });
  }
  return Promise.reject(new Error('Invalid username or password. Please try again.'));
};

export const apiRegister = async (userData: ParsedRegisterData): Promise<User> => {
  console.warn("apiRegister: Called with mock data store.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));

  if (mockUserDatabase.some(u => u.username === userData.username)) {
    return Promise.reject(new Error('Username already exists.'));
  }
  if (mockUserDatabase.some(u => u.email === userData.email)) {
    return Promise.reject(new Error('Email already exists.'));
  }

  const newUser: StoredUser = {
    id: String(Date.now() + Math.random()), // More unique ID
    username: userData.username,
    email: userData.email,
    password_hash: userData.password || 'defaultPassword123', // Store password directly for mock
    role: userData.role,
    firstName: userData.firstName,
    lastName: userData.lastName,
    profilePictureUrl: userData.profilePictureUrl || null,
    department: 'Not Assigned',
    joinDate: new Date().toISOString().split('T')[0],
    phone: '',
    reportsTo: null,
  };
  mockUserDatabase.push(newUser);
  console.log("Mock DB: Registered new user. Current DB size:", mockUserDatabase.length);
  return Promise.resolve(stripPassword(newUser));
};

export const apiLogout = async (): Promise<void> => {
  console.warn("apiLogout: Called (mock).");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
  return Promise.resolve();
};

export const apiFetchAllUsers = async (): Promise<User[]> => {
  console.warn("apiFetchAllUsers: Called with mock data store.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  console.log("Mock DB: Fetching all users. Count:", mockUserDatabase.length);
  return Promise.resolve(mockUserDatabase.map(stripPassword));
};

export const apiFetchUserById = async (userId: string): Promise<User | undefined> => {
  console.warn(`apiFetchUserById (${userId}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const foundUser = mockUserDatabase.find(u => u.id === userId);
  return Promise.resolve(foundUser ? stripPassword(foundUser) : undefined);
};

export const apiUpdateUserProfile = async (userId: string, updates: EmployeeProfileUpdateData): Promise<User> => {
  console.warn(`apiUpdateUserProfile (${userId}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  
  const userIndex = mockUserDatabase.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return Promise.reject(new Error("User not found for profile update."));
  }
  
  const updatedStoredUser: StoredUser = { 
      ...mockUserDatabase[userIndex], 
      ...updates 
  };
  mockUserDatabase[userIndex] = updatedStoredUser;
  
  console.log("Mock DB: Updated user profile", updatedStoredUser);
  return Promise.resolve(stripPassword(updatedStoredUser));
};

export const apiAdminUpdateUser = async (userId: string, updates: AdminUserUpdateData): Promise<User> => {
  console.warn(`apiAdminUpdateUser (${userId}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  
  const userIndex = mockUserDatabase.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return Promise.reject(new Error("User not found for admin update."));
  }
  
  const updatedStoredUser: StoredUser = {
    ...mockUserDatabase[userIndex], 
    ...updates,                    
    password_hash: mockUserDatabase[userIndex].password_hash 
  };
  
  // Handle reportsTo explicitly: if it's an empty string from the form, set it to null.
  if (updates.reportsTo === '') {
    updatedStoredUser.reportsTo = null;
  }

  mockUserDatabase[userIndex] = updatedStoredUser;
  console.log("Mock DB: Admin updated user", updatedStoredUser);
  return Promise.resolve(stripPassword(updatedStoredUser));
};

export const apiDeleteUser = async (userIdToDelete: string, currentAdminUserId: string): Promise<void> => {
  console.warn(`apiDeleteUser (${userIdToDelete}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  
  if (userIdToDelete === currentAdminUserId) {
    return Promise.reject(new Error("Admins cannot delete their own accounts."));
  }
  
  const initialLength = mockUserDatabase.length;
  mockUserDatabase = mockUserDatabase.filter(u => u.id !== userIdToDelete);
  
  if (mockUserDatabase.length === initialLength) {
    return Promise.reject(new Error("User not found for deletion."));
  }
  
  console.log(`Mock DB: Deleted user ${userIdToDelete}. Current DB size:`, mockUserDatabase.length);
  return Promise.resolve();
};

export const apiChangePassword = async (userId: string, data: ChangePasswordData): Promise<void> => {
    console.warn(`apiChangePassword (${userId}): Called with mock data store.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));

    const userIndex = mockUserDatabase.findIndex(u => u.id === userId);
    if (userIndex === -1) return Promise.reject(new Error("User not found."));

    if (data.currentPassword && mockUserDatabase[userIndex].password_hash !== data.currentPassword) {
        return Promise.reject(new Error("Current password is incorrect."));
    }
    if (data.newPasswordA !== data.newPasswordB) {
        return Promise.reject(new Error("New passwords do not match."));
    }
    if (data.newPasswordA.length < 6) { 
        return Promise.reject(new Error("New password must be at least 6 characters."));
    }

    mockUserDatabase[userIndex].password_hash = data.newPasswordA;
    console.log(`Mock DB: Password changed for user ${userId}`);
    return Promise.resolve();
};

export const apiAdminResetPassword = async (userId: string, newPassword: string): Promise<void> => {
    console.warn(`apiAdminResetPassword (${userId}): Called with mock data store.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));

    const userIndex = mockUserDatabase.findIndex(u => u.id === userId);
    if (userIndex === -1) return Promise.reject(new Error("User not found for password reset."));
    
    if (newPassword.length < 6) { 
        return Promise.reject(new Error("New password must be at least 6 characters."));
    }

    mockUserDatabase[userIndex].password_hash = newPassword;
    console.log(`Mock DB: Password reset by admin for user ${userId}`);
    return Promise.resolve();
};


// --- Dashboard API Functions ---
export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  console.warn("fetchAdminDashboardData: Called with mock data store.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  
  const users = await apiFetchAllUsers();
  const projects = await apiFetchProjects(); 
  const attendance = await apiFetchAllAttendanceRecords({date: new Date().toISOString().split('T')[0]});

  return Promise.resolve({ 
    totalEmployees: users.filter(u => u.role === UserRole.EMPLOYEE).length, 
    activeUsers: users.length, 
    presentToday: attendance.filter(a => a.clockInTime && !a.clockOutTime).length, 
    absentToday: users.filter(u => u.role === UserRole.EMPLOYEE).length - attendance.filter(a => a.clockInTime && !a.clockOutTime).length,  
    ongoingProjects: projects.slice(0, 3).map(p => ({id: p.id, name: p.name}))
  });
};

export const fetchEmployeeDashboardData = async (userId: string): Promise<EmployeeDashboardData> => {
  console.warn(`fetchEmployeeDashboardData (${userId}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  const user = await apiFetchUserById(userId); 
  return Promise.resolve({ 
    personalInfo: {
        phone: user?.phone || 'N/A',
        department: user?.department || 'N/A',
        joinDate: user?.joinDate ? formatDate(user.joinDate) : 'N/A',
    }, 
    quickActions: ['Submit Work Report', 'Apply for Leave'] 
  });
};

// --- Project API Functions (Remains mostly static for now) ---
export const apiFetchProjects = async (): Promise<Project[]> => {
  console.warn("apiFetchProjects: Called with static mock projects.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  return Promise.resolve([...mockProjects]);
};

export const apiFetchProjectById = async (projectId: string): Promise<Project | undefined> => {
  console.warn(`apiFetchProjectById (${projectId}): Called with static mock projects.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
  return Promise.resolve(mockProjects.find(p => p.id === projectId));
};

export const apiAddProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
  console.warn("apiAddProject: Called, adding to static mock projects.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const newProject: Project = { ...projectData, id: `proj${Date.now()}` };
  mockProjects.push(newProject);
  return Promise.resolve(newProject);
};

export const apiUpdateProject = async (projectId: string, updates: Partial<Omit<Project, 'id'>>): Promise<Project> => {
  console.warn(`apiUpdateProject (${projectId}): Called, updating static mock projects.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return Promise.reject(new Error("Project not found"));
  const updatedProject = { ...mockProjects[projectIndex], ...updates };
  mockProjects[projectIndex] = updatedProject;
  return Promise.resolve(updatedProject);
};

export const apiDeleteProject = async (projectId: string): Promise<void> => {
  console.warn(`apiDeleteProject (${projectId}): Called, deleting from static mock projects.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) mockProjects.splice(projectIndex, 1);
  return Promise.resolve();
};

// --- Billing API Functions ---
interface BillingFilters {
  userId?: string;
  status?: BillingStatus;
  projectId?: string;
  actingUserRole?: UserRole;
  startDate?: string;
  endDate?: string;
}

export const apiFetchBillingRecords = async (filters?: BillingFilters): Promise<BillingRecord[]> => {
  console.info("apiFetchBillingRecords: Called with mock billing records (dynamic in-session).");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2)); 
  let filtered = [...mockBillingRecords];
  if(filters?.userId) filtered = filtered.filter(r => r.userId === filters.userId);
  if(filters?.status) filtered = filtered.filter(r => r.status === filters.status);
  if(filters?.projectId) filtered = filtered.filter(r => r.projectId === filters.projectId);
  if(filters?.startDate) filtered = filtered.filter(r => new Date(r.date) >= new Date(filters.startDate!));
  if(filters?.endDate) filtered = filtered.filter(r => new Date(r.date) <= new Date(filters.endDate!));
  
  console.log(`Mock DB (Billing): Fetching records. Filters: ${JSON.stringify(filters)}. Found ${filtered.length} of ${mockBillingRecords.length} total.`);
  return Promise.resolve(filtered);
};

export const apiAddBillingRecord = async (recordData: NewManualBillingRecordData | NewCalculatedBillingRecordData): Promise<BillingRecord> => {
  console.info("apiAddBillingRecord: Called, adding to mock billing records (dynamic in-session).");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  
  const project = mockProjects.find(p => p.id === recordData.projectId);
  const calculatedAmount = 'calculatedAmount' in recordData 
    ? recordData.calculatedAmount 
    : ('hoursBilled' in recordData ? recordData.hoursBilled * (project?.ratePerHour || 0) : 0);

  const newRecord: BillingRecord = {
    id: `br${Date.now()}-${Math.random().toString(16).slice(2)}`,
    isCountBased: 'isCountBased' in recordData ? recordData.isCountBased : false,
    ...recordData,
    projectName: recordData.projectName || project?.name || "Unknown Project",
    calculatedAmount: calculatedAmount,
  };

  mockBillingRecords.push(newRecord);
  console.log("Mock DB (Billing): Added new record:", newRecord);
  console.log("Mock DB (Billing): Current records count:", mockBillingRecords.length);
  return Promise.resolve(newRecord);
};


export const apiUpdateBillingRecord = async (recordId: string, updates: Partial<BillingRecord>): Promise<BillingRecord> => {
  console.info(`apiUpdateBillingRecord (${recordId}): Called, updating mock billing records (dynamic in-session).`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const recordIndex = mockBillingRecords.findIndex(r => r.id === recordId);
  if (recordIndex === -1) return Promise.reject(new Error("Billing record not found"));
  
  const originalRecord = mockBillingRecords[recordIndex];
  const updatedRecord = { ...originalRecord, ...updates };

  if (updatedRecord.isCountBased === false) {
    const hasRateUpdate = updates.rateApplied !== undefined;
    const hasHoursUpdate = updates.hoursBilled !== undefined;

    if (hasHoursUpdate || hasRateUpdate) {
        const project = mockProjects.find(p => p.id === updatedRecord.projectId);
        const rateToUse = updatedRecord.rateApplied ?? project?.ratePerHour ?? 0;
        const hoursToUse = updatedRecord.hoursBilled ?? 0;
        
        updatedRecord.rateApplied = rateToUse; 
        updatedRecord.calculatedAmount = hoursToUse * rateToUse;
    }
  }
  
  mockBillingRecords[recordIndex] = updatedRecord;
  console.log("Mock DB (Billing): Updated record:", updatedRecord);
  return Promise.resolve(updatedRecord);
};


export const apiDeleteBillingRecord = async (recordId: string): Promise<void> => {
  console.info(`apiDeleteBillingRecord (${recordId}): Called, deleting from mock billing records (dynamic in-session).`);
   await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const recordIndex = mockBillingRecords.findIndex(r => r.id === recordId);
  if (recordIndex !== -1) {
    mockBillingRecords.splice(recordIndex, 1);
    console.log("Mock DB (Billing): Deleted record. Current records count:", mockBillingRecords.length);
  } else {
    console.warn("Mock DB (Billing): Record to delete not found:", recordId);
  }
  return Promise.resolve();
};

// --- Daily Work Report API Functions ---
export const apiSubmitDailyWorkReport = async (reportData: NewDailyWorkReportData): Promise<DailyWorkReport> => {
  console.warn("apiSubmitDailyWorkReport: Called, using dynamic mock reports.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  
  const existingReportIndex = mockDailyWorkReports.findIndex(r => r.userId === reportData.userId && r.date === reportData.date);
  
  const finalProjectLogs: ProjectLogItem[] = reportData.projectLogs.map((logData, index) => {
      const project = mockProjects.find(p => p.id === logData.projectId);
      return {
          ...logData, 
          id: `log-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`, 
          projectName: project?.name || "Unknown Project", 
      };
  });

  const newReport: DailyWorkReport = { 
      id: `${reportData.userId}-${reportData.date}-${Date.now()}`, 
      userId: reportData.userId,
      date: reportData.date,
      projectLogs: finalProjectLogs,
      submittedAt: new Date().toISOString(),
  };

  if (existingReportIndex !== -1) {
      mockDailyWorkReports[existingReportIndex] = newReport;
  } else {
      mockDailyWorkReports.push(newReport);
  }
  return Promise.resolve(newReport);
};


export const apiFetchUserDailyWorkReports = async (userId: string, filters?: {startDate?: string, endDate?: string}): Promise<DailyWorkReport[]> => {
  console.warn(`apiFetchUserDailyWorkReports (${userId}): Called, using dynamic mock reports.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  let userReports = mockDailyWorkReports.filter(r => r.userId === userId);
  if (filters?.startDate) userReports = userReports.filter(r => new Date(r.date) >= new Date(filters.startDate!));
  if (filters?.endDate) userReports = userReports.filter(r => new Date(r.date) <= new Date(filters.endDate!));
  return Promise.resolve(userReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
};

export const apiFetchAllDailyWorkReports = async (filters?: WorkReportFilters): Promise<DailyWorkReport[]> => {
  console.warn("apiFetchAllDailyWorkReports: Called, using dynamic mock reports.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  let allReports = [...mockDailyWorkReports];
  if (filters?.userId) allReports = allReports.filter(r => r.userId === filters.userId);
  if (filters?.projectId) allReports = allReports.filter(r => r.projectLogs.some(pl => pl.projectId === filters.projectId));
  if (filters?.startDate) allReports = allReports.filter(r => new Date(r.date) >= new Date(filters.startDate!));
  if (filters?.endDate) allReports = allReports.filter(r => new Date(r.date) <= new Date(filters.endDate!));
  return Promise.resolve(allReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
};

export const apiGetDailyWorkReport = async (userId: string, date: string): Promise<DailyWorkReport | undefined> => {
  console.warn(`apiGetDailyWorkReport (${userId}, ${date}): Called, using dynamic mock reports.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
  return Promise.resolve(mockDailyWorkReports.find(r => r.userId === userId && r.date === date));
};

// --- Leave Management API Functions ---
export const apiApplyForLeave = async (requestData: NewLeaveRequestData): Promise<LeaveRequest> => {
  console.warn("apiApplyForLeave: Called, using dynamic mock leave requests.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const user = await apiFetchUserById(requestData.userId); // Dynamic user
  const newRequest: LeaveRequest = { 
    ...requestData, 
    id: `lr-${Date.now()}`, 
    userFirstName: user?.firstName || 'Unknown', 
    userLastName: user?.lastName || 'User', 
    status: LeaveStatus.PENDING, 
    requestedAt: new Date().toISOString() 
  };
  mockLeaveRequests.push(newRequest);
  return Promise.resolve(newRequest);
};

export const apiFetchUserLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
  console.warn(`apiFetchUserLeaveRequests (${userId}): Called, using dynamic mock leave requests.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  return Promise.resolve(mockLeaveRequests.filter(r => r.userId === userId).sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
};

export const apiFetchAllLeaveRequests = async (filters?: { status?: LeaveStatus, userId?: string, startDate?: string, endDate?: string }): Promise<LeaveRequest[]> => {
  console.warn("apiFetchAllLeaveRequests: Called, using dynamic mock leave requests.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  let allReqs = [...mockLeaveRequests];
  if(filters?.status) allReqs = allReqs.filter(r => r.status === filters.status);
  if(filters?.userId) allReqs = allReqs.filter(r => r.userId === filters.userId);
  if(filters?.startDate) allReqs = allReqs.filter(r => new Date(r.endDate) >= new Date(filters!.startDate!));
  if(filters?.endDate) allReqs = allReqs.filter(r => new Date(r.startDate) <= new Date(filters!.endDate!));
  return Promise.resolve(allReqs.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
};

export const apiUpdateLeaveRequestStatus = async (requestId: string, status: LeaveStatus.APPROVED | LeaveStatus.REJECTED, adminNotes?: string): Promise<LeaveRequest> => {
  console.warn(`apiUpdateLeaveRequestStatus (${requestId}): Called, using dynamic mock leave requests.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const reqIndex = mockLeaveRequests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) return Promise.reject(new Error("Leave request not found"));
  mockLeaveRequests[reqIndex] = { ...mockLeaveRequests[reqIndex], status, adminNotes, resolvedAt: new Date().toISOString() };
  return Promise.resolve(mockLeaveRequests[reqIndex]);
};

export const apiBulkUpdateLeaveRequestStatus = async (
  requestIds: string[], 
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED, 
  adminNotes?: string
): Promise<LeaveRequest[]> => {
  console.warn(`apiBulkUpdateLeaveRequestStatus (${requestIds.join(', ')} to ${status}): Called with mock.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  const updatedRequests: LeaveRequest[] = [];
  let allFound = true;

  for (const requestId of requestIds) {
    const reqIndex = mockLeaveRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) {
      allFound = false; // Or throw error for individual failures
      continue; 
    }
    if (mockLeaveRequests[reqIndex].status === LeaveStatus.PENDING) { // Only update pending requests
        mockLeaveRequests[reqIndex] = { 
            ...mockLeaveRequests[reqIndex], 
            status, 
            adminNotes: adminNotes || mockLeaveRequests[reqIndex].adminNotes, // Preserve old notes if new ones aren't provided
            resolvedAt: new Date().toISOString() 
        };
        updatedRequests.push(mockLeaveRequests[reqIndex]);
    }
  }
  
  if (updatedRequests.length !== requestIds.length && !allFound) {
      // Partial success or some IDs not found/not pending. For mock, just resolve with what was updated.
      // Real API might throw error or return detailed status.
      console.warn("apiBulkUpdateLeaveRequestStatus: Some requests not found or not in pending state.");
  }
  return Promise.resolve(updatedRequests);
};


export const apiCancelLeaveRequest = async (requestId: string, userId: string): Promise<LeaveRequest> => {
  console.warn(`apiCancelLeaveRequest (${requestId}): Called, using dynamic mock leave requests.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  const reqIndex = mockLeaveRequests.findIndex(r => r.id === requestId && r.userId === userId);
  if (reqIndex === -1) return Promise.reject(new Error("Leave request not found or not owned by user"));
  if (mockLeaveRequests[reqIndex].status !== LeaveStatus.PENDING) return Promise.reject(new Error("Only pending requests can be cancelled."));
  mockLeaveRequests[reqIndex] = { ...mockLeaveRequests[reqIndex], status: LeaveStatus.CANCELLED, resolvedAt: new Date().toISOString() };
  return Promise.resolve(mockLeaveRequests[reqIndex]);
};

// --- Attendance API Functions ---
export const apiClockIn = async (userId: string): Promise<AttendanceRecord> => {
  console.warn(`apiClockIn (${userId}): Called, using dynamic mock attendance.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
  
  const existingStatus = userAttendanceStatusMap.get(userId);
  if(existingStatus?.isClockedIn) return Promise.reject(new Error("User is already clocked in."));

  const now = new Date();
  const newRecord: AttendanceRecord = { 
    id: `${userId}-${now.toISOString()}`, 
    userId, 
    date: now.toISOString().split('T')[0], 
    clockInTime: now.toISOString() 
  };
  mockAttendanceRecords.push(newRecord);
  userAttendanceStatusMap.set(userId, {isClockedIn: true, lastClockInTime: newRecord.clockInTime, currentSessionRecordId: newRecord.id});
  return Promise.resolve(newRecord);
};

export const apiClockOut = async (userId: string): Promise<AttendanceRecord> => {
  console.warn(`apiClockOut (${userId}): Called, using dynamic mock attendance.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));

  const currentStatus = userAttendanceStatusMap.get(userId);
  if (!currentStatus?.isClockedIn || !currentStatus.currentSessionRecordId) {
      return Promise.reject(new Error("User is not clocked in or session ID is missing."));
  }
  
  const recordIndex = mockAttendanceRecords.findIndex(r => r.id === currentStatus.currentSessionRecordId);
  if (recordIndex === -1) return Promise.reject(new Error("Attendance record for current session not found."));

  const now = new Date();
  mockAttendanceRecords[recordIndex].clockOutTime = now.toISOString();
  mockAttendanceRecords[recordIndex].totalHours = calculateDecimalHours(mockAttendanceRecords[recordIndex].clockInTime, now.toISOString());
  
  userAttendanceStatusMap.set(userId, {isClockedIn: false, lastClockInTime: mockAttendanceRecords[recordIndex].clockInTime});

  return Promise.resolve(mockAttendanceRecords[recordIndex]);
};


export const apiGetUserTodayAttendanceStatus = async (userId: string): Promise<UserAttendanceStatus> => {
  console.warn(`apiGetUserTodayAttendanceStatus (${userId}): Called, using dynamic mock attendance.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 4));
  const status = userAttendanceStatusMap.get(userId);
  if (status) return Promise.resolve(status);
  return Promise.resolve({ isClockedIn: false }); 
};

export const apiFetchAllAttendanceRecords = async (filters?: { userId?: string, date?: string, startDate?: string, endDate?: string }): Promise<AttendanceRecord[]> => {
  console.warn("apiFetchAllAttendanceRecords: Called, using dynamic mock attendance.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  let filteredRecs = [...mockAttendanceRecords];
  if(filters?.userId) filteredRecs = filteredRecs.filter(r => r.userId === filters.userId);
  if(filters?.date) filteredRecs = filteredRecs.filter(r => r.date === filters.date);
  if(filters?.startDate) filteredRecs = filteredRecs.filter(r => new Date(r.date) >= new Date(filters!.startDate!));
  if(filters?.endDate) filteredRecs = filteredRecs.filter(r => new Date(r.date) <= new Date(filters!.endDate!));
  return Promise.resolve(filteredRecs.sort((a,b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
};

// --- Internal Messaging API Functions ---
export const apiSendInternalMessage = async (messageData: Omit<InternalMessage, 'id' | 'timestamp' | 'isRead' | 'senderName' | 'senderProfilePictureUrl'> & { attachment?: MessageAttachment | null }): Promise<InternalMessage> => {
  console.warn("apiSendInternalMessage: Called, using dynamic mock messages.");
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));
  
  let sender: User | {firstName: string, lastName: string, profilePictureUrl?: string | null} | undefined;
  if (messageData.senderId === 'SYSTEM') {
    sender = {firstName: 'System', lastName: 'Notification', profilePictureUrl: null};
  } else {
    sender = mockUserDatabase.find(u => u.id === messageData.senderId); // Use dynamic user store
  }

  const newMessage: InternalMessage = { 
    id: `msg-${Date.now()}`, 
    senderId: messageData.senderId,
    recipientId: messageData.recipientId,
    content: messageData.content,
    timestamp: new Date().toISOString(), 
    isRead: false, 
    senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Unknown Sender',
    senderProfilePictureUrl: sender?.profilePictureUrl || null,
    relatedEntityId: messageData.relatedEntityId,
    relatedEntityType: messageData.relatedEntityType,
    attachment: messageData.attachment || null,
  };
  mockInternalMessages.push(newMessage);
  console.log("Mock DB (Messages): Added new message:", newMessage);
  return Promise.resolve(newMessage);
};

export const apiFetchUserMessages = async (userId: string): Promise<InternalMessage[]> => {
  console.warn(`apiFetchUserMessages (${userId}): Called, using dynamic mock messages.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
  return Promise.resolve(
    mockInternalMessages
    .filter(msg => msg.recipientId === userId || msg.recipientId === 'ALL_USERS' || msg.senderId === userId)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );
};

export const apiMarkMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  console.warn(`apiMarkMessageAsRead (${messageId}): Called, using dynamic mock messages.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 5));
  const msgIndex = mockInternalMessages.findIndex(m => m.id === messageId && (m.recipientId === userId || m.recipientId === 'ALL_USERS'));
  if (msgIndex !== -1) {
    mockInternalMessages[msgIndex].isRead = true;
  }
  return Promise.resolve();
};

export const apiMarkAllMessagesAsReadForUser = async (userId: string): Promise<void> => {
  console.warn(`apiMarkAllMessagesAsReadForUser (${userId}): Called, using dynamic mock messages.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 4));
  mockInternalMessages.forEach(msg => {
    if ((msg.recipientId === userId || msg.recipientId === 'ALL_USERS') && msg.senderId !== userId) {
      msg.isRead = true;
    }
  });
  return Promise.resolve();
};

export const apiGetUnreadMessageCount = async (userId: string): Promise<number> => {
  console.warn(`apiGetUnreadMessageCount (${userId}): Called, using dynamic mock messages.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 4));
  return Promise.resolve(
    mockInternalMessages.filter(msg => (msg.recipientId === userId || msg.recipientId === 'ALL_USERS') && !msg.isRead && msg.senderId !== userId).length
  );
};

// --- Company Events API Functions ---
export const apiFetchCompanyEvents = async (): Promise<CompanyEvent[]> => {
    console.warn("apiFetchCompanyEvents: Called, using dynamic mock events.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    return Promise.resolve([...mockCompanyEvents]);
};

export const apiAddCompanyEvent = async (eventData: NewCompanyEventData): Promise<CompanyEvent> => {
    console.warn("apiAddCompanyEvent: Called, using dynamic mock events.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    const newEvent: CompanyEvent = {
        ...eventData,
        id: `ce-${Date.now()}`
    };
    mockCompanyEvents.push(newEvent);
    return Promise.resolve(newEvent);
};

export const apiDeleteCompanyEvent = async (eventId: string): Promise<void> => {
    console.warn(`apiDeleteCompanyEvent (${eventId}): Called, using dynamic mock events.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    const eventIndex = mockCompanyEvents.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        mockCompanyEvents.splice(eventIndex, 1);
    }
    return Promise.resolve();
};

// --- Training Materials API ---
export const apiFetchTrainingMaterials = async (): Promise<TrainingMaterial[]> => {
    console.warn("apiFetchTrainingMaterials: Called with static mock data.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    return Promise.resolve([...mockTrainingMaterials]);
};

export const apiAddTrainingMaterial = async (materialData: NewTrainingMaterialData): Promise<TrainingMaterial> => {
    console.warn("apiAddTrainingMaterial: Called, adding to static mock materials.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    const newMaterial: TrainingMaterial = { ...materialData, id: `train-${Date.now()}` };
    mockTrainingMaterials.unshift(newMaterial); // Add to the top
    return Promise.resolve(newMaterial);
};

export const apiUpdateTrainingMaterial = async (materialId: string, updates: UpdateTrainingMaterialData): Promise<TrainingMaterial> => {
    console.warn(`apiUpdateTrainingMaterial (${materialId}): Called, updating static mock materials.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    const materialIndex = mockTrainingMaterials.findIndex(m => m.id === materialId);
    if (materialIndex === -1) return Promise.reject(new Error("Training material not found"));
    const updatedMaterial = { ...mockTrainingMaterials[materialIndex], ...updates };
    mockTrainingMaterials[materialIndex] = updatedMaterial;
    return Promise.resolve(updatedMaterial);
};

export const apiDeleteTrainingMaterial = async (materialId: string): Promise<void> => {
    console.warn(`apiDeleteTrainingMaterial (${materialId}): Called, deleting from static mock materials.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    const materialIndex = mockTrainingMaterials.findIndex(m => m.id === materialId);
    if (materialIndex !== -1) {
        mockTrainingMaterials.splice(materialIndex, 1);
    } else {
        return Promise.reject(new Error("Training material not found for deletion."));
    }
    return Promise.resolve();
};


// --- Notebook API Functions ---

export const apiFetchUserNotebookEntries = async (userId: string): Promise<NotebookEntry[]> => {
  console.warn(`apiFetchUserNotebookEntries (${userId}): Called with mock data store.`);
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
  return Promise.resolve(mockNotebookDatabase.filter(entry => entry.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
};

export const apiAddOrUpdateNotebookEntry = async (entryData: NewNotebookEntryData): Promise<NotebookEntry> => {
    console.warn("apiAddOrUpdateNotebookEntry: Called with mock data store.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    
    const existingEntryIndex = mockNotebookDatabase.findIndex(entry => entry.userId === entryData.userId && entry.date === entryData.date);

    if (existingEntryIndex !== -1) {
        // Update existing entry for the day
        const updatedEntry = { ...mockNotebookDatabase[existingEntryIndex], ...entryData };
        mockNotebookDatabase[existingEntryIndex] = updatedEntry;
        console.log("Mock DB (Notebook): Updated entry.", updatedEntry);
        return Promise.resolve(updatedEntry);
    } else {
        // Create new entry for the day
        const newEntry: NotebookEntry = {
            id: `nb-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...entryData,
        };
        mockNotebookDatabase.push(newEntry);
        console.log("Mock DB (Notebook): Created new entry.", newEntry);
        return Promise.resolve(newEntry);
    }
};

export const apiDeleteNotebookEntry = async (entryId: string, userId: string): Promise<void> => {
    console.warn(`apiDeleteNotebookEntry (${entryId}): Called with mock data store.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));

    const initialLength = mockNotebookDatabase.length;
    mockNotebookDatabase = mockNotebookDatabase.filter(entry => !(entry.id === entryId && entry.userId === userId));

    if (mockNotebookDatabase.length === initialLength) {
        return Promise.reject(new Error("Notebook entry not found for deletion or permissions error."));
    }
    console.log(`Mock DB (Notebook): Deleted entry ${entryId}. Current DB size:`, mockNotebookDatabase.length);
    return Promise.resolve();
};

// --- Feature Voting API ---

export const apiFetchFeatureSuggestions = async (currentUserId: string): Promise<UIFeatureSuggestion[]> => {
    console.warn("apiFetchFeatureSuggestions: Called with mock data store.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));

    const userVotes = new Set(mockFeatureVotesDatabase.filter(v => v.userId === currentUserId).map(v => v.suggestionId));
    
    const uiSuggestions: UIFeatureSuggestion[] = mockFeatureSuggestionsDatabase.map(suggestion => ({
        ...suggestion,
        currentUserHasVoted: userVotes.has(suggestion.id),
    }));

    return Promise.resolve(uiSuggestions.sort((a,b) => b.voteCount - a.voteCount));
};

export const apiAddFeatureSuggestion = async (data: NewFeatureSuggestionData): Promise<FeatureSuggestion> => {
    console.warn("apiAddFeatureSuggestion: Called with mock data store.");
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 2));
    
    const user = mockUserDatabase.find(u => u.id === data.submittedByUserId);
    if (!user) {
        return Promise.reject(new Error("Submitting user not found."));
    }

    const newSuggestion: FeatureSuggestion = {
        id: `feat-${Date.now()}`,
        title: data.title,
        description: data.description,
        submittedByUserId: user.id,
        submittedByUserName: `${user.firstName} ${user.lastName}`,
        submittedByUserProfilePictureUrl: user.profilePictureUrl,
        createdAt: new Date().toISOString(),
        voteCount: 1, // The suggester automatically votes for their own idea
    };

    mockFeatureSuggestionsDatabase.unshift(newSuggestion); // Add to top
    // Also add the automatic vote
    mockFeatureVotesDatabase.push({ suggestionId: newSuggestion.id, userId: user.id });

    return Promise.resolve(newSuggestion);
};

export const apiVoteForFeature = async (suggestionId: string, userId: string): Promise<void> => {
    console.warn(`apiVoteForFeature (${suggestionId}, ${userId}): Called with mock data store.`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY / 3));

    const suggestion = mockFeatureSuggestionsDatabase.find(s => s.id === suggestionId);
    if (!suggestion) {
        return Promise.reject(new Error("Feature suggestion not found."));
    }

    const existingVote = mockFeatureVotesDatabase.find(v => v.suggestionId === suggestionId && v.userId === userId);
    if (existingVote) {
        // Un-voting logic
        mockFeatureVotesDatabase = mockFeatureVotesDatabase.filter(v => !(v.suggestionId === suggestionId && v.userId === userId));
        suggestion.voteCount -= 1;
        console.log(`Mock DB (Features): User ${userId} unvoted for ${suggestionId}.`);
    } else {
        // Voting logic
        mockFeatureVotesDatabase.push({ suggestionId, userId });
        suggestion.voteCount += 1;
        console.log(`Mock DB (Features): User ${userId} voted for ${suggestionId}.`);
    }

    return Promise.resolve();
};
