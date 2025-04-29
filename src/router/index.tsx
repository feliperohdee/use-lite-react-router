import infer from 'use-infer';
import Router from 'use-request-utils/router';

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
	to: string;
};

type RedirectProps = {
	children?: never;
	path: string;
	to: string;
};

type RoutesProps = {
	children: ReactNode;
	nested?: boolean;
};

type RouteProps = {
	children?: never;
	component: ComponentType<any>;
	path: string | string[];
};

const globals = {
	// Global flag to track if a top-level Routes component is already mounted
	// This helps prevent accidentally having multiple top-level Routes instances
	topLevelRoutesMounted: false,
	routeIndex: 0
};

const Routes = ({ children, nested = false }: RoutesProps) => {
	const routerInstance = useRef(
		new Router<{
			id: string;
			component: ComponentType<any>;
		}>()
	);

	const [state, setState] = useState<{
		id: string;
		path: string;
		pathParams: Record<string, unknown>;
		rawPath: string;
		queryParams: Record<string, string>;
		scrollPositions: Record<string, number>;
	}>({
		id: '',
		path: window.location.pathname,
		pathParams: {},
		rawPath: '',
		queryParams: {},
		scrollPositions: {}
	});

	const register = useCallback((path: string | string[], id: string, component: ComponentType<any>) => {
		if (Array.isArray(path)) {
			path.forEach(path => {
				routerInstance.current.add('GET', path, { id, component });
			});
		} else {
			routerInstance.current.add('GET', path, { id, component });
		}
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
		(path: string) => {
			window.history.pushState({}, '', path);

			saveScrollPosition();
			setState(state => {
				return { ...state, path };
			});
		},
		[saveScrollPosition]
	);

	// When mounting a non-nested Routes component, check if a top-level one already exists
	useEffect(() => {
		if (!nested) {
			if (globals.topLevelRoutesMounted) {
				const errorMessage =
					'Multiple instances of top-level Routes detected. ' +
					'This can cause navigation issues and duplicate event handling. ' +
					'Use NestedRoutes for nested route definitions instead of Routes.';

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
		}
	}, [nested]);

	// Only set up event listeners for the top-level Routes component
	useEffect(() => {
		// Skip setting up listeners for nested Routes
		if (nested) {
			return;
		}

		const onPopState = () => {
			const path = window.location.pathname;

			saveScrollPosition();
			setState(state => {
				return { ...state, path };
			});
		};

		const onLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.hasAttribute('data-external')) {
				e.preventDefault();

				const { pathname } = new URL(anchor.href);
				handleNavigate(pathname);
				resetScrollPosition(pathname);
			}
		};

		window.addEventListener('popstate', onPopState);
		document.addEventListener('click', onLinkClick);

		return () => {
			window.removeEventListener('popstate', onPopState);
			document.removeEventListener('click', onLinkClick);
		};
	}, [handleNavigate, nested, resetScrollPosition, saveScrollPosition, state.path]);

	// handle route change
	useEffect(() => {
		const matches = routerInstance.current.match('GET', state.path);

		// Only handle scroll restoration in the top-level Routes
		if (!nested) {
			setTimeout(() => {
				const y = state.scrollPositions[state.path] || 0;
				window.scrollTo(0, y);
			}, 0);
		}

		if (matches.length > 0) {
			const [match] = matches;
			const { search } = window.location;
			const searchParams = new URLSearchParams(search);

			setState(state => {
				return {
					...state,
					id: match.handler.id,
					pathParams: match.pathParams,
					queryParams: infer(Object.fromEntries(searchParams.entries())),
					rawPath: match.rawPath
				};
			});
		} else {
			setState(state => {
				return {
					...state,
					id: '',
					pathParams: {},
					queryParams: {},
					rawPath: ''
				};
			});
		}
	}, [nested, resetScrollPosition, state.path, state.scrollPositions]);

	return (
		<routerContext.Provider
			value={{
				...state,
				back: () => {
					window.history.back();
				},
				navigate: handleNavigate,
				register
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

	if (context.id !== id.current) {
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

const Navigate = ({ to }: NavigateProps) => {
	const { navigate } = useRouter();

	useEffect(() => {
		navigate(to);
	}, [to, navigate]);

	return null;
};

const NestedRoutes = ({ children }: Omit<RoutesProps, 'nested'>) => {
	return <Routes nested>{children}</Routes>;
};

const Redirect = ({ path, to }: RedirectProps) => {
	return (
		<Route
			path={path}
			component={() => <Navigate to={to} />}
		/>
	);
};

export { globals, Link, Navigate, NestedRoutes, Redirect, Route, Routes, useRouter };
