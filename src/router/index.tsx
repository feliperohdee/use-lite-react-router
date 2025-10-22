import infer from 'use-infer';
import Router from 'use-request-utils/router';
import usePrev from 'use-good-hooks/use-prev';

import routerContext from '@/router/context';
import useRouter from '@/router/use-router';

import {
	AnchorHTMLAttributes,
	ComponentType,
	forwardRef,
	ForwardedRef,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	external?: boolean;
	href: string;
}

type NavigateProps = {
	children?: never;
	path: string;
	searchParams?: URLSearchParams;
};

type RedirectProps = {
	children?: never;
	fromPath: string;
	toPath: string;
	toSearchParams?: URLSearchParams;
};

type RoutesProps = {
	children: ReactNode;
};

type RouteState = {
	fullPath: string;
	id: string;
	path: string;
	pathParams: Record<string, unknown>;
	queryParams: Record<string, string>;
	rawPath: string;
	routes: string[];
	scrollPositions: Record<string, number>;
	searchParams: URLSearchParams;
};

type RouteProps = {
	children?: never;
	component: ComponentType<any>;
	path: string | string[];
};

const globals = {
	routeIndex: 0,
	// Global flag to track if a top-level Routes component is already mounted
	// This helps prevent accidentally having multiple top-level Routes instances
	topLevelRoutesMounted: false
};

const Routes = ({ children }: RoutesProps) => {
	const routerInstance = useRef(
		new Router<{
			id: string;
			component: ComponentType<any>;
		}>()
	);

	const [state, setState] = useState<RouteState>({
		fullPath: window.location.pathname + window.location.search,
		id: '',
		path: window.location.pathname,
		pathParams: {},
		queryParams: {},
		rawPath: '',
		routes: [],
		scrollPositions: {},
		searchParams: new URLSearchParams(window.location.search)
	});
	const prevPath = usePrev(state.path);
	const prevRoutes = usePrev(state.routes);

	const register = useCallback((path: string | string[], id: string, component: ComponentType<any>) => {
		if (Array.isArray(path)) {
			path.forEach(path => {
				routerInstance.current.add('GET', path, { id, component });
			});
		} else {
			routerInstance.current.add('GET', path, { id, component });
		}

		setState(state => {
			const newRoutes = Array.isArray(path) ? [...state.routes, ...path] : [...state.routes, path];

			return {
				...state,
				routes: newRoutes
			};
		});
	}, []);

	const resetScrollPosition = useCallback((path: string) => {
		setState(state => {
			return {
				...state,
				scrollPositions: {
					...state.scrollPositions,
					[path]: 0
				}
			};
		});
	}, []);

	const saveScrollPosition = useCallback(() => {
		const path = state.path;
		const scrollY = window.scrollY;

		setState(state => {
			return {
				...state,
				scrollPositions: {
					...state.scrollPositions,
					[path]: scrollY
				}
			};
		});
	}, [state.path]);

	const handleNavigate = useCallback(
		(path: string, searchParams?: URLSearchParams) => {
			if (!path) {
				return;
			}

			// Parse query string from path if it exists
			const [p, qs] = path.split('?');
			const sp = qs ? new URLSearchParams(qs) : new URLSearchParams();

			// Merge with provided sp if they exist
			if (searchParams) {
				searchParams.forEach((value, key) => {
					sp.set(key, value);
				});
			}

			const url = sp.size > 0 ? `${p}?${sp.toString()}` : p;

			window.history.pushState({}, '', url);

			saveScrollPosition();
			setState(state => {
				const search = sp.size > 0 ? `?${sp.toString()}` : '';
				return {
					...state,
					fullPath: p + search,
					path: p,
					searchParams: sp
				};
			});
		},
		[saveScrollPosition]
	);

	// avoid many <Routes> components
	useEffect(() => {
		if (globals.topLevelRoutesMounted) {
			const errorMessage =
				'Multiple instances of top-level Routes detected. ' + 'This can cause navigation issues and duplicate event handling.';

			// In development, throw an error to make it very obvious
			// In production, just log a warning
			if (process.env.NODE_ENV === 'development') {
				throw new Error(errorMessage);
			} else {
				console.error('WARNING: ' + errorMessage);
			}
		}

		globals.topLevelRoutesMounted = true;

		return () => {
			globals.topLevelRoutesMounted = false;
		};
	}, []);

	// add event listeners
	useEffect(() => {
		const onPopState = () => {
			const path = window.location.pathname;

			saveScrollPosition();
			setState(state => {
				const search = window.location.search;
				const searchParams = new URLSearchParams(search);
				return {
					...state,
					fullPath: path + search,
					path,
					searchParams
				};
			});
		};

		const onLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			if (anchor?.href.startsWith(window.location.origin) && !anchor.hasAttribute('data-external')) {
				e.preventDefault();

				const { pathname, searchParams } = new URL(anchor.href);
				handleNavigate(pathname, searchParams);
				resetScrollPosition(pathname);
			}
		};

		window.addEventListener('popstate', onPopState);
		document.addEventListener('click', onLinkClick);

		return () => {
			window.removeEventListener('popstate', onPopState);
			document.removeEventListener('click', onLinkClick);
		};
	}, [handleNavigate, resetScrollPosition, saveScrollPosition, state.path]);

	// handle route change
	useEffect(() => {
		const samePath = prevPath === state.path;
		const sameRoutes = prevRoutes?.join(',') === state.routes.join(',');

		if (samePath && sameRoutes) {
			return;
		}

		const matches = routerInstance.current.match('GET', state.path);

		setTimeout(() => {
			const y = state.scrollPositions[state.path] || 0;

			window.scrollTo(0, y);
		}, 0);

		if (matches.length > 0) {
			const [match] = matches;
			const { search } = window.location;
			const searchParams = new URLSearchParams(search);

			setState(state => {
				const { search } = window.location;
				const fullPath = state.path + search;

				return {
					...state,
					fullPath,
					id: match.handler.id,
					pathParams: match.pathParams,
					queryParams: infer(Object.fromEntries(searchParams.entries())),
					rawPath: match.rawPath,
					searchParams
				};
			});
		} else {
			setState(state => {
				const search = window.location.search;
				const searchParams = new URLSearchParams(search);
				return {
					...state,
					fullPath: state.path + search,
					id: '',
					pathParams: {},
					queryParams: {},
					rawPath: '',
					searchParams
				};
			});
		}
	}, [resetScrollPosition, prevPath, prevRoutes, state.path, state.routes, state.scrollPositions]);

	return (
		<routerContext.Provider
			value={{
				back: () => {
					window.history.back();
				},
				navigate: handleNavigate,
				register,
				routerInstance: routerInstance.current,
				state
			}}
		>
			{children}
		</routerContext.Provider>
	);
};

const Route = ({ path, component: Component }: RouteProps) => {
	const id = useRef(`route-${globals.routeIndex++}`);
	const mounted = useRef(false);
	const context = useContext(routerContext);

	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			context.register(path, id.current, Component);
		}
	}, [Component, path, context]);

	if (context.state.id !== id.current) {
		return null;
	}

	return <Component />;
};

const Link = forwardRef(({ href, external, children, ...props }: LinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
	return (
		<a
			{...(external ? { 'data-external': 'true' } : {})}
			{...props}
			href={href}
			ref={ref}
		>
			{children}
		</a>
	);
});

const Navigate = ({ path, searchParams }: NavigateProps) => {
	const { navigate } = useRouter();

	useEffect(() => {
		navigate(path, searchParams);
	}, [navigate, path, searchParams]);

	return null;
};

const Redirect = ({ fromPath, toPath, toSearchParams }: RedirectProps) => {
	return (
		<Route
			path={fromPath}
			component={() => (
				<Navigate
					path={toPath}
					searchParams={toSearchParams}
				/>
			)}
		/>
	);
};

export type { RouteState };
export { globals, Link, Navigate, Redirect, Route, Routes, useRouter };
