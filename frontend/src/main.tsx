import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store/store';
import { router } from './routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/global.css';

import { ToastProvider } from './context/ToastContext';

const GOOGLE_CLIENT_ID = "803514572954-ou80dm60ceo6uiaojtjb4aeja6tsaqgb.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
