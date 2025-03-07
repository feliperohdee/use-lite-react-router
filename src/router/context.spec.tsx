import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Link, Route, Routes, useRouter } from '@/router';
import routerContext from '@/router/context';

const scrollToMock = vi.fn();
window.scrollTo = scrollToMock;

describe('/router/context', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
		Object.defineProperty(window, 'scrollY', {
			value: 0
		});

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should provides context values', async () => {
		const ContextTester = () => {
			const context = useRouter();

			return (
				<div data-testid='context-values'>
					<div data-testid='path-value'>{context.path}</div>
					<div data-testid='raw-path-value'>{context.rawPath}</div>
					<button
						data-testid='navigate-button'
						onClick={() => context.navigate('/user/123')}
					>
						Navigate
					</button>
				</div>
			);
		};

		const UserComponent = () => {
			const { pathParams } = useRouter();
			return <div data-testid='user-params'>{JSON.stringify(pathParams)}</div>;
		};

		render(
			<Routes>
				<Route
					path='/'
					component={ContextTester}
				/>
				<Route
					path='/user/:id'
					component={UserComponent}
				/>
			</Routes>
		);

		// Check initial values
		expect(screen.getByTestId('path-value').textContent).toBe('/');

		// Navigate programmatically
		fireEvent.click(screen.getByTestId('navigate-button'));

		// Check updated context after navigation
		await waitFor(() => {
			expect(screen.getByTestId('user-params')).toBeInTheDocument();
			const params = JSON.parse(screen.getByTestId('user-params').textContent || '{}');
			expect(params.id).toBe(123);
		});
	});

	it('should saves and restores scroll positions', async () => {
		// Components for testing scroll behavior
		const HomePage = () => (
			<div
				data-testid='home-page'
				style={{ height: '2000px' }}
			>
				<h1>Home Page</h1>
				<Link
					href='/about'
					data-testid='about-link'
				>
					About
				</Link>
			</div>
		);

		const AboutPage = () => (
			<div
				data-testid='about-page'
				style={{ height: '2000px' }}
			>
				<h1>About Page</h1>
				<Link
					href='/'
					data-testid='home-link'
				>
					Home
				</Link>
			</div>
		);

		render(
			<Routes>
				<Route
					path='/'
					component={HomePage}
				/>
				<Route
					path='/about'
					component={AboutPage}
				/>
			</Routes>
		);

		// Set initial scroll position
		Object.defineProperty(window, 'scrollY', { value: 100 });

		// Navigate to about page (this should save home page scroll position)
		fireEvent.click(screen.getByTestId('about-link'));

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		// Verify scroll was reset for new page
		expect(scrollToMock).toHaveBeenCalledWith(0, 0);

		// Set a different scroll position on about page
		Object.defineProperty(window, 'scrollY', { value: 200 });

		// Navigate back to home page
		window.history.pushState({}, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate'));

		await waitFor(() => {
			expect(screen.getByTestId('home-page')).toBeInTheDocument();
		});

		// Check if the scroll position for home page was restored
		expect(scrollToMock).toHaveBeenCalledWith(0, 100);
	});

	it('should handles browser navigation events', async () => {
		const HomePage = () => {
			return <div data-testid='home-page'>Home Page</div>;
		};

		const AboutPage = () => {
			return <div data-testid='about-page'>About Page</div>;
		};

		render(
			<Routes>
				<div>
					<Link
						href='/about'
						data-testid='about-link'
					>
						About
					</Link>
					<Route
						path='/'
						component={HomePage}
					/>
					<Route
						path='/about'
						component={AboutPage}
					/>
				</div>
			</Routes>
		);

		// Navigate to about page
		fireEvent.click(screen.getByTestId('about-link'));

		await waitFor(() => {
			expect(screen.getByTestId('about-page')).toBeInTheDocument();
		});

		expect(window.location.pathname).toBe('/about');

		// Simulate browser back button
		window.history.pushState({}, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate'));

		await waitFor(() => {
			expect(screen.getByTestId('home-page')).toBeInTheDocument();
		});

		expect(window.location.pathname).toBe('/');
	});

	it('should works with custom context Provider', () => {
		// Test direct usage of the context provider
		const customContextValue = {
			back: vi.fn(),
			id: 'test-id',
			navigate: vi.fn(),
			path: '/custom-path',
			pathParams: { id: '999' },
			queryParams: { sort: 'asc' },
			rawPath: '/custom/:id',
			register: vi.fn(),
			scrollPositions: { '/': 0 }
		};

		const ContextConsumer = () => {
			const context = useRouter();
			return (
				<div data-testid='custom-context'>
					<div data-testid='custom-path'>{context.path}</div>
					<div data-testid='custom-id'>{context.id}</div>
				</div>
			);
		};

		render(
			<routerContext.Provider value={customContextValue}>
				<ContextConsumer />
			</routerContext.Provider>
		);

		expect(screen.getByTestId('custom-path').textContent).toBe('/custom-path');
		expect(screen.getByTestId('custom-id').textContent).toBe('test-id');
	});
});
