import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Link, Navigate, NestedRoutes, Redirect, Route, Routes, useRouter } from '@/router';

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
	return (
		<NestedRoutes>
			<Route
				path='/settings'
				component={() => {
					return <div data-testid='main-settings-page'>Main Settings</div>;
				}}
			/>
			<Route
				path='/settings/notifications'
				component={() => {
					return <div data-testid='notifications-settings-page'>Notifications Settings</div>;
				}}
			/>
		</NestedRoutes>
	);
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
				onClick={() => navigate('/')}
			>
				Go Home
			</button>
			<button
				data-testid='navigate-about'
				onClick={() => navigate('/about')}
			>
				Go About
			</button>
			<button
				data-testid='navigate-back'
				onClick={() => back()}
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
			path={['/settings', '/settings/not*']}
			component={Settings}
		/>
		<Route
			path='/redirect-test'
			component={() => {
				return <Navigate to='/about' />;
			}}
		/>
		<Route
			path='/not-found'
			component={NotFound}
		/>
		<Redirect
			path='/old-settings'
			to='/settings'
		/>
		<Redirect
			path='*'
			to='/not-found'
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
		expect(window.location.pathname).toBe('/about');
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
		expect(window.location.pathname).toBe('/about');
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

	it('should handles nested routes', async () => {
		window.history.pushState({}, '', '/settings/notifications');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('notifications-settings-page')).toBeInTheDocument();
		});
	});

	it('should redirects with the Redirect component', async () => {
		window.history.pushState({}, '', '/old-settings');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('main-settings-page')).toBeInTheDocument();
		});
		expect(window.location.pathname).toBe('/settings');
	});

	it('should redirects using the Navigate component', async () => {
		window.history.pushState({}, '', '/redirect-test');

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});
		expect(window.location.pathname).toBe('/about');
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

			expect(screen.getByTestId('query-params').textContent).toBe('Name: test, Page: 1');
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
