import type { FeatureDescriptor } from './FeatureDescriptor';

export type TesterResponse = {
    message: string;
    role?: string;
    guard?: string;
    permission?: string;
    granted?: boolean;
    features?: FeatureDescriptor[];
};
