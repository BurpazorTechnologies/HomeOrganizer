import type { TrackingConfig, TrackedEvent, TrackTarget } from '@/Types/Tracking/TrackingConfig';

const trackingConfig: TrackingConfig = {
    debug: true,
    defaultEvents: ['click', 'scroll'],
    targets: [
        {name: 'Header: About', selector: {type: 'css', value: 'a[href="#about"]'}},
        {name: 'Header: Skills', selector: {type: 'css', value: 'a[href="#skills"]'}},
        {name: 'Header: Projects', selector: {type: 'css', value: 'a[href="#projects"]'}},
        {name: 'Header: Blog', selector: {type: 'css', value: `a[href="${route('blog.index')}"]`}},
        {name: 'Header: Contact', selector: {type: 'css', value: 'a[href="#contact"]'}},
    ],
};

export default trackingConfig;
export type { TrackingConfig, TrackedEvent, TrackTarget };
