import infer from 'use-infer';
import Router from 'use-request-utils/router';

import React, { AnchorHTMLAttributes, createContext, useContext, useEffect, useState, ReactNode, ComponentType, useRef } from 'react';

type RouterContextType = {
	back: () => void;
	id: string;
	navigate: (path: string, replace?: boolean, state?: Record<string, unknown>) => void;
	path: string;
	pathParams: Record<string, unknown>;
	queryParams: Record<string, string>;
	rawPath: string;
	register: (path: string, id: string, component: ComponentType<any>) => void;
};

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	to: string;
	external?: boolean;
}

type NavigateProps = {
	to: string;
	replace?: boolean;
	state?: Record<string, unknown>;
};

type RedirectProps = {
	from: string;
	to: string;
};

type RoutesProps = {
	children: ReactNode;
};

type RouteProps = {
	component: ComponentType<any>;
	path: string;
};

const routerInstance = new Router<{ id: string; component: ComponentType<any> }>();
const RouterContext = createContext<RouterContextType>({
	back: () => {},
	id: '',
	navigate: () => {},
	path: '',
	pathParams: {},
	rawPath: '',
	queryParams: {},
	register: () => {}
});

let index = 0;

const Routes = ({ children }: RoutesProps) => {
	const [state, setState] = useState<{
		id: string;
		path: string;
		pathParams: Record<string, unknown>;
		rawPath: string;
		queryParams: Record<string, string>;
	}>({
		id: '',
		path: '',
		pathParams: {},
		rawPath: '',
		queryParams: {}
	});

	const register = (path: string, id: string, component: ComponentType<any>) => {
		routerInstance.add('GET', path, { id, component });
	};

	const updateQueryParams = () => {
		const { search } = window.location;

		if (!search) {
			setState(state => {
				return {
					...state,
					queryParams: {}
				}
			});
			return;
		}

		const searchParams = new URLSearchParams(search);

		setState(state => {
			return {
				...state,
				queryParams: infer(Object.fromEntries(searchParams.entries()))
			};
		});
	};

	useEffect(() => {
		const handleLocationChange = () => {
			setState(state => {
				return {
					...state,
					path: window.location.pathname
				};
			});
		};

		const handleLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.hasAttribute('data-external')) {
				e.preventDefault();
				const url = new URL(anchor.href);

				window.history.pushState({}, '', url.toString());
				setState(state => {
					return {
						...state,
						path: url.pathname
					};
				});
			}
		};

		window.addEventListener('popstate', handleLocationChange);
		document.addEventListener('click', handleLinkClick);

		return () => {
			window.removeEventListener('popstate', handleLocationChange);
			document.removeEventListener('click', handleLinkClick);
		};
	}, []);

	useEffect(() => {
		const matches = routerInstance.match('GET', state.path);

		if (matches.length > 0) {
			const [match] = matches;

			setState(state => {
				return {
					...state,
					id: match.handler.id,
					pathParams: match.pathParams,
					rawPath: match.rawPath
				};
			});
			
			updateQueryParams();
		} else {
			setState(state => {
				return {
					...state,
					id: '',
					pathParams: {},
					rawPath: '',
					queryParams: {}
				};
			});
		}
	}, [state.path]);

	const back = () => {
		window.history.back();
	};

	const navigate = (path: string, replace = false) => {
		if (replace) {
			window.history.replaceState({}, '', path);
		} else {
			window.history.pushState({}, '', path);
		}

		setState(state => {
			return {
				...state,
				path: path
			};
		});
		updateQueryParams();
	};

	return (
		<RouterContext.Provider
			value={{
				...state,
				back,
				navigate,
				register
			}}
		>
			{children}
		</RouterContext.Provider>
	);
};

const useRouter = () => {
	const context = useContext(RouterContext);

	if (!context) {
		throw new Error('useRouter must be used within a Routes');
	}

	return context;
};

const Route = ({ path, component: Component }: RouteProps) => {
	const id = useRef(`route-${index++}`);
	const mounted = useRef(false);
	const context = useContext(RouterContext);

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

const Link = ({ to, external, children, ...props }: LinkProps) => {
	const { navigate } = useRouter();

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (external) return;

		e.preventDefault();
		navigate(to);
	};

	return (
		<a
			href={to}
			onClick={handleClick}
			{...(external ? { 'data-external': 'true' } : {})}
			{...props}
		>
			{children}
		</a>
	);
};

const Navigate = ({ to, replace = false }: NavigateProps) => {
	const { navigate } = useRouter();

	useEffect(() => {
		navigate(to, replace);
	}, [to, replace, navigate]);

	return null;
};

const Redirect = ({ from, to }: RedirectProps) => {
	return (
		<Route
			path={from}
			component={() => (
				<Navigate
					replace
					to={to}
				/>
			)}
		/>
	);
};

export { Link, Navigate, Redirect, Route, Routes, useRouter };
