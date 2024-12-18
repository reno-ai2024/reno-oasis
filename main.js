import { readToken, delay } from "./utils/file.js";
import { createConnection } from "./utils/websocket.js";
import { showBanner } from "./utils/banner.js";
import { logger } from "./utils/logger.js";
import { SocksProxyAgent } from "socks-proxy-agent";

async function start() {
    showBanner();
    const tokens = await readToken("providers.txt");
    const proxies = await readToken("proxy.txt");

    if (proxies.length < tokens.length) {
        logger("Not enough proxies for the number of Providers. Exiting...");
        return;
    }

    // Create connections with 1 proxy per token
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const proxy = proxies[i];

        try {
            const agent = new SocksProxyAgent(proxy);
            await createConnection(token, { agent });
            logger(`Successfully connected using proxy: ${proxy}`);
        } catch (error) {
            logger(`Failed to connect using proxy: ${proxy} - Error: ${error.message}`);
        }

        await delay(5000);
    }
}

start();
