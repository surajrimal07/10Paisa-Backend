/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

class TokenParser {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const filePath = path.join(__dirname, './css.wasm');

        this.filePath = filePath;
        this.runtimePromise = fs.promises.readFile(filePath)
            .then(buffer => Promise.all([WebAssembly.compile(buffer), WebAssembly.instantiate(buffer)]))
            .then(([module, instance]) => {
                this.runtime = instance;
            })
            .catch(error => {
                console.error('Error loading css.wasm:', error);
            });
    }

    parseTokenResponse(tokenResponse) {
        const salts = [
            tokenResponse.salt1,
            tokenResponse.salt2,
            tokenResponse.salt3,
            tokenResponse.salt4,
            tokenResponse.salt5
        ];

        const n = this.runtime.instance.exports.cdx(...salts);
        const l = this.runtime.instance.exports.rdx(...salts.slice(0, 4), salts[4]);
        const o = this.runtime.instance.exports.bdx(...salts.slice(0, 4), salts[4]);
        const p = this.runtime.instance.exports.ndx(...salts.slice(0, 4), salts[4]);
        const q = this.runtime.instance.exports.mdx(...salts.slice(0, 4), salts[4]);

        const a = this.runtime.instance.exports.cdx(salts[1], salts[0], ...salts.slice(2, 4), salts[4]);
        const b = this.runtime.instance.exports.rdx(salts[1], salts[0], ...salts.slice(2, 4), salts[4]);
        const c = this.runtime.instance.exports.bdx(salts[1], salts[0], ...salts.slice(2, 4), salts[4]);
        const d = this.runtime.instance.exports.ndx(salts[1], salts[0], ...salts.slice(2, 4), salts[4]);
        const e = this.runtime.instance.exports.mdx(salts[1], salts[0], ...salts.slice(2, 4), salts[4]);

        const accessToken = tokenResponse.accessToken;
        const refreshToken = tokenResponse.refreshToken;

        const parsedAccessToken =
            accessToken.slice(0, n) +
            accessToken.slice(n + 1, l) +
            accessToken.slice(l + 1, o) +
            accessToken.slice(o + 1, p) +
            accessToken.slice(p + 1, q) +
            accessToken.slice(q + 1);

        const parsedRefreshToken =
            refreshToken.slice(0, a) +
            refreshToken.slice(a + 1, b) +
            refreshToken.slice(b + 1, c) +
            refreshToken.slice(c + 1, d) +
            refreshToken.slice(d + 1, e) +
            refreshToken.slice(e + 1);

        return [parsedAccessToken, parsedRefreshToken, salts];
    }
}

export default class TokenManager {
    constructor(nepse) {
        this.nepse = nepse;
        this.MAX_UPDATE_PERIOD = 45;
        this.tokenParser = new TokenParser();
        this.tokenUrl = '/api/authenticate/prove';
        this.refreshUrl = '/api/authenticate/refresh-token';
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenTimeStamp = null;
        this.salts = null;
    }

    isTokenValid() {
        return (
            this.tokenTimeStamp !== null &&
            (Date.now() - this.tokenTimeStamp) < this.MAX_UPDATE_PERIOD * 1000
        );
    }

    getAccessToken() {
        return this.isTokenValid() ? this.accessToken : this.update() || this.accessToken;
    }

    getRefreshToken() {
        return this.isTokenValid() ? this.refreshToken : this.update() || this.refreshToken;
    }

    async update() {
        await this._setToken();
    }

    async _setToken() {
        const tokenResponse = await this._getTokenHttpRequest();
        const [accessToken, refreshToken, salts] = this.tokenParser.parseTokenResponse(tokenResponse);

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.salts = salts;
        this.tokenTimeStamp = Math.floor(Date.now() / 1000);

        return { accessToken, refreshToken, salts };
    }

    async _getTokenHttpRequest() {

        const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const token_url = await fetch("https://www.nepalstock.com/api/authenticate/prove", {
            "credentials": "omit",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.5",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Sec-GPC": "1"
            },
            "referrer": "https://www.nepalstock.com/",
            "method": "GET",
            "mode": "cors"
        });


        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
        return await token_url.json();
    }
}
