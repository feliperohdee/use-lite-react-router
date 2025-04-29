import { ComponentType, createContext } from 'react';
import Router from 'use-request-utils/router';

import type { RoutesState } from './index';

type RouterContext = {
	back: () => void;
	navigate: (path: string, replace?: boolean, state?: Record<string, unknown>) => void;
	register: (path: string | string[], id: string, component: ComponentType<any>) => void;
	routerInstance: Router<{
		id: string;
		component: ComponentType<any>;
	}>;
	state: RoutesState;
};

const routerContext = createContext<RouterContext>({
	back: () => {},
	navigate: () => {},
	register: () => {},
	routerInstance: null!,
	state: null!
});

export default routerContext;
