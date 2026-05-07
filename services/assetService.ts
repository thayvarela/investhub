import api from './api';
import { Asset } from '../types';

// Helper to adapt backend data to frontend Asset type
const adaptAsset = (backendAsset: any): Asset => ({
    ...backendAsset,
    change1D: backendAsset.change1D || 0,
    change5D: backendAsset.change5D || 0,
    change1M: backendAsset.change1M || 0,
    changeYTD: backendAsset.changeYTD || 0,
});

export const getAssets = async (): Promise<Asset[]> => {
    const response = await api.get('/assets');
    return response.data.map(adaptAsset);
};

export const createAsset = async (assetData: any): Promise<Asset> => {
    const response = await api.post('/assets', assetData);
    return adaptAsset(response.data);
};

export const updateAsset = async (id: string, assetData: any): Promise<Asset> => {
    const response = await api.put(`/assets/${id}`, assetData);
    return adaptAsset(response.data);
};

export const deleteAsset = async (id: string) => {
    await api.delete(`/assets/${id}`);
};

export const batchUpdateAssets = async (assets: any[]) => {
    const response = await api.post('/assets/batch', assets);
    // Backend returns count, but we might refetch. 
    // If backend returned objects, we would adapt them.
    return response.data;
};

export const fetchPrice = async (ticker: string) => {
    const response = await api.get(`/assets/ticker/${ticker}`);
    return response.data;
};

export const searchAssets = async (query: string) => {
    const response = await api.get(`/assets/search?query=${query}`);
    return response.data;
};

export const getQuotes = async () => {
    const response = await api.get('/assets/quotes');
    return response.data;
};
