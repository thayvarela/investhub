import React, { useState, useEffect } from 'react';
// @ts-ignore
import { PluggyConnect } from 'react-pluggy-connect';
import api from '../services/api';

interface PluggyWidgetProps {
    onSuccess: () => void;
    onClose: () => void;
}

export const PluggyWidget: React.FC<PluggyWidgetProps> = ({ onSuccess, onClose }) => {
    const [connectToken, setConnectToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch Connect Token from Backend
        const fetchToken = async () => {
            try {
                const response = await api.post('/pluggy/token');
                setConnectToken(response.data.accessToken);
            } catch (err) {
                console.error("Failed to fetch pluggy token", err);
                setError("Erro ao iniciar conexão. Tente novamente.");
            }
        };
        fetchToken();
    }, []);

    const handleSuccess = async (itemData: any) => {
        console.log("Connected Successfully", itemData);
        try {
            // Sync Data
            await api.post('/pluggy/sync', { itemId: itemData.item.id });
            onSuccess();
        } catch (err) {
            console.error("Sync failed", err);
            setError("Conexão realizada, mas falha ao sincronizar dados.");
        }
    };

    const handleError = (err: any) => {
        console.error("Pluggy Error", err);
        setError("Ocorreu um erro na conexão.");
    };

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded text-white hover:bg-slate-600">Fechar</button>
            </div>
        );
    }

    if (!connectToken) {
        return (
            <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] relative">
            <PluggyConnect
                connectToken={connectToken}
                includeSandbox={true} // Enable Sandbox for testing
                onSuccess={handleSuccess}
                onError={handleError}
                onClose={onClose} // Optional if widget supports it directly, otherwise handled by wrapper
            />
            {/* Close button overlay if needed, usually Connect has its own */}
        </div>
    );
};
