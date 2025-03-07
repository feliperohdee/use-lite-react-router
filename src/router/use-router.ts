import { useContext } from 'react';
import routerContext from '@/router/context';

const useRouter = () => {
	const context = useContext(routerContext);

	if (!context.path) {
		throw new Error('useRouter must be used within a Routes');
	}

	return context;
};

export default useRouter;
