import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent"; // Import SOCKS5 proxy agent
import { readAccounts, saveToken } from "./file.js";
import { logger } from "./logger.js";

async function makeAxiosRequest(url, payload, proxy, headers) {
    const agent = proxy ? new SocksProxyAgent(proxy) : undefined; // Configure SOCKS5 proxy
    return axios.post(url, payload, {
        headers,
        httpAgent: agent,
        httpsAgent: agent, // Support HTTPS
    });
}

async function registerUser(email, password, proxy = null) {
    const url = "https://api.oasis.ai/internal/authSignup?batch=1";
    const payload = {
        "0": {
            "json": {
                email: email,
                password: password,
                referralCode: "zlketh",
            },
        },
    };
    const headers = { "Content-Type": "application/json" };

    try {
        const response = await makeAxiosRequest(url, payload, proxy, headers);
        if (response.data[0].result) {
            logger("Register successful:", email);
            logger("Check your inbox for the verification email");
            return true;
        }
    } catch (error) {
        logger(`Register error for ${email}:`, error.response ? error.response.data[0] : error.response.statusText, "error");
        return null;
    }
}

async function loginUser(email, password, proxy = null) {
    const url = "https://api.oasis.ai/internal/authLogin?batch=1";
    const payload = {
        "0": {
            "json": {
                email: email,
                password: password,
                rememberSession: true,
            },
        },
    };
    const headers = { "Content-Type": "application/json" };

    try {
        const response = await makeAxiosRequest(url, payload, proxy, headers);
        logger("Login successful:", email);
        return response.data[0].result.data.json.token;
    } catch (error) {
        logger(`Login error for ${email}:`, error.response ? error.response.data[0] : error.response.statusText, "error");
        logger("Please check your inbox to verify your email", email, "error");
        return null;
    }
}

export async function loginFromFile(filePath) {
    try {
        const accounts = await readAccounts(filePath);
        const proxies = await readAccounts("proxy.txt"); // Load proxies from file
        let successCount = 0;

        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const proxy = proxies[i] || null;

            logger(`Attempting login for ${account.email} using proxy ${proxy}`);
            const token = await loginUser(account.email, account.password, proxy);

            if (token) {
                saveToken("tokens.txt", token);
                successCount++;
            } else {
                logger(`Attempting to register ${account.email} using proxy ${proxy}`);
                await registerUser(account.email, account.password, proxy);
            }
        }

        if (successCount > 0) {
            logger(`${successCount}/${accounts.length} accounts successfully logged in.`);
            return true;
        } else {
            logger("All accounts failed to log in.", "", "error");
            return false;
        }
    } catch (error) {
        logger("Error reading accounts or processing logins:", error, "error");
        return false;
    }
}
