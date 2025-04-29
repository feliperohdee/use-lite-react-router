import { useContext } from 'react';
import routerContext from '@/router/context';

const useRouter = () => {
	const context = useContext(routerContext);

	if (!context.state?.path) {
		throw new Error('useRouter must be used within a Routes');
	}

	return {
		...context.state,
		back: context.back,
		navigate: context.navigate
	};
};

export default useRouter;
