import React from 'react';
import { createRoot } from 'react-dom/client';
import '@assets/styles/tailwind.css';
import SidePanel from './SidePanel';
import AppProviders from '../../components/AppProviders';

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find SidePanel root element");
  const root = createRoot(rootContainer);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <SidePanel />
      </AppProviders>
    </React.StrictMode>
  );
}

init();