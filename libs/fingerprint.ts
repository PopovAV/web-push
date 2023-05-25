export async function InterceptFetch(fingerPrint: string | null) {

    if (!global['window']) return null;

    let fp: string | null;

    if (fingerPrint != null) {
        window.localStorage.setItem("x-fingerprint", fingerPrint);
        fp = fingerPrint
    }
    else {
        fp = window.localStorage.getItem("x-fingerprint");
    }

    if (fp != null) {
        const { fetch: originalFetch } = window;
        window.fetch = async (...args) => {
            let [resource, config] = args;
            // request interceptor here
            if (config != null) {
                if (config.headers == null) {
                    config.headers = {} ;
                }
                config.headers = {...config.headers,  ... { 'x-finger-print': fp??"" } }
            }
            const response = await originalFetch(resource, config);
            // response interceptor here
            return response;
        };
    }

    return fp;
}