# 🚀 use-lite-react-router

![React](https://img.shields.io/badge/React-19.0.0+-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0+-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
[![Vitest](https://img.shields.io/badge/-Vitest-729B1B?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

## ✨ Features

- 🪶 **Lightweight** - Less than 3KB gzipped
- 🧩 **Simple API** - Familiar React Router-like API
- 📜 **Scroll Position Management** - Automatic scroll restoration
- 🗂️ **Route Parameters** - Dynamic routing with params
- 🔀 **Programmatic Navigation** - Navigate with hooks
- 🧪 **Well tested** - High test coverage
- 📱 **Browser History API** - Leverages native browser features
- ⚡ **Zero Dependencies** - No bloat, just what you need
- 🧠 **Smart Type Inference** - Automatically converts path and query parameters to appropriate types

## 📦 Installation

```bash
npm install use-lite-react-router

# or with yarn
yarn add use-lite-react-router

# or with pnpm
pnpm add use-lite-react-router
```

## 🚦 Quick Start

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Routes, Link } from 'use-lite-react-router';

// Your components
const Home = () => <h1>Home Page</h1>;
const About = () => <h1>About Page</h1>;
const NotFound = () => <h1>404 - Not Found</h1>;

const App = () => (
	<Routes>
		<nav>
			<Link href='/'>Home</Link>
			<Link href='/about'>About</Link>
		</nav>

		<Route
			path='/'
			component={Home}
		/>
		<Route
			path='/about'
			component={About}
		/>
		{/* Must be the last route */}
		<Route
			path='*'
			component={NotFound}
		/>
	</Routes>
);

createRoot(document.getElementById('root')).render(<App />);
```

## 📖 API Reference

### `<Routes>`

The container component that establishes the routing context.

```jsx
<Routes>{/* Your route components go here */}</Routes>
```

### `<Route>`

Defines a route with a path and component.

```jsx
<Route
	path='/users/:id'
	component={UserProfile}
/>
```

### `<Link>`

A navigation component for creating links.

```jsx
<Link href="/about">About</Link>
<Link href="https://example.com" external>External Link</Link>
```

### `<Navigate>`

Performs a programmatic navigation when rendered.

```jsx
<Navigate to='/dashboard' />
```

### `<Redirect>`

Creates a route that redirects to another path.

```jsx
<Redirect
	path='/old-path'
	to='/new-path'
/>
```

### `useRouter()`

A hook that provides access to the router context.

```jsx
const UserProfile = () => {
	const { pathParams, navigate, back, queryParams } = useRouter();

	return (
		<div>
			<h1>User ID: {pathParams.id}</h1>
			<button onClick={() => navigate('/dashboard')}>Dashboard</button>
			<button onClick={() => back()}>Go Back</button>
			<p>Page: {queryParams.page}</p>
		</div>
	);
};
```

## 🎯 Advanced Usage

### Route Parameters with Type Inference

```jsx
// Route definition
<Route
	path='/users/:id/posts/:postId'
	component={UserPost}
/>;

// In your component
const UserPost = () => {
	const { pathParams } = useRouter();

	// Type inference automatically converts numeric strings to numbers
	// URL: /users/123/posts/456
	// pathParams.id === 123 (number, not string "123")
	// pathParams.postId === 456 (number, not string "456")

	return (
		<div>
			<h1>User ID: {pathParams.id}</h1>
			<h2>Post ID: {pathParams.postId}</h2>
			<p>User ID type: {typeof pathParams.id}</p> {/* "number" */}
		</div>
	);
};
```

### Query Parameters with Type Inference

```jsx
// URL: /search?query=react&sort=recent&page=2&limit=10&featured=true
const SearchPage = () => {
	const { queryParams } = useRouter();

	// Type inference automatically converts values to appropriate types
	// queryParams.query === "react" (string)
	// queryParams.sort === "recent" (string)
	// queryParams.page === 2 (number, not string "2")
	// queryParams.limit === 10 (number, not string "10")
	// queryParams.featured === true (boolean, not string "true")

	return (
		<div>
			<h1>Search Results for: {queryParams.query}</h1>
			<p>Sort: {queryParams.sort}</p>
			<p>
				Page: {queryParams.page} (Type: {typeof queryParams.page})
			</p>{' '}
			{/* "2 (Type: number)" */}
			<p>Limit: {queryParams.limit} items per page</p>
			<p>Featured only: {queryParams.featured ? 'Yes' : 'No'}</p>
		</div>
	);
};
```

### Programmatic Navigation

```jsx
const Dashboard = () => {
	const { navigate, back } = useRouter();

	return (
		<div>
			<h1>Dashboard</h1>
			<button onClick={() => navigate('/settings')}>Settings</button>
			<button onClick={() => back()}>Go Back</button>
		</div>
	);
};
```

### Catching 404 Routes

```jsx
<Routes>
	<Route
		path='/'
		component={Home}
	/>
	<Route
		path='/about'
		component={About}
	/>
	<Route
		path='/not-found'
		component={NotFound}
	/>
	{/* Must be the last route */}
	<Redirect
		path='*'
		to='/not-found'
	/>
</Routes>
```

## 🎨 Full Example

```jsx
import React from 'react';
import { Routes, Route, Link, Redirect, Navigate, useRouter } from 'use-lite-react-router';

const Layout = ({ children, title }) => {
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
				</nav>
			</header>
			<main>{children}</main>
		</div>
	);
};

const Home = () => (
	<Layout title='Home'>
		<h2>Welcome to use-lite-react-router</h2>
		<Link href='/dashboard'>Go to Dashboard</Link>
	</Layout>
);

const Dashboard = () => {
	const { navigate } = useRouter();

	return (
		<Layout title='Dashboard'>
			<h2>Dashboard</h2>
			<button onClick={() => navigate('/profile/123')}>Go to Profile</button>
		</Layout>
	);
};

const Profile = () => {
	const { pathParams } = useRouter();

	return (
		<Layout title='User Profile'>
			<h2>Profile ID: {pathParams.id}</h2>
			<Link href='/settings'>Go to Settings</Link>
		</Layout>
	);
};

const NotFound = () => (
	<Layout title='Not Found'>
		<h2>404 - Page Not Found</h2>
		<Link href='/'>Back to Home</Link>
	</Layout>
);

const App = () => {
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
				path='/not-found'
				component={NotFound}
			/>
			{/* Must be the last route */}
			<Redirect
				path='*'
				to='/not-found'
			/>
		</Routes>
	);
};

export default App;
```

## 🧠 How It Works

`use-lite-react-router` is built around React's Context API and leverages the Browser's History API. It manages routes in a central registry and handles navigation events through a combination of programmatic changes and link interception.

Key concepts:

1. **Route Registration**: Routes are registered with a unique ID and matching pattern
2. **Path Matching**: When the URL changes, the router finds the matching route
3. **Scroll Management**: Scroll positions are saved and restored during navigation
4. **Context Sharing**: Router state is shared through React Context
5. **Type Inference**: Path and query parameters are automatically converted to their appropriate types:
   - Numeric values (`/users/123` or `?page=10`) are converted to numbers
   - Boolean values (`?enabled=true`) are converted to booleans
   - Everything else remains as strings

## 🧪 Running Tests

```bash
yarn test
```

## 📝 License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## 👨‍💻 Author

**Felipe Rohde**

- Twitter: [@felipe_rohde](https://twitter.com/felipe_rohde)
- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
