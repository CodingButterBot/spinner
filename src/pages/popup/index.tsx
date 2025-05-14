import React from 'react';
import { createRoot } from 'react-dom/client';
import '@assets/styles/tailwind.css';
import Popup from './Popup';
import AppProviders from '../../components/AppProviders';

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <Popup />
      </AppProviders>
    </React.StrictMode>
  );
}

init();