import { type Request, type Response, type NextFunction } from 'express';
import logger from '../utils/logger.js';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        logger.http(`${method} ${url} ${statusCode} ${duration}ms`);
    });

    next();
};
