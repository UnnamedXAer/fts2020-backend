import { app } from './app';
import normalizePort from './utils/normalizePort';

var PORT = normalizePort(process.env.PORT || 3330);
const server = require('http').createServer(app);


server.listen(PORT, () => {
    console.log(
        'Server is listening on: ',
        `${
            process.env.HOSTING == 'LOCAL' ? 'https' : 'http'
        }://localhost:${PORT}`
    );
});
