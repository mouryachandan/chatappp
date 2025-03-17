import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['user/setSocketConnection'], // ignore socket action
        ignoredPaths: ['user.socketConnection'], // ignore socket path in state
      },
    }),
})
