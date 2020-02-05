/**
 * Normalize a port into a number, string, or false.
 */

export default function normalizePort(val: string | number) {
	let port: number;
	if (typeof val != 'number') {
		port = parseInt(val, 10);
	}
	else {
		port = val;
	}

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}