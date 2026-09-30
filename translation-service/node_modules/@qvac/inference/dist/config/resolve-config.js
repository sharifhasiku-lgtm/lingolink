/**
 * Config loader for Bare runtime
 * Uses bare-fs and bare-path modules
 */
import fs from 'bare-fs';
import path from 'bare-path';
import os from 'bare-os';
import env from 'bare-env';
import { pathToFileURL } from 'bare-url';
import { validateConfig } from './config-utils.js';
import { ConfigFileInvalidError, ConfigFileParseFailedError } from '../errors/index.js';
import { getAppLogger } from '../logging/index.js';
const SUPPORTED_CONFIG_FILE_EXTS = ['.js', '.json'];
const logger = getAppLogger();
function findProjectRoot() {
    return os.cwd();
}
function fileExists(filePath) {
    return fs.existsSync(filePath);
}
function assertBareConfigExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_CONFIG_FILE_EXTS.includes(ext)) {
        throw new ConfigFileInvalidError(filePath, 'Given config file format unsupported on this platform. Use qvac.config.js or qvac.config.json in the project root, or set QVAC_CONFIG_PATH to a .js or .json file.');
    }
}
async function loadConfigFromPath(filePath) {
    assertBareConfigExtension(filePath);
    try {
        const mod = (await import(pathToFileURL(filePath).href));
        return validateConfig(mod.default ?? mod);
    }
    catch (error) {
        throw new ConfigFileParseFailedError(filePath, error instanceof Error ? error.message : String(error), error);
    }
}
function findConfigFile(searchDir) {
    const configFiles = SUPPORTED_CONFIG_FILE_EXTS.map((ext) => `qvac.config${ext}`);
    for (const name of configFiles) {
        const filePath = path.resolve(searchDir, name);
        if (fileExists(filePath)) {
            return filePath;
        }
    }
    return undefined;
}
/**
 * Resolution order for Bare:
 * 1. QVAC_CONFIG_PATH environment variable
 * 2. Config file in project root (qvac.config.js, qvac.config.json)
 * 3. built-in defaults
 */
export async function resolveConfig() {
    const configPath = env['QVAC_CONFIG_PATH'];
    if (configPath) {
        const normalizedPath = path.resolve(configPath);
        if (fileExists(normalizedPath)) {
            const config = await loadConfigFromPath(normalizedPath);
            logger.info(`✅ Loaded config from: ${normalizedPath}`);
            return config;
        }
    }
    const projectRoot = findProjectRoot();
    if (projectRoot) {
        const configFilePath = findConfigFile(projectRoot);
        if (configFilePath) {
            const config = await loadConfigFromPath(configFilePath);
            logger.info(`✅ Loaded config from: ${configFilePath}`);
            return config;
        }
    }
    logger.info('ℹ️ No config file found, using built-in defaults');
    return undefined;
}
