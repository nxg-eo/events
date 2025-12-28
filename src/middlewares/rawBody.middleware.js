/**
 * Raw Body Middleware
 * Required for webhook signature verification
 * Must be applied BEFORE express.json() middleware
 */
module.exports = (req, res, next) => {
    // Store raw body for signature verification
    let data = '';
    req.setEncoding('utf8');

    req.on('data', (chunk) => {
        data += chunk;
    });

    req.on('end', () => {
        req.rawBody = data;
        next();
    });

    req.on('error', (err) => {
        console.error('Raw body parsing error:', err);
        next(err);
    });
};
