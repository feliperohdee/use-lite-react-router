import { defineConfig, UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(env => {
	const config: UserConfig = {
		plugins: [react()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src')
			}
		}
	};

	if (env.mode === 'export') {
		config.build = {
			copyPublicDir: false,
			lib: {
				entry: './src/index.ts',
				formats: ['es']
			},
			minify: false,
			rollupOptions: {
				external: ['react', 'react-dom', 'react/jsx-runtime', 'use-infer'],
				output: {
					entryFileNames: '[name].js'
				}
			}
		};

		config.plugins = [
			...config.plugins!,
			dts({
				exclude: ['./src/**/*.spec.tsx'],
				include: ['./src/router/*', './src/index.ts'],
				rollupTypes: true
			})
		];
	}

	return config;
});
