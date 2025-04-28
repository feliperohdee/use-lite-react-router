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
};

type RouteProps = {
	children?: never;
	component: ComponentType<any>;
	path: string | string[];
};

let routeIndex = 0;

const Routes = ({ children }: RoutesProps) => {
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

	useEffect(() => {
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
	}, [handleNavigate, resetScrollPosition, saveScrollPosition, state.path]);

	// handle route change
	useEffect(() => {
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
	}, [resetScrollPosition, state.path, state.scrollPositions]);

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
	const id = useRef(`route-${routeIndex++}`);
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

const Redirect = ({ path, to }: RedirectProps) => {
	return (
		<Route
			path={path}
			component={() => <Navigate to={to} />}
		/>
	);
};

export { Link, Navigate, Redirect, Route, Routes, useRouter };
