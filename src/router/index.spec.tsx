import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Link, Navigate, Redirect, Route, Routes, useRouter } from '@/router';

const scrollToMock = vi.fn();
window.scrollTo = scrollToMock;

const Home = () => {
	return <div data-testid='home-page'>Home Page</div>;
};

const About = () => {
	return <div data-testid='about-page'>About Page</div>;
};

const User = () => {
	const { pathParams } = useRouter();
	return <div data-testid='user-page'>User ID: {pathParams.id as string}</div>;
};

const Settings = () => {
	return <div data-testid='main-settings-page'>Main Settings</div>;
};

const NotFound = () => {
	return <div data-testid='not-found-page'>Not Found</div>;
};

const NavigationTest = () => {
	const { navigate, back } = useRouter();

	return (
		<div>
			<button
				data-testid='navigate-home'
				onClick={() => {
					navigate('/');
				}}
			>
				Go Home
			</button>
			<button
				data-testid='navigate-about'
				onClick={() => {
					navigate('/about');
				}}
			>
				Go About
			</button>
			<button
				data-testid='navigate-back'
				onClick={() => {
					back();
				}}
			>
				Go Back
			</button>
		</div>
	);
};

const App = () => (
	<Routes>
		<NavigationTest />
		<Route
			path='/'
			component={Home}
		/>
		<Route
			path='/about'
			component={About}
		/>
		<Route
			path='/user/:id'
			component={User}
		/>
		<Route
			path='/redirect-test'
			component={() => {
				return <Navigate path='/about' />;
			}}
		/>
		<Route
			path='/settings'
			component={Settings}
		/>
		<Route
			path='/not-found'
			component={NotFound}
		/>
		<Redirect
			fromPath='/old-settings'
			toPath='/settings'
		/>
		<Redirect
			fromPath='*'
			toPath='/not-found'
		/>
	</Routes>
);

describe('/router', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should renders the initial route', () => {
		render(<App />);
		expect(screen.getByTestId('home-page')).toBeInTheDocument();
	});

	it('should navigates to a new route when Link is clicked', async () => {
		render(
			<Routes>
				<Link
					href='/about'
					data-testid='about-link'
				>
					About
				</Link>
				<Link
					href='/about?name=test&page=1'
					data-testid='about-link-with-query-params'
				>
					About with query params
				</Link>
				<Route
					path='/'
					component={Home}
				/>
				<Route
					path='/about'
					component={About}
				/>
			</Routes>
		);

		// Verify initial route
		expect(screen.getByTestId('home-page')).toBeInTheDocument();

		// Click link and verify navigation
		fireEvent.click(screen.getByTestId('about-link'));
		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL has changed
		expect(window.location.pathname).toEqual('/about');
		expect(window.location.search).toEqual('');

		// Click link with query params and verify navigation
		fireEvent.click(screen.getByTestId('about-link-with-query-params'));
		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL has changed
		expect(window.location.pathname).toEqual('/about');
		expect(window.location.search).toEqual('?name=test&page=1');
	});

	it('should navigate with query string in path parameter', async () => {
		const NavigateTest = () => {
			const { navigate } = useRouter();

			return (
				<div>
					<button
						data-testid='navigate-with-query'
						onClick={() => {
							navigate('/about?name=test&page=1');
						}}
					>
						Navigate with Query
					</button>
				</div>
			);
		};

		const AboutPage = () => {
			const { queryParams } = useRouter();
			return (
				<div data-testid='about-page'>
					About Page - Name: {queryParams.name}, Page: {queryParams.page}
				</div>
			);
		};

		render(
			<Routes>
				<Route
					path='/'
					component={NavigateTest}
				/>
				<Route
					path='/about'
					component={AboutPage}
				/>
			</Routes>
		);

		// Navigate with query string in path
		fireEvent.click(screen.getByTestId('navigate-with-query'));

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL and query params
		expect(window.location.pathname).toEqual('/about');
		expect(window.location.search).toEqual('?name=test&page=1');
		expect(screen.getByTestId('about-page').textContent).toEqual('About Page - Name: test, Page: 1');
	});

	it('should navigate with query string in path and additional searchParams', async () => {
		const NavigateTest = () => {
			const { navigate } = useRouter();

			return (
				<div>
					<button
						data-testid='navigate-with-merge'
						onClick={() => {
							const searchParams = new URLSearchParams({
								category: 'tech',
								page: '2' // must override the query string in the path
							});
							navigate('/about?name=test&page=1', searchParams);
						}}
					>
						Navigate with Merge
					</button>
				</div>
			);
		};

		const AboutPage = () => {
			const { queryParams } = useRouter();
			return (
				<div data-testid='about-page'>
					About Page - Name: {queryParams.name}, Page: {queryParams.page}, Category: {queryParams.category}
				</div>
			);
		};

		render(
			<Routes>
				<Route
					path='/'
					component={NavigateTest}
				/>
				<Route
					path='/about'
					component={AboutPage}
				/>
			</Routes>
		);

		// Navigate with query string in path and additional searchParams
		fireEvent.click(screen.getByTestId('navigate-with-merge'));

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL and query params (page should be overridden by searchParams)
		expect(window.location.pathname).toEqual('/about');
		expect(window.location.search).toEqual('?name=test&page=2&category=tech');
		expect(screen.getByTestId('about-page').textContent).toEqual('About Page - Name: test, Page: 2, Category: tech');
	});

	it('should navigate with only searchParams parameter', async () => {
		const NavigateTest = () => {
			const { navigate } = useRouter();

			return (
				<div>
					<button
						data-testid='navigate-with-search-params'
						onClick={() => {
							const searchParams = new URLSearchParams();
							searchParams.set('filter', 'active');
							searchParams.set('sort', 'name');
							navigate('/about', searchParams);
						}}
					>
						Navigate with SearchParams
					</button>
				</div>
			);
		};

		const AboutPage = () => {
			const { queryParams } = useRouter();
			return (
				<div data-testid='about-page'>
					About Page - Filter: {queryParams.filter}, Sort: {queryParams.sort}
				</div>
			);
		};

		render(
			<Routes>
				<Route
					path='/'
					component={NavigateTest}
				/>
				<Route
					path='/about'
					component={AboutPage}
				/>
			</Routes>
		);

		// Navigate with only searchParams
		fireEvent.click(screen.getByTestId('navigate-with-search-params'));

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL and query params
		expect(window.location.pathname).toEqual('/about');
		expect(window.location.search).toEqual('?filter=active&sort=name');
		expect(screen.getByTestId('about-page').textContent).toEqual('About Page - Filter: active, Sort: name');
	});

	it('should navigates programmatically using the useRouter hook', async () => {
		render(<App />);

		// Verify initial route
		expect(screen.getByTestId('home-page')).toBeInTheDocument();

		// Navigate programmatically
		fireEvent.click(screen.getByTestId('navigate-about'));
		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify URL has changed
		expect(window.location.pathname).toEqual('/about');
	});

	it('should handles browser back button (simulated with back() method)', async () => {
		render(<App />);

		// Navigate to about
		fireEvent.click(screen.getByTestId('navigate-about'));
		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Mock history.back
		const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
			window.history.pushState({}, '', '/');
			// Simulate popstate event
			const popStateEvent = new PopStateEvent('popstate', { state: {} });
			window.dispatchEvent(popStateEvent);
		});

		// Go back programmatically
		fireEvent.click(screen.getByTestId('navigate-back'));

		await waitFor(() => {
			expect(screen.getByTestId('home-page')).toBeInTheDocument();
		});

		expect(historyBackSpy).toHaveBeenCalled();
		historyBackSpy.mockRestore();
	});

	it('should handles route params', async () => {
		render(
			<Routes>
				<Link
					href='/user/123'
					data-testid='user-link'
				>
					User Profile
				</Link>
				<Route
					path='/'
					component={Home}
				/>
				<Route
					path='/user/:id'
					component={User}
				/>
			</Routes>
		);

		// Navigate to user profile
		fireEvent.click(screen.getByTestId('user-link'));

		await waitFor(() => {
			const userPage = screen.getByTestId('user-page');
			expect(userPage).toBeInTheDocument();
			expect(userPage.textContent).toContain('User ID: 123');
		});
	});

	it('should redirects with the Redirect component', async () => {
		window.history.pushState({}, '', '/old-settings');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('main-settings-page')).toBeInTheDocument();
		});
		expect(window.location.pathname).toEqual('/settings');
	});

	it('should redirects using the Navigate component', async () => {
		window.history.pushState({}, '', '/redirect-test');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});
		expect(window.location.pathname).toEqual('/about');
	});

	it('should redirects to not found for unmatched routes', async () => {
		window.history.pushState({}, '', '/non-existent');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
		});
	});

	it('should handles external links', () => {
		render(
			<Routes>
				<Link
					href='https://example.com'
					external
					data-testid='external-link'
				>
					External
				</Link>
				<Route
					path='/'
					component={Home}
				/>
			</Routes>
		);

		const externalLink = screen.getByTestId('external-link');
		expect(externalLink).toHaveAttribute('href', 'https://example.com');
		expect(externalLink).toHaveAttribute('data-external', 'true');
	});

	it('should restores scroll position on navigation', async () => {
		render(<App />);

		// Mock window.scrollY
		Object.defineProperty(window, 'scrollY', {
			value: 100,
			writable: true
		});

		// Navigate to about
		fireEvent.click(screen.getByTestId('navigate-about'));

		// Navigate back to home
		fireEvent.click(screen.getByTestId('navigate-home'));

		// Verify scroll restoration attempt
		await waitFor(() => {
			expect(scrollToMock).toHaveBeenCalledWith(0, 0);
		});
	});

	describe('path normalization', () => {
		it('should navigate with paths without leading slash', async () => {
			const NavigateTest = () => {
				const { navigate } = useRouter();

				return (
					<div>
						<button
							data-testid='navigate-without-slash'
							onClick={() => {
								navigate('about'); // No leading slash
							}}
						>
							Navigate without slash
						</button>
						<button
							data-testid='navigate-with-slash'
							onClick={() => {
								navigate('/about'); // With leading slash
							}}
						>
							Navigate with slash
						</button>
					</div>
				);
			};

			render(
				<Routes>
					<Route
						path='/'
						component={NavigateTest}
					/>
					<Route
						path='/about'
						component={About}
					/>
				</Routes>
			);

			// Test navigation without leading slash
			fireEvent.click(screen.getByTestId('navigate-without-slash'));
			await waitFor(() => {
				expect(screen.getByTestId('about-page')).toBeInTheDocument();
			});

			expect(window.location.pathname).toEqual('/about');

			// Test navigation with leading slash (navigate back to home first)
			window.history.pushState({}, '', '/');
			const popStateEvent = new PopStateEvent('popstate', { state: {} });
			window.dispatchEvent(popStateEvent);

			await waitFor(() => {
				expect(screen.getByTestId('navigate-with-slash')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByTestId('navigate-with-slash'));
			await waitFor(() => {
				expect(screen.getByTestId('about-page')).toBeInTheDocument();
			});

			expect(window.location.pathname).toEqual('/about');
		});

		it('should register routes with paths without leading slash', async () => {
			const RouteWithoutSlash = () => {
				return <div data-testid='route-without-slash'>Route Without Slash</div>;
			};

			render(
				<Routes>
					<Link
						href='/test-route'
						data-testid='test-route-link'
					>
						Test Route
					</Link>
					<Route
						path='test-route' // No leading slash
						component={RouteWithoutSlash}
					/>
				</Routes>
			);

			// Navigate to the route
			fireEvent.click(screen.getByTestId('test-route-link'));
			await waitFor(() => {
				expect(screen.getByTestId('route-without-slash')).toBeInTheDocument();
			});

			expect(window.location.pathname).toEqual('/test-route');
		});

		it('should navigate with query parameters and paths without leading slash', async () => {
			const NavigateTest = () => {
				const { navigate } = useRouter();

				return (
					<div>
						<button
							data-testid='navigate-with-query-no-slash'
							onClick={() => {
								navigate('about?name=test&page=1'); // No leading slash with query
							}}
						>
							Navigate with query no slash
						</button>
					</div>
				);
			};

			const AboutPage = () => {
				const { queryParams } = useRouter();
				return (
					<div data-testid='about-page'>
						About Page - Name: {queryParams.name}, Page: {queryParams.page}
					</div>
				);
			};

			render(
				<Routes>
					<Route
						path='/'
						component={NavigateTest}
					/>
					<Route
						path='/about'
						component={AboutPage}
					/>
				</Routes>
			);

			// Navigate with query string and no leading slash
			fireEvent.click(screen.getByTestId('navigate-with-query-no-slash'));

			await waitFor(() => {
				expect(screen.getByTestId('about-page')).toBeInTheDocument();
			});

			// Verify URL and query params
			expect(window.location.pathname).toEqual('/about');
			expect(window.location.search).toEqual('?name=test&page=1');
			expect(screen.getByTestId('about-page').textContent).toEqual('About Page - Name: test, Page: 1');
		});

		it('should register array of paths without leading slash', async () => {
			const MultipleRoutes = () => {
				return <div data-testid='multiple-routes'>Multiple Routes</div>;
			};

			render(
				<Routes>
					<Link
						href='/route1'
						data-testid='route1-link'
					>
						Route 1
					</Link>
					<Link
						href='/route2'
						data-testid='route2-link'
					>
						Route 2
					</Link>
					<Route
						path={['route1', 'route2']} // No leading slashes
						component={MultipleRoutes}
					/>
				</Routes>
			);

			// Test first route
			fireEvent.click(screen.getByTestId('route1-link'));
			await waitFor(() => {
				expect(screen.getByTestId('multiple-routes')).toBeInTheDocument();
			});

			expect(window.location.pathname).toEqual('/route1');

			// Test second route
			fireEvent.click(screen.getByTestId('route2-link'));
			await waitFor(() => {
				expect(screen.getByTestId('multiple-routes')).toBeInTheDocument();
			});

			expect(window.location.pathname).toEqual('/route2');
		});
	});

	describe('edge-cases', () => {
		beforeEach(() => {
			window.history.pushState({}, '', '/');
			vi.clearAllMocks();
		});

		it('should handles query parameters', () => {
			window.history.pushState({}, '', '/?name=test&page=1');

			const QueryParamComponent = () => {
				const { queryParams } = useRouter();

				return (
					<div data-testid='query-params'>
						Name: {queryParams.name}, Page: {queryParams.page}
					</div>
				);
			};

			render(
				<Routes>
					<Route
						path='/'
						component={QueryParamComponent}
					/>
				</Routes>
			);

			expect(screen.getByTestId('query-params').textContent).toEqual('Name: test, Page: 1');
		});

		it('should throws an error when useRouter is used outside Routes', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const InvalidComponent = () => {
				useRouter();
				return <div>Invalid</div>;
			};

			expect(() => {
				render(<InvalidComponent />);
			}).toThrow('useRouter must be used within a Routes');

			consoleSpy.mockRestore();
		});

		it('should handles concurrent route registrations', async () => {
			window.history.pushState({}, '', '/a');

			const RouteA = () => {
				return <div data-testid='route-a'>Route A</div>;
			};

			const RouteB = () => {
				return <div data-testid='route-b'>Route B</div>;
			};

			render(
				<Routes>
					<Route
						path='/a'
						component={RouteA}
					/>
					<Route
						path='/a'
						component={RouteB}
					/>
				</Routes>
			);

			await waitFor(() => {
				// The first registered route should win
				expect(screen.getByTestId('route-a')).toBeInTheDocument();
				expect(screen.queryByTestId('route-b')).not.toBeInTheDocument();
			});
		});
	});
});
