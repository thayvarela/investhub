import api from './api';

export interface BackendTarget {
    segmentKey: string;
    targetPercentage: number;
}

export const getTargets = async (): Promise<BackendTarget[]> => {
    const response = await api.get('/rebalance/targets');
    return response.data;
};

export const saveTargets = async (targets: BackendTarget[]) => {
    const response = await api.post('/rebalance/targets', targets);
    return response.data;
};
