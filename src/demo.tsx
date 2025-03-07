import '@/demo.css';

import { ReactNode } from 'react';
import { Link, Navigate, Redirect, Route, Routes, useRouter } from '@/router';

const Layout = ({ children, title }: { children: ReactNode; title: string }) => {
	const { rawPath } = useRouter();

	return (
		<div className='container'>
			<header>
				<h1>{title}</h1>
				<nav>
					<Link
						className={rawPath === '/' ? 'active' : ''}
						href='/'
					>
						Home
					</Link>
					<Link
						className={rawPath === '/dashboard' ? 'active' : ''}
						href='/dashboard'
					>
						Dashboard
					</Link>
					<Link
						className={rawPath === '/profile/:id' ? 'active' : ''}
						href='/profile/123'
					>
						Profile
					</Link>
					<Link
						className={rawPath === '/settings' ? 'active' : ''}
						href='/settings'
					>
						Settings
					</Link>
					<Link
						href='/not-found'
						className={rawPath === '/not-found' ? 'active' : ''}
					>
						Not Found
					</Link>
				</nav>
			</header>
			<main>{children}</main>
		</div>
	);
};

const Home = () => (
	<Layout title='Home'>
		<div className='page'>
			<h2>Home Page</h2>
			<p>Welcome to the Lite React Router demo!</p>
			<p>Try navigating through the different routes using the links above.</p>
			<div className='actions'>
				<Link
					className='button'
					href='/dashboard'
				>
					Go to Dashboard
				</Link>
			</div>
		</div>
	</Layout>
);

const Dashboard = () => {
	const { navigate } = useRouter();

	return (
		<Layout title='Dashboard'>
			<div className='page'>
				<h2>Dashboard</h2>
				<p>This is the dashboard page. Here you could show analytics or important information.</p>
				<div className='actions'>
					<button
						onClick={() => navigate('/profile/123')}
						className='button'
					>
						Go to Profile (using navigate)
					</button>
				</div>
			</div>
		</Layout>
	);
};

const Profile = () => {
	const user = {
		name: 'John Doe',
		email: 'john@example.com',
		role: 'Developer'
	};

	return (
		<Layout title='User Profile'>
			<div className='page'>
				<h2>Profile</h2>
				<div className='card'>
					<h3>{user.name}</h3>
					<p>Email: {user.email}</p>
					<p>Role: {user.role}</p>
				</div>
				<div className='actions'>
					<Link
						className='button'
						href='/settings'
					>
						Go to Settings
					</Link>
				</div>
			</div>
		</Layout>
	);
};

const Settings = () => (
	<Layout title='Settings'>
		<div className='page'>
			<h2>Settings</h2>
			<p>This is where you would configure your application settings.</p>
			<div className='actions'>
				<Link
					className='button'
					href='/'
				>
					Go to Home
				</Link>
			</div>
		</div>
	</Layout>
);

const LoginRedirect = () => {
	return <Navigate to='/dashboard' />;
};

const NotFound = () => (
	<Layout title='Not Found'>
		<div className='page'>
			<h2>404 - Page Not Found</h2>
			<p>The page you are looking for doesn't exist or has been moved.</p>
			<div className='actions'>
				<Link
					className='button'
					href='/'
				>
					Back to Home
				</Link>
			</div>
		</div>
	</Layout>
);

const Demo = () => {
	return (
		<Routes>
			<Route
				path='/'
				component={Home}
			/>
			<Route
				path='/dashboard'
				component={Dashboard}
			/>
			<Route
				path='/profile/:id'
				component={Profile}
			/>
			<Route
				path='/settings'
				component={Settings}
			/>
			<Route
				path='/login'
				component={LoginRedirect}
			/>
			<Route
				path='/not-found'
				component={NotFound}
			/>
			<Redirect
				path='/old-dashboard'
				to='/dashboard'
			/>
			<Redirect
				path='*'
				to='/not-found'
			/>
		</Routes>
	);
};

export default Demo;
