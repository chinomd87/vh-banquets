import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import authReducer from './authSlice';
import { tokenStorage } from '../services/api';
import ENV from '../config/environment';

// RTK Query API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: ENV.API_BASE_URL,
    prepareHeaders: async (headers, { getState }) => {
      // Try to get token from Redux state first, then from storage
      const token = getState().auth.token || await tokenStorage.getToken();
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Client', 
    'Event',
    'Staff',
    'Menu',
    'Payment',
    'Inventory',
    'FloorPlan',
    'Contract',
    'File'
  ],
  endpoints: (builder) => ({
    // Users
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    
    // Clients
    getClients: builder.query({
      query: (params) => ({
        url: '/clients',
        params,
      }),
      providesTags: ['Client'],
    }),
    createClient: builder.mutation({
      query: (data) => ({
        url: '/clients',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Client'],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
    
    // Events
    getEvents: builder.query({
      query: (params) => ({
        url: '/events',
        params,
      }),
      providesTags: ['Event'],
    }),
    getEvent: builder.query({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
    createEvent: builder.mutation({
      query: (data) => ({
        url: '/events',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Event'],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Event'],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),
    
    // Staff
    getStaff: builder.query({
      query: (params) => ({
        url: '/staff',
        params,
      }),
      providesTags: ['Staff'],
    }),
    
    // Menu
    getMenuItems: builder.query({
      query: (params) => ({
        url: '/menu',
        params,
      }),
      providesTags: ['Menu'],
    }),
    getMenuCategories: builder.query({
      query: () => '/menu/categories/list',
      providesTags: ['Menu'],
    }),
    
    // Payments
    getPayments: builder.query({
      query: (params) => ({
        url: '/payments',
        params,
      }),
      providesTags: ['Payment'],
    }),
    
    // Dashboard stats
    getDashboardStats: builder.query({
      query: () => '/events/stats/overview',
      providesTags: ['Event'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUsersQuery,
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetStaffQuery,
  useGetMenuItemsQuery,
  useGetMenuCategoriesQuery,
  useGetPaymentsQuery,
  useGetDashboardStatsQuery,
} = api;

// Configure store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
  devTools: ENV.DEBUG,
});

// Export types for TypeScript usage (commented out for JS)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
