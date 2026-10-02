'use client';

import React, { useEffect, useState } from 'react';
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [manifestUrl, setManifestUrl] = useState('');

    useEffect(() => {
        // Set dynamic manifest URL matching origin
        setManifestUrl(`${window.location.origin}/tonconnect-manifest.json`);
    }, []);

    if (!manifestUrl) {
        return null;
    }

    return (
        <TonConnectUIProvider
            manifestUrl={manifestUrl}
            uiPreferences={{
                theme: THEME.DARK,
            }}
        >
            {children}
        </TonConnectUIProvider>
    );
}
