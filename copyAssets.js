const fs = require('fs/promises');
const path = require('path');

async function copyAssets(srcPath, descPath) {
	console.log('About to copy assets dir to', descPath);
	try {
		await fs.rmdir(descPath, { recursive: true });
		console.log('Old assets directory removed.');
		await copyDirFiles(srcPath, descPath);
		console.log('Assets were copied successfully.');
	} catch (err) {
		console.log('Unable to copy assets due to following error: \n', err);
	}
}

async function copyDirFiles(srcPath, descPath) {
	try {
		console.log('\tabout to create dir:', descPath);
		try {
			await fs.mkdir(descPath);
		} catch (err) {
			console.log('\terror while creating dir: ', descPath, err);
			// do nothing, path probably exists
		}
		const dirs = await fs.readdir(srcPath);
		await Promise.all(
			dirs.map(async (dir) => {
				const srcDir = path.resolve(srcPath, dir);
				const descDir = path.resolve(descPath, dir);

				const access = await isDirAccessible(srcDir);
				if (access) {
					if ((await fs.lstat(srcDir)).isDirectory()) {
						return copyDirFiles(srcDir, descDir);
					}
					console.log('\tabout to copy file to:', descDir);
					return fs.copyFile(srcDir, descDir);
				}
				return;
			})
		);
	} catch (err) {
		throw err;
	}
}

async function isDirAccessible(dir) {
	try {
		await fs.access(dir);
		return true;
	} catch (err) {
		return false;
	}
}

copyAssets('./src/assets', './dist/assets');
