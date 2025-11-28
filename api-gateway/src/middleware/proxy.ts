import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { JwtPayload } from "shared";
import jwt from "jsonwebtoken";


/**
 * Verify and extract JWT access token from WebSocket URL
 * @param url 
 * @returns 
 */
const verifyAccessTokenWs = (url: URL) => {
    const token = url.searchParams.get('token')!;
    const { userId, userRole } = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    return { userId, userRole };
}

export function httpProxy(targetUrl: string, route?: string) {
    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: route
            ? (path, req) => `${route}${path}`
            : undefined,
        on: {
            proxyReq: (proxyReq, req, res) => {
                const host = (req as any).headers?.host || '';
                console.log(`[Proxy] ${req.method} ${host}${req.url}`);
                fixRequestBody(proxyReq, req);
            },
            proxyRes: (proxyRes, req, res) => {
                const host = (req as any).headers?.host || '';
                console.log(`[Proxy Response] ${proxyRes.statusCode} for ${req.method} ${host}${req.url}`);

                // Log redirect details
                if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
                    const location = proxyRes.headers['location'];
                    if (location) {
                        console.log(`[Proxy Redirect] Redirecting to: ${location}`);
                    }
                }
            },
            error: (err, req, res) => {
                const host = (req as any).headers?.host || '';
                console.error(`[Proxy Error] ${req.method} ${host}${req.url}:`, err.message);
            }
        }
    });
}

export function wsProxy(target: string, route: string) {
    return createProxyMiddleware({
        target: target,
        changeOrigin: true,
        ws: true,
        pathFilter: (pathname) => {
            return pathname.startsWith(route);
        },
        on: {
            proxyReqWs: (proxyReq, req, socket, options, head) => {
                try {
                    const url = new URL(req.url!, `http://${req.headers.host}`);
                    const { userId, userRole } = verifyAccessTokenWs(url);
                    console.log(`WS Proxy authenticated user: `, { userId, userRole });
                    proxyReq.setHeader('x-user-id', userId);
                    proxyReq.setHeader('x-user-role', userRole!);
                } catch (err) {
                    console.error("JWT error in WS proxy: ", err);
                    socket.destroy();
                    return;
                }
            },
            error: (err, req, res) => {
                console.error(`[Proxy Error] ${req.url}:`, err.message);
            }
        }
    });
}