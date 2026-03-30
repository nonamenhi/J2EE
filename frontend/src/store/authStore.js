import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../utils/axiosInstance';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axiosInstance.post('/auth/login', { email, password });
          localStorage.setItem('accessToken', data.token);
          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (fullName, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axiosInstance.post('/auth/register', { fullName, email, password });
          localStorage.setItem('accessToken', data.token);
          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null });
        window.location.href = '/login';
      },

      setUser: (user) => set({ user }),

      // Thêm hàm này
      updateUser: (updatedData) => set((state) => ({
        user: { ...state.user, ...updatedData }
      })),
    }),
    { name: 'eventhub-auth', partialize: (s) => ({ user: s.user }) }
  )
);

export default useAuthStore;