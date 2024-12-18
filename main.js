import { readToken, delay } from "./utils/file.js";
import { createConnection } from "./utils/websocket.js";
import { showBanner } from "./utils/banner.js";
import { logger } from "./utils/logger.js";

async function start() {
    showBanner();
    const tokens = await readToken("providers.txt");
    const proxies = await readToken("proxy.txt"); // Proxies should be in the SOCKS5 format: socks5://127.0.0.1:1080

    if (proxies.length < tokens.length) {
        logger("Not enough proxies for the number of Providers. Exiting...");
        return;
    }

    // Create connections with 1 proxy per token
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const proxy = proxies[i]; 

        await createConnection(token, proxy); // Pass SOCKS5 proxy to WebSocket connection
        await delay(5000);
    }
}

start();
