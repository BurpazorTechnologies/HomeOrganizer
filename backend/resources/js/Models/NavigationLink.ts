import {Link} from "@/Types/_Shared/Link";

export class NavigationModel {
    private static _instance: NavigationModel;
    private _links: Link[];

    private constructor() {
        this._links = [
            { label: 'About', href: '#about' },
            { label: 'Skills', href: '#skills' },
            { label: 'Projects', href: '#projects' },
            { label: 'Blog', href: route('blog.index') },
            { label: 'Contact', href: '#contact' }
        ];
    }

    public static getInstance(): NavigationModel {
        if (!NavigationModel._instance) {
            NavigationModel._instance = new NavigationModel();
        }
        return NavigationModel._instance;
    }

    public get links(): Link[] {
        return [...this._links];
    }
}

export default NavigationModel.getInstance();
