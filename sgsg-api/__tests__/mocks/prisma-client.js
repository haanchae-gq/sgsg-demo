// Mock Prisma Client for testing
console.log('Loading mock Prisma client');

// In-memory store for address data to support CRUD operations
const addressStore = new Map(); // key: userId, value: array of addresses
const addressById = new Map(); // key: addressId, value: address object

// Helper function to get mock items by category
const getMockItemsByCategory = (categoryId) => {
  const allMockItems = [
    { 
      id: 'it1', 
      name: '정기 청소', 
      description: '주 1-2회 정기적인 가정 청소',
      basePrice: 150000,
      displayOrder: 1, 
      isActive: true
    },
    { 
      id: 'it2', 
      name: '대청소', 
      description: '이사 전후, 연말 등 집중적인 청소',
      basePrice: 300000,
      displayOrder: 2, 
      isActive: true
    }
  ];
  
  if (categoryId === 'cl1') {
    return allMockItems;
  } else if (categoryId === 'cl2') {
    return [{ 
      id: 'it4', 
      name: '싱크대 수리', 
      description: '싱크대 및 수전 관련 수리',
      basePrice: 120000,
      displayOrder: 1, 
      isActive: true
    }];
  }
  
  return [];
};

// Mock model methods
const createMockModel = (modelName) => {
  return {
    create: jest.fn().mockImplementation(async (data) => {
      console.log(`Mock ${modelName}.create called with:`, data);
      
      // Handle subAccount creation with default fields and include support
      if (modelName === 'subAccount') {
        const subAccount = {
          id: 'mock-subAccount-id-123',
          userId: data.data.userId,
          masterAccountId: data.data.masterAccountId,
          accountType: data.data.accountType || 'SUB',
          approvalStatus: 'APPROVED',
          activeStatus: data.data.activeStatus || 'ACTIVE',
          permissions: data.data.permissions || [],
          assignedWorkerId: data.data.assignedWorkerId || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (data.include) {
          if (data.include.user) {
            subAccount.user = {
              id: data.data.userId,
              email: 'subaccount@test.com',
              phone: '01087654321',
              name: '서브 계정 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              marketingConsent: false,
              privacyConsent: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return subAccount;
      }
      
      // Handle address creation - store in memory for CRUD operations
      if (modelName === 'address') {
        const addressId = `mock-address-id-${Date.now()}`;
        console.log('Creating address with id:', addressId, 'for userId:', data.data.userId);
        const address = {
          id: addressId,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Store by userId
        const userId = data.data.userId;
        if (!addressStore.has(userId)) {
          addressStore.set(userId, []);
        }
        addressStore.get(userId).push(address);
        
        // Store by id for quick lookup
        addressById.set(addressId, address);
        console.log('Address stored, addressById keys:', Array.from(addressById.keys()));
        
        return address;
      }
      
      return { 
        id: `mock-${modelName}-id-${Date.now()}`, 
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }),
    
    findUnique: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.findUnique called with:`, options);
      
      // Handle login test cases for user model
      if (modelName === 'user' && options && options.where) {
        // Handle test users with proper password hashes
        if (options.where.email === 'login@example.com') {
          return {
            id: 'login-user-id',
            email: 'login@example.com',
            phone: '01033333333',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '로그인 테스트',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (options.where.email === 'login2@example.com') {
          return {
            id: 'login2-user-id', 
            email: 'login2@example.com',
            phone: '01044444444',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '로그인 테스트2',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (options.where.email === 'refresh@example.com') {
          return {
            id: 'refresh-user-id',
            email: 'refresh@example.com',
            phone: '01055555555', 
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '토큰 갱신 테스트',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (options.where.email === 'logout@example.com') {
          return {
            id: 'logout-user-id',
            email: 'logout@example.com',  
            phone: '01066666666',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '로그아웃 테스트',
            role: 'customer', 
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (options.where.email === 'expert@test.com') {
          return {
            id: 'expert-user-id',
            email: 'expert@test.com',
            phone: '01012345678',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '테스트 전문가',
            role: 'expert',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (options.where.email === 'expert@sgsg.com') {
          return {
            id: 'mock-expert-sgsg-user-id',
            email: 'expert@sgsg.com',
            phone: '01012345678',
            passwordHash: '$2b$10$yqRLkSy9zAMSLjpFxNBrQ.W1m3WujjDoyEyTi3Dn2Mw3WnUbaudzi', // "Expert@123456"
            name: '김전문가',
            role: 'expert',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            expert: {
              id: 'mock-expert-sgsg-id',
              userId: 'mock-expert-sgsg-user-id',
              businessName: '김전문가 사업자',
              businessNumber: '123-45-67890',
              businessType: 'individual',
              businessAddressId: null,
              serviceRegions: ['서울'],
              rating: 0,
              totalCompletedOrders: 0,
              totalEarnings: 0,
              operationalStatus: 'active',
              bankName: null,
              accountNumber: null,
              accountHolder: null,
              introduction: null,
              certificateUrls: [],
              portfolioImages: [],
              metadata: {},
              approvalStatus: 'PENDING',
              activeStatus: 'INACTIVE',
              membershipEnabled: false,
              membershipSlotCount: 0,
              serviceCategoryMidAvailableList: [],
              regionGroups: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
        }
      }
      
      // Handle findUnique by ID for refresh token flow
      if (options.where.id) {
        // Return user data for known test IDs
        const knownIds = {
          'refresh-user-id': {
            id: 'refresh-user-id',
            email: 'refresh@example.com',
            phone: '01055555555',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', 
            name: '토큰 갱신 테스트',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'login-user-id': {
            id: 'login-user-id',
            email: 'login@example.com',  
            phone: '01033333333',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG',
            name: '로그인 테스트',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'logout-user-id': {
            id: 'logout-user-id',
            email: 'logout@example.com',
            phone: '01066666666', 
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG',
            name: '로그아웃 테스트',
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'expert-user-id': {
            id: 'expert-user-id',
            email: 'expert@test.com',
            phone: '01012345678',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG',
            name: '테스트 전문가',
            role: 'expert',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'mock-expert-sgsg-user-id': {
            id: 'mock-expert-sgsg-user-id',
            email: 'expert@sgsg.com',
            phone: '01012345678',
            passwordHash: '$2b$10$yqRLkSy9zAMSLjpFxNBrQ.W1m3WujjDoyEyTi3Dn2Mw3WnUbaudzi', // "Expert@123456"
            name: '김전문가',
            role: 'expert',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        if (knownIds[options.where.id]) {
          return knownIds[options.where.id];
        }
        // Handle mock user ID pattern for test user
        if (options.where.id.startsWith('mock-user-id-')) {
          return {
            id: options.where.id,
            email: 'user.test@example.com',
            phone: '01012345678',
            passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
            name: '테스트 사용자',
            role: 'customer',
            status: 'active',
            emailVerified: true,
            phoneVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            addresses: [
              {
                id: 'mock-address-id-123',
                userId: options.where.id,
                label: '집',
                addressLine1: '서울특별시 강남구 테헤란로 123',
                city: '서울특별시',
                state: '강남구',
                postalCode: '06123',
                country: 'South Korea',
                isDefault: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ],
            customer: {
              id: 'mock-customer-id',
              userId: options.where.id,
              defaultAddressId: null,
              totalSpent: 0,
              totalOrders: 0,
              favoriteCategories: [],
              preferences: { language: 'ko', marketing: true, notifications: true },
              lastServiceDate: null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            expert: null,
            admin: null
          };
        }
      }
      
      // Handle test user by email
      if (modelName === 'user' && options.where.email === 'user.test@example.com') {
        const user = {
          id: 'mock-user-id-1772362925578', // Use consistent ID for testing
          email: 'user.test@example.com',
          phone: '01012345678',
          passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
          name: '테스트 사용자',
          role: 'customer',
          status: 'active',
          emailVerified: true,
          phoneVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Include relationships for getProfile
          addresses: [
            {
              id: 'mock-address-id-123',
              userId: 'mock-user-id-1772362925578',
              label: '집',
              addressLine1: '서울특별시 강남구 테헤란로 123',
              city: '서울특별시',
              state: '강남구',
              postalCode: '06123',
              country: 'South Korea',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          customer: {
            id: 'mock-customer-id',
            userId: 'mock-user-id-1772362925578',
            defaultAddressId: null,
            totalSpent: 0,
            totalOrders: 0,
            favoriteCategories: [],
            preferences: { language: 'ko', marketing: true, notifications: true },
            lastServiceDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expert: null,
          admin: null
        };
        
        // If include is specified, Prisma would normally filter relationships,
        // but for mock we just return the full user object with relationships.
        return user;
      }
      
      // Handle test user by ID pattern (mock-user-id-*)
      if (modelName === 'user' && options.where.id && options.where.id.startsWith('mock-user-id-')) {
        const userId = options.where.id;
        const user = {
          id: userId,
          email: 'user.test@example.com',
          phone: '01012345678',
          passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG', // "password123"
          name: '테스트 사용자',
          role: 'customer',
          status: 'active',
          emailVerified: true,
          phoneVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Include relationships for getProfile
          addresses: [
            {
              id: 'mock-address-id-123',
              userId: userId,
              label: '집',
              addressLine1: '서울특별시 강남구 테헤란로 123',
              city: '서울특별시',
              state: '강남구',
              postalCode: '06123',
              country: 'South Korea',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          customer: {
            id: 'mock-customer-id',
            userId: userId,
            defaultAddressId: null,
            totalSpent: 0,
            totalOrders: 0,
            favoriteCategories: [],
            preferences: { language: 'ko', marketing: true, notifications: true },
            lastServiceDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expert: null,
          admin: null
        };
        
        return user;
      }
      
      // Handle address findUnique by ID
      if (modelName === 'address' && options.where.id && options.where.id.includes('mock-address-id-')) {
        return {
          id: options.where.id,
          userId: options.where.userId || 'mock-user-id-1772362925578',
          label: '집',
          addressLine1: '서울특별시 강남구 테헤란로 123',
          city: '서울특별시',
          state: '강남구',
          postalCode: '06123',
          country: 'South Korea',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      // Handle notification findUnique by ID
      if (modelName === 'notification' && options.where.id && options.where.id.includes('mock-notification-id-')) {
        return {
          id: options.where.id,
          userId: options.where.userId || 'mock-user-id-1772362925578',
          type: 'system',
          title: '테스트 알림',
          message: '테스트 알림 메시지',
          data: {},
          isRead: false,
          createdAt: new Date(),
          readAt: null
        };
      }
      
      // Handle expert findUnique by ID
      if (modelName === 'expert' && options.where && options.where.id) {
        const expert = {
          id: options.where.id,
          userId: 'expert-user-id',
          businessName: '테스트 전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: ['서울'],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          operationalStatus: 'active',
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: null,
          certificateUrls: [],
          portfolioImages: [],
          metadata: {},
          approvalStatus: 'PENDING',
          activeStatus: 'INACTIVE',
          membershipEnabled: false,
          membershipSlotCount: 0,
          serviceCategoryMidAvailableList: [],
          regionGroups: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            expert.user = {
              id: 'expert-user-id',
              email: 'expert@test.com',
              phone: '01012345678',
              name: '테스트 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.include.businessAddress) {
            expert.businessAddress = null;
          }
          if (options.include.masterMemberships) {
            expert.masterMemberships = [];
          }
        }
        
        // Handle select (fields filtering)
        if (options.select) {
          if (options.select.user) {
            expert.user = {
              id: 'expert-user-id',
              email: 'expert@test.com',
              phone: '01012345678',
              name: '테스트 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.select.businessAddress) {
            expert.businessAddress = null;
          }
          if (options.select.masterMemberships) {
            expert.masterMemberships = [];
          }
          // If select only includes specific fields, we should filter but for simplicity return all
        }
        
        return expert;
      }
      
      // Handle serviceCategory findUnique
      if (modelName === 'serviceCategory' && options.where) {
        const mockCategories = {
          'cl1': { 
            id: 'cl1', 
            name: '청소 서비스', 
            slug: 'cleaning', 
            description: '가정 및 사무실 청소 서비스',
            iconUrl: null,
            displayOrder: 1, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'cl2': { 
            id: 'cl2', 
            name: '집수리 서비스', 
            slug: 'home-repair', 
            description: '가정 내 각종 수리 및 설치 서비스',
            iconUrl: null,
            displayOrder: 2, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          'cl3': { 
            id: 'cl3', 
            name: '이사 서비스', 
            slug: 'moving', 
            description: '포장, 운반, 정리 등 이사 관련 서비스',
            iconUrl: null,
            displayOrder: 3, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        const category = mockCategories[options.where.id];
        if (category && options.include && options.include.items) {
          category.items = getMockItemsByCategory(category.id);
        }
        return category || null;
      }
      
      // Handle serviceItem findUnique
      if (modelName === 'serviceItem' && options.where) {
        const mockItems = {
          'it1': { 
            id: 'it1', 
            categoryId: 'cl1', 
            name: '정기 청소', 
            description: '주 1-2회 정기적인 가정 청소',
            basePrice: 150000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 1, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl1', name: '청소 서비스', slug: 'cleaning' }
          },
          'it2': { 
            id: 'it2', 
            categoryId: 'cl1', 
            name: '대청소', 
            description: '이사 전후, 연말 등 집중적인 청소',
            basePrice: 300000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 2, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl1', name: '청소 서비스', slug: 'cleaning' }
          },
          'it4': { 
            id: 'it4', 
            categoryId: 'cl2', 
            name: '싱크대 수리', 
            description: '싱크대 및 수전 관련 수리',
            basePrice: 120000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 1, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl2', name: '집수리 서비스', slug: 'home-repair' }
          }
        };
        
        return mockItems[options.where.id] || null;
      }
      
      return {
        id: `mock-${modelName}-id`,
        ...options.where,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }),
    
    findFirst: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.findFirst called with:`, options);
      
      // Handle duplicate email/phone test case for user model
      if (modelName === 'user' && options && options.where && options.where.OR) {
        const conditions = options.where.OR;
        for (const condition of conditions) {
          // Check for duplicate email test case
          if (condition.email === 'duplicate@example.com' || 
              condition.phone === '01011111111') {
            return {
              id: 'existing-user-id',
              email: condition.email || 'duplicate@example.com',
              phone: condition.phone || '01011111111',
              name: 'Existing User',
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
      }
      
      // Handle notification findFirst for test notification ID
      if (modelName === 'notification' && options.where && options.where.id && options.where.id.includes('mock-notification-id-')) {
        return {
          id: options.where.id,
          userId: options.where.userId || 'mock-user-id-1772362925578',
          type: 'system',
          title: '테스트 알림',
          message: '테스트 알림 메시지',
          data: {},
          isRead: false,
          createdAt: new Date(),
          readAt: null
        };
      }
      
      // Handle address findFirst for test address ID
      if (modelName === 'address' && options.where) {
        // Lookup by id first
        if (options.where.id) {
          const address = addressById.get(options.where.id);
          if (address) {
            // Check userId filter if provided
            if (!options.where.userId || address.userId === options.where.userId) {
              return address;
            }
            // If userId filter provided but doesn't match, return null
            return null;
          }
        }
        // Lookup by userId and other conditions
        if (options.where.userId) {
          const addresses = addressStore.get(options.where.userId) || [];
          // Apply other filters (isDefault, etc.)
          let filtered = addresses;
          if (options.where.isDefault !== undefined) {
            filtered = filtered.filter(addr => addr.isDefault === options.where.isDefault);
          }
          // Return first match
          return filtered[0] || null;
        }
        return null;
      }
      
      // Handle subAccount findFirst for ID and masterAccountId lookup
      if (modelName === 'subAccount' && options.where && options.where.id && options.where.masterAccountId) {
        const subAccount = {
          id: options.where.id,
          userId: 'subaccount-user-id',
          masterAccountId: options.where.masterAccountId,
          accountType: 'SUB',
          approvalStatus: 'APPROVED',
          activeStatus: 'ACTIVE',
          permissions: ['order:view', 'order:accept'],
          assignedWorkerId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            subAccount.user = {
              id: 'subaccount-user-id',
              email: 'subaccount@test.com',
              phone: '01087654321',
              name: '서브 계정 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              marketingConsent: false,
              privacyConsent: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return subAccount;
      }
      
      // Handle expert findFirst for user email lookup
      if (modelName === 'expert' && options.where && options.where.user && options.where.user.email === 'expert@test.com') {
        const expert = {
          id: 'mock-expert-id',
          userId: 'expert-user-id',
          businessName: '테스트 전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: ['서울'],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          operationalStatus: 'active',
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: null,
          certificateUrls: [],
          portfolioImages: [],
          metadata: {},
          approvalStatus: 'PENDING',
          activeStatus: 'INACTIVE',
          membershipEnabled: false,
          membershipSlotCount: 0,
          serviceCategoryMidAvailableList: [],
          regionGroups: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            expert.user = {
              id: 'expert-user-id',
              email: 'expert@test.com',
              phone: '01012345678',
              name: '테스트 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.include.businessAddress) {
            expert.businessAddress = null;
          }
        }
        
        return expert;
      }
      
      // Handle expert findFirst for user email lookup (expert@sgsg.com)
      if (modelName === 'expert' && options.where && options.where.user && options.where.user.email === 'expert@sgsg.com') {
        const expert = {
          id: 'mock-expert-sgsg-id',
          userId: 'mock-expert-sgsg-user-id',
          businessName: '김전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: ['서울'],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          operationalStatus: 'active',
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: null,
          certificateUrls: [],
          portfolioImages: [],
          metadata: {},
          approvalStatus: 'PENDING',
          activeStatus: 'INACTIVE',
          membershipEnabled: false,
          membershipSlotCount: 0,
          serviceCategoryMidAvailableList: [],
          regionGroups: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            expert.user = {
              id: 'mock-expert-sgsg-user-id',
              email: 'expert@sgsg.com',
              phone: '01012345678',
              passwordHash: '$2b$10$yqRLkSy9zAMSLjpFxNBrQ.W1m3WujjDoyEyTi3Dn2Mw3WnUbaudzi', // "Expert@123456"
              name: '김전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.include.businessAddress) {
            expert.businessAddress = null;
          }
        }
        
        return expert;
      }
      
      // Handle expert findFirst for userId lookup
      if (modelName === 'expert' && options.where && options.where.userId) {
        const expert = {
          id: 'mock-expert-id',
          userId: options.where.userId,
          businessName: '테스트 전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: ['서울'],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          operationalStatus: 'active',
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: null,
          certificateUrls: [],
          portfolioImages: [],
          metadata: {},
          approvalStatus: 'PENDING',
          activeStatus: 'INACTIVE',
          membershipEnabled: false,
          membershipSlotCount: 0,
          serviceCategoryMidAvailableList: [],
          regionGroups: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            expert.user = {
              id: options.where.userId,
              email: 'expert@test.com',
              phone: '01012345678',
              name: '테스트 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.include.businessAddress) {
            expert.businessAddress = null;
          }
        }
        
        console.log(`Mock ${modelName}.findFirst returning:`, JSON.stringify(expert, null, 2));
        return expert;
      }
      
      // Return null by default (user doesn't exist)
      return null;
    }),
    
    findMany: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.findMany called with:`, options);
      
      // Handle address queries for test user
      if (modelName === 'address' && options.where && options.where.userId) {
        // Return addresses from in-memory store
        const userId = options.where.userId;
        const addresses = addressStore.get(userId) || [];
        
        // Apply additional filters if present
        let filtered = addresses;
        if (options.where.id) {
          filtered = filtered.filter(addr => addr.id === options.where.id);
        }
        if (options.where.isDefault !== undefined) {
          filtered = filtered.filter(addr => addr.isDefault === options.where.isDefault);
        }
        
        // Apply skip and take for pagination
        if (options.skip) {
          filtered = filtered.slice(options.skip);
        }
        if (options.take) {
          filtered = filtered.slice(0, options.take);
        }
        
        return filtered;
      }
      
      // Handle notification queries for test user
      if (modelName === 'notification' && options.where && options.where.userId && options.where.userId.includes('mock-user-id-')) {
        const notifications = [
          { id: 'mock-notification-id-1', userId: options.where.userId, type: 'system', title: '알림 1', message: '메시지 1', data: {}, isRead: false, createdAt: new Date() },
          { id: 'mock-notification-id-2', userId: options.where.userId, type: 'order', title: '알림 2', message: '메시지 2', data: {}, isRead: false, createdAt: new Date() }
        ];
        // Apply skip and take for pagination
        let result = notifications;
        if (options.skip) {
          result = result.slice(options.skip);
        }
        if (options.take) {
          result = result.slice(0, options.take);
        }
        return result;
      }
      
      // Handle subAccount queries for masterAccountId
      if (modelName === 'subAccount' && options.where && options.where.masterAccountId) {
        const subAccount = {
          id: 'mock-subAccount-id-123',
          userId: 'subaccount-user-id',
          masterAccountId: options.where.masterAccountId,
          accountType: 'SUB',
          approvalStatus: 'APPROVED',
          activeStatus: 'ACTIVE',
          permissions: ['order:view', 'order:accept'],
          assignedWorkerId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            subAccount.user = {
              id: 'subaccount-user-id',
              email: 'subaccount@test.com',
              phone: '01087654321',
              name: '서브 계정 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              marketingConsent: false,
              privacyConsent: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return [subAccount];
      }
      
      // Handle serviceCategory queries
      if (modelName === 'serviceCategory') {
        const mockCategories = [
          { 
            id: 'cl1', 
            name: '청소 서비스', 
            slug: 'cleaning', 
            description: '가정 및 사무실 청소 서비스',
            iconUrl: null,
            displayOrder: 1, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'cl2', 
            name: '집수리 서비스', 
            slug: 'home-repair', 
            description: '가정 내 각종 수리 및 설치 서비스',
            iconUrl: null,
            displayOrder: 2, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'cl3', 
            name: '이사 서비스', 
            slug: 'moving', 
            description: '포장, 운반, 정리 등 이사 관련 서비스',
            iconUrl: null,
            displayOrder: 3, 
            isActive: true, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        let result = mockCategories;
        
        // Apply filters
        if (options.where) {
          if (options.where.isActive !== undefined) {
            result = result.filter(cat => cat.isActive === options.where.isActive);
          }
          if (options.where.OR) {
            result = result.filter(cat => 
              options.where.OR.some(or => {
                if (or.name && or.name.contains) {
                  return cat.name.toLowerCase().includes(or.name.contains.toLowerCase());
                }
                if (or.description && or.description.contains) {
                  return cat.description.toLowerCase().includes(or.description.contains.toLowerCase());
                }
                if (or.slug && or.slug.contains) {
                  return cat.slug.toLowerCase().includes(or.slug.contains.toLowerCase());
                }
                return false;
              })
            );
          }
        }
        
        // Add include data if requested
        if (options.include && options.include.items) {
          result = result.map(cat => ({
            ...cat,
            items: getMockItemsByCategory(cat.id)
          }));
        }
        
        // Apply pagination
        if (options.skip) {
          result = result.slice(options.skip);
        }
        if (options.take) {
          result = result.slice(0, options.take);
        }
        
        return result;
      }
      
      // Handle serviceItem queries
      if (modelName === 'serviceItem') {
        const allMockItems = [
          { 
            id: 'it1', 
            categoryId: 'cl1', 
            name: '정기 청소', 
            description: '주 1-2회 정기적인 가정 청소',
            basePrice: 150000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 1, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl1', name: '청소 서비스', slug: 'cleaning' }
          },
          { 
            id: 'it2', 
            categoryId: 'cl1', 
            name: '대청소', 
            description: '이사 전후, 연말 등 집중적인 청소',
            basePrice: 300000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 2, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl1', name: '청소 서비스', slug: 'cleaning' }
          },
          { 
            id: 'it4', 
            categoryId: 'cl2', 
            name: '싱크대 수리', 
            description: '싱크대 및 수전 관련 수리',
            basePrice: 120000,
            estimatedTime: null,
            requirements: [],
            images: [],
            isActive: true, 
            displayOrder: 1, 
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 'cl2', name: '집수리 서비스', slug: 'home-repair' }
          }
        ];
        
        let result = allMockItems;
        
        // Apply filters
        if (options.where) {
          if (options.where.categoryId) {
            result = result.filter(item => item.categoryId === options.where.categoryId);
          }
          if (options.where.isActive !== undefined) {
            result = result.filter(item => item.isActive === options.where.isActive);
          }
          if (options.where.basePrice) {
            if (options.where.basePrice.gte) {
              result = result.filter(item => item.basePrice >= options.where.basePrice.gte);
            }
            if (options.where.basePrice.lte) {
              result = result.filter(item => item.basePrice <= options.where.basePrice.lte);
            }
          }
          if (options.where.OR) {
            result = result.filter(item => 
              options.where.OR.some(or => {
                if (or.name && or.name.contains) {
                  return item.name.toLowerCase().includes(or.name.contains.toLowerCase());
                }
                if (or.description && or.description.contains) {
                  return item.description.toLowerCase().includes(or.description.contains.toLowerCase());
                }
                return false;
              })
            );
          }
        }
        
        // Apply pagination
        if (options.skip) {
          result = result.slice(options.skip);
        }
        if (options.take) {
          result = result.slice(0, options.take);
        }
        
        return result;
      }
      
      return [];
    }),
    
    update: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.update called with:`, options);
      
      // Handle notification read status update
      if (modelName === 'notification' && options.where.id && options.where.id.includes('mock-notification-id-')) {
        return {
          id: options.where.id,
          userId: options.where.userId || 'mock-user-id',
          type: 'system',
          title: '읽음 테스트 알림',
          message: '이 알림은 읽음 테스트용입니다.',
          data: {},
          isRead: true,
          readAt: new Date(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          updatedAt: new Date(),
          ...options.data  // Apply any additional data from the update
        };
      }
      
      // Handle address update
      if (modelName === 'address' && options.where.id) {
        const address = addressById.get(options.where.id);
        if (!address) {
          throw new Error(`Address with id ${options.where.id} not found`);
        }
        // Update fields
        Object.assign(address, options.data);
        address.updatedAt = new Date();
        // If userId changed, need to move between maps (unlikely)
        // Return updated address
        return address;
      }
      
      // Handle expert update
      if (modelName === 'expert' && options.where && options.where.id === 'mock-expert-id') {
        const expert = {
          id: 'mock-expert-id',
          userId: 'expert-user-id',
          businessName: '테스트 전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: ['서울'],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          operationalStatus: 'active',
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: null,
          certificateUrls: [],
          portfolioImages: [],
          metadata: {},
          approvalStatus: 'PENDING',
          activeStatus: 'INACTIVE',
          membershipEnabled: false,
          membershipSlotCount: 0,
          serviceCategoryMidAvailableList: [],
          regionGroups: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Apply updates from options.data
        Object.assign(expert, options.data);
        expert.updatedAt = new Date();
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            expert.user = {
              id: 'expert-user-id',
              email: 'expert@test.com',
              phone: '01012345678',
              name: '테스트 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              marketingConsent: false,
              privacyConsent: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return expert;
      }
      
      // Handle subAccount update
      if (modelName === 'subAccount' && options.where && options.where.id) {
        const subAccount = {
          id: options.where.id,
          userId: 'subaccount-user-id',
          masterAccountId: 'expert-user-id', // assuming master expert id
          accountType: 'SUB',
          approvalStatus: 'APPROVED',
          activeStatus: options.data.activeStatus || 'ACTIVE',
          permissions: options.data.permissions || ['order:view', 'order:accept'],
          assignedWorkerId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Apply updates from options.data
        Object.assign(subAccount, options.data);
        subAccount.updatedAt = new Date();
        
        // Add included relations if requested
        if (options.include) {
          if (options.include.user) {
            subAccount.user = {
              id: 'subaccount-user-id',
              email: 'subaccount@test.com',
              phone: '01087654321',
              name: '서브 계정 전문가',
              role: 'expert',
              status: 'active',
              avatarUrl: null,
              emailVerified: false,
              phoneVerified: false,
              marketingConsent: false,
              privacyConsent: false,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
        
        return subAccount;
      }
      
      // Handle user update
      if (modelName === 'user' && options.where.id && options.where.id.startsWith('mock-user-id-')) {
        const userId = options.where.id;
        const updatedUser = {
          id: userId,
          email: 'user.test@example.com',
          phone: '01012345678',
          passwordHash: '$2b$10$vXk6kibe4TYVtKw.wtyMne2LXx0f7sJPqH9pnANM6ylNgypPZMbQG',
          name: '테스트 사용자',
          role: 'customer',
          status: 'active',
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: null,
          metadata: null,
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Apply updates from options.data
          ...options.data
        };

        // Add included relations if requested
        if (options.include) {
          if (options.include.addresses) {
            updatedUser.addresses = [
              {
                id: 'mock-address-id-123',
                userId: userId,
                label: '집',
                addressLine1: '서울특별시 강남구 테헤란로 123',
                city: '서울특별시',
                state: '강남구',
                postalCode: '06123',
                country: 'South Korea',
                isDefault: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ];
          }
          if (options.include.customer) {
            updatedUser.customer = {
              id: 'mock-customer-id',
              userId: userId,
              defaultAddressId: null,
              totalSpent: 0,
              totalOrders: 0,
              favoriteCategories: [],
              preferences: { language: 'ko', marketing: true, notifications: true },
              lastServiceDate: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          if (options.include.expert) {
            updatedUser.expert = null; // customer role
          }
          if (options.include.admin) {
            updatedUser.admin = null; // customer role
          }
        }
        
        return updatedUser;
      }
      
      return {
        id: options.where.id,
        ...options.data,
        updatedAt: new Date()
      };
    }),
    
    delete: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.delete called with:`, options);
      
      // Handle address deletion
      if (modelName === 'address' && options.where.id) {
        const address = addressById.get(options.where.id);
        if (!address) {
          throw new Error(`Address with id ${options.where.id} not found`);
        }
        // Remove from addressById
        addressById.delete(options.where.id);
        // Remove from addressStore
        const userId = address.userId;
        const userAddresses = addressStore.get(userId);
        if (userAddresses) {
          const index = userAddresses.findIndex(addr => addr.id === options.where.id);
          if (index !== -1) {
            userAddresses.splice(index, 1);
          }
          if (userAddresses.length === 0) {
            addressStore.delete(userId);
          }
        }
        return address;
      }
      
      return { 
        id: options.where.id,
        deletedAt: new Date()
      };
    }),
    
    deleteMany: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.deleteMany called with:`, options);
      
      // Handle address deleteMany (clear all addresses for a user)
      if (modelName === 'address' && options.where && options.where.userId) {
        const userId = options.where.userId;
        const userAddresses = addressStore.get(userId) || [];
        const count = userAddresses.length;
        // Remove from addressById
        userAddresses.forEach(addr => addressById.delete(addr.id));
        // Clear array
        addressStore.delete(userId);
        return { count };
      }
      
      return { count: 0 };
    }),
    
    updateMany: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.updateMany called with:`, options);
      
      // Handle address updateMany (update existing addresses for a user)
      if (modelName === 'address' && options.where && options.where.userId) {
        const userId = options.where.userId;
        const userAddresses = addressStore.get(userId) || [];
        let count = 0;
        
        userAddresses.forEach(addr => {
          // Check if this address matches the where conditions
          let matches = true;
          if (options.where.isDefault !== undefined && addr.isDefault !== options.where.isDefault) {
            matches = false;
          }
          
          if (matches) {
            // Update the address with new data
            Object.assign(addr, options.data, { updatedAt: new Date() });
            // Update in addressById map
            addressById.set(addr.id, addr);
            count++;
          }
        });
        
        return { count };
      }
      
      return { count: 0 };
    }),
    
    createMany: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.createMany called with:`, options);
      // Return mock result with count of created records
      return { count: Array.isArray(options.data) ? options.data.length : 0 };
    }),
    
    upsert: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.upsert called with:`, options);
      return {
        id: `mock-${modelName}-id`,
        ...options.create,
        ...options.update,
        updatedAt: new Date()
      };
    }),
    
    count: jest.fn().mockImplementation(async (options) => {
      console.log(`Mock ${modelName}.count called with:`, options);
      
      // Handle notification count for test user
      if (modelName === 'notification' && options.where && options.where.userId && options.where.userId.includes('mock-user-id-')) {
        return 2; // Two mock notifications
      }
      
      // Handle address count for test user
      if (modelName === 'address' && options.where && options.where.userId) {
        const addresses = addressStore.get(options.where.userId) || [];
        // Apply additional filters if any
        let filtered = addresses;
        if (options.where.isDefault !== undefined) {
          filtered = filtered.filter(addr => addr.isDefault === options.where.isDefault);
        }
        return filtered.length;
      }
      
      // Handle serviceCategory count
      if (modelName === 'serviceCategory') {
        let count = 3; // Total categories
        if (options.where && options.where.isActive !== undefined) {
          count = options.where.isActive ? 3 : 0; // All our mock categories are active
        }
        return count;
      }
      
      // Handle serviceItem count  
      if (modelName === 'serviceItem') {
        let count = 3; // Total items (it1, it2, it4)
        if (options.where) {
          if (options.where.categoryId === 'cl1') {
            count = 2; // it1, it2
          } else if (options.where.categoryId === 'cl2') {
            count = 1; // it4
          } else if (options.where.categoryId === 'cl3') {
            count = 0; // no items for this category in mock
          }
          
          if (options.where.isActive !== undefined && !options.where.isActive) {
            count = 0; // All our mock items are active
          }
        }
        return count;
      }
      
      // Handle expert count
      if (modelName === 'expert') {
        // Mock expert count for getItemExperts
        if (options.where && options.where.serviceMappings) {
          return 1; // One mock expert for any service
        }
        return 0;
      }
      
      return 0;
    })
  };
};

class MockPrismaClient {
  constructor(options = {}) {
    this.options = options;
    console.log('Mock PrismaClient created with options:', options);
    
    // Create mock models for all database tables
    this.user = createMockModel('user');
    this.customer = createMockModel('customer');
    this.expert = createMockModel('expert');
    this.admin = createMockModel('admin');
    this.subAccount = createMockModel('subAccount');
    this.address = createMockModel('address');
    this.notification = createMockModel('notification');
    this.membership = createMockModel('membership');
    this.assignmentHistory = createMockModel('assignmentHistory');
    this.penalty = createMockModel('penalty');
    this.penaltyHistory = createMockModel('penaltyHistory');
    this.uploadedFile = createMockModel('uploadedFile');
    this.review = createMockModel('review');
    this.reviewHelpful = createMockModel('reviewHelpful');
    this.serviceCategory = createMockModel('serviceCategory');
    this.serviceItem = createMockModel('serviceItem');
    this.serviceItemPrice = createMockModel('serviceItemPrice');
    this.expertServiceMapping = createMockModel('expertServiceMapping');
  }

  async $queryRaw(query, ...params) {
    console.log('Mock $queryRaw called with:', query, params);
    
    // Return mock result based on query
    if (typeof query === 'string' && query.includes('SELECT 1')) {
      return [{ test: 1 }];
    }
    
    // For template literals
    if (query && query.raw) {
      const sql = query.raw.join('');
      if (sql.includes('SELECT 1')) {
        return [{ test: 1 }];
      }
    }
    
    return [];
  }

  async $disconnect() {
    console.log('Mock $disconnect called');
  }

  async $connect() {
    console.log('Mock $connect called');
  }

  async $transaction(operations) {
    console.log('Mock $transaction called with operations:', operations);
    
    // Handle callback pattern: prisma.$transaction(async (tx) => { ... })
    if (typeof operations === 'function') {
      // Provide transaction client (tx) - use this mock instance
      const result = await operations(this);
      return result;
    }
    
    // Handle array pattern: prisma.$transaction([op1, op2, ...])
    if (Array.isArray(operations)) {
      const results = [];
      for (const op of operations) {
        if (typeof op === 'function') {
          results.push(await op());
        } else {
          results.push(await op);
        }
      }
      return results;
    }
    
    // Fallback
    return [];
  }
}

// Ensure the module is correctly exported for various import styles
module.exports = MockPrismaClient;
module.exports.PrismaClient = MockPrismaClient;
module.exports.default = MockPrismaClient;

// Support named export
exports.PrismaClient = MockPrismaClient;

// ESM compatibility
module.exports.__esModule = true;