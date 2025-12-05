'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';

export default function Success() {
    const router = useRouter();
    const { refreshAccessToken } = useAuth();

    useEffect(() => {
        const init = async () => {
            // Refresh token to get access token immediately
            await refreshAccessToken();
            router.push('/');
        };
        init();
    }, [router, refreshAccessToken]);

    return <Spinner fullScreen={true} message="Logging you in..." />;
}
