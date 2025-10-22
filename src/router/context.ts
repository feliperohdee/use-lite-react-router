import { ComponentType, createContext } from 'react';
import Router from 'use-request-utils/router';

import type { RouteState } from './index';

type RouterContext = {
	back: () => void;
	navigate: (path: string, searchParams?: URLSearchParams) => void;
	register: (path: string | string[], id: string, component: ComponentType<any>) => void;
	routerInstance: Router<{
		id: string;
		component: ComponentType<any>;
	}>;
	state: RouteState;
};

const routerContext = createContext<RouterContext>({
	back: () => {},
	navigate: () => {},
	register: () => {},
	routerInstance: null!,
	state: null!
});

export default routerContext;
