import { ComponentType, createContext } from 'react';

type RouterContext = {
	back: () => void;
	id: string;
	navigate: (path: string, replace?: boolean, state?: Record<string, unknown>) => void;
	path: string;
	pathParams: Record<string, unknown>;
	queryParams: Record<string, string>;
	rawPath: string;
	register: (path: string, id: string, component: ComponentType<any>) => void;
	scrollPositions: Record<string, number>;
};

const routerContext = createContext<RouterContext>({
	back: () => {},
	id: '',
	navigate: () => {},
	path: '',
	pathParams: {},
	rawPath: '',
	queryParams: {},
	register: () => {},
	scrollPositions: {}
});

export default routerContext;
