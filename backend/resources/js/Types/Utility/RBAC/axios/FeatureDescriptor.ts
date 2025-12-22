export type FeatureStatus = 'granted' | 'requires-elevation';

export type FeatureDescriptor = {
    key: string;
    label: string;
    summary: string;
    guard: string;
    permission: string;
    status: FeatureStatus;
};
